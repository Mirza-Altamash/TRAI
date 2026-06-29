import { Bell, ChevronDown, LogOut, ShieldCheck, KeyRound } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "@/services/mock";
import { formatIstDateTime } from "@/lib/format";
import { useState, useEffect } from "react";
import { ChangePasswordDialog } from "@/components/common/ChangePasswordDialog";
import { toast } from "sonner";

export function TopBar() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [cpOpen, setCpOpen] = useState(false);
  const { data: notes = [] } = useQuery({
    queryKey: ["notifications"], queryFn: listNotifications,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    let active = true;
    import("@/lib/socketClient").then(({ getSocket }) => {
      if (!active) return;
      const socket = getSocket();
      if (socket) {
        const handleNotif = (notif: any) => {
          qc.invalidateQueries({ queryKey: ["notifications"] });
          toast.info(notif.title, {
            description: notif.description,
          });
        };
        socket.on("notification", handleNotif);
        return () => {
          socket.off("notification", handleNotif);
        };
      }
    });
    return () => {
      active = false;
    };
  }, [qc]);
  const unread = notes.filter(n => !n.read).length;
  const user = session?.user;
  const initials = user?.name.split(" ").map(s => s[0]).slice(0, 2).join("") ?? "?";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-foreground">TRAI Portal</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Complaint & Workflow</div>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu
          onOpenChange={(o) => {
            if (o && unread > 0) {
              qc.setQueryData<typeof notes>(["notifications"], (prev) =>
                (prev ?? []).map((n) => ({ ...n, read: true })),
              );
              void markAllNotificationsRead().then(() => {
                qc.invalidateQueries({ queryKey: ["notifications"] });
              });
            }
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <Badge className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-warn px-1 text-[10px] text-warn-foreground">
                  {unread}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notes.length === 0 && <div className="px-3 py-6 text-center text-xs text-muted-foreground">No notifications</div>}
            {notes.map(n => (
              <DropdownMenuItem
                key={n.id}
                className={`flex flex-col items-start gap-0.5 ${!n.read ? "bg-accent/40" : ""}`}
                onClick={() => {
                  qc.setQueryData<typeof notes>(["notifications"], (prev) =>
                    (prev ?? []).map((x) => (x.id === n.id ? { ...x, read: true } : x)),
                  );
                  void markNotificationRead(n.id);
                  if (n.ticketId) navigate({ to: "/tickets/$ticketId", params: { ticketId: n.ticketId } });
                }}
              >
                <div className="text-sm font-medium flex items-center gap-2">
                  {!n.read && <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />}
                  {n.title}
                </div>
                <div className="text-xs text-muted-foreground">{n.description}</div>
                <div className="text-[10px] text-muted-foreground">{formatIstDateTime(n.createdAt)}</div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-7 w-7"><AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback></Avatar>
              <div className="hidden text-left text-xs leading-tight md:block">
                <div className="font-medium text-foreground">{user?.name}</div>
                <div className="text-muted-foreground">{user?.role}{user?.subRole ? ` · ${user.subRole}` : ""}</div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="text-sm">{user?.name}</div>
              <div className="text-xs font-normal text-muted-foreground">{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setCpOpen(true)}><KeyRound className="mr-2 h-4 w-4" /> Change Password</DropdownMenuItem>
            <DropdownMenuItem onClick={() => { signOut(); navigate({ to: "/login" }); }}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ChangePasswordDialog open={cpOpen} onOpenChange={setCpOpen} />
    </header>
  );
}
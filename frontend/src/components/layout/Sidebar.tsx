import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";
import { useAuth } from "@/lib/auth";
import {
  BarChart3,
  ClipboardList,
  FileText,
  Gauge,
  LayoutDashboard,
  ListChecks,
  PlusCircle,
  ShieldCheck,
  UserCircle,
  Users,
  History,
  TimerReset,
  Inbox,
  ChevronDown,
  ChevronRight,
  Folder,
  Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const NAV: Record<Role, NavItem[]> = {
  ADMIN: [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/totalticket", label: "Total Tickets", icon: Inbox },
    { to: "/admin/priority", label: "Priority Tickets", icon: Star },
    { to: "/admin/employees", label: "Employees", icon: Users },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/admin/reports", label: "Reports & Export", icon: FileText },
    { to: "/admin/audit", label: "Audit Logs", icon: History },
    { to: "/admin/sla", label: "SLA Dashboard", icon: TimerReset },
    { to: "/admin/mis", label: "MIS Reports", icon: ClipboardList },
  ],
  USER: [
    { to: "/user/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/user/tickets", label: "My Tickets", icon: ListChecks },
    { to: "/user/tickets/new", label: "Raise Ticket", icon: PlusCircle },
    { to: "/user/profile", label: "Profile", icon: UserCircle },
  ],
  L2: [
    { to: "/l2/dashboard", label: "Dashboard", icon: Gauge },
    { to: "/l2/tickets", label: "Assigned Tickets", icon: ListChecks },
    { to: "/l2/profile", label: "Profile", icon: UserCircle },
  ],
  L3: [
    { to: "/l3/dashboard", label: "Dashboard", icon: Gauge },
    { to: "/l3/tickets", label: "Assigned Tickets", icon: ListChecks },
    { to: "/l3/profile", label: "Profile", icon: UserCircle },
  ],
};

export function Sidebar({ role }: { role: Role }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  let items = NAV[role];
  if (role === "L3") {
    const adminItems = NAV.ADMIN.filter(
      (item) => item.to !== "/admin/sla" && item.to !== "/admin/priority",
    );
    items = [...adminItems];
  } else if (role === "ADMIN") {
    items = NAV.ADMIN.filter((item) => item.to !== "/admin/sla");
  } else if (role === "L2") {
    items = [
      { to: "/l2/assignments", label: "Assignments", icon: ListChecks },
      { to: "/l2/tickets/new", label: "Raise Ticket", icon: PlusCircle },
      { to: "/l2/raised", label: "My Raised Tickets", icon: Inbox },
      { to: "/l2/profile", label: "Profile", icon: UserCircle },
    ];
  }

  const reportRoutes = ["/admin/analytics", "/admin/reports", "/admin/mis", "/admin/audit"];
  const topLevelItems = items.filter((item) => !reportRoutes.includes(item.to));
  const subItems = items.filter((item) => reportRoutes.includes(item.to));

  // Determine if active path falls inside sub-items to auto-expand it!
  const hasActiveSubItem = subItems.some(
    (item) => pathname === item.to || pathname.startsWith(item.to + "/"),
  );
  const [isReportsOpen, setIsReportsOpen] = useState(hasActiveSubItem);

  const { session } = useAuth();
  const getSubRoleLabel = (sub: string | null | undefined) => {
    if (!sub) return "Member";
    if (sub === "J.Adv") return "JADV";
    if (sub === "D.Adv") return "DADV";
    if (sub === "Adv") return "ADV";
    return sub;
  };
  const workspaceLabel = `${getSubRoleLabel(session?.user?.subRole)} Workspace`;

  const l3PersonalItems = [
    { to: "/l3/assignments", label: "My Assignments", icon: ListChecks },
    { to: "/admin/tickets/new", label: "Raise Ticket", icon: PlusCircle },
    { to: "/l3/raised", label: "My Raised Tickets", icon: Inbox },
    { to: "/l3/priority", label: "My Priority Tickets", icon: Star },
  ];

  const shouldBeOpen = isReportsOpen || hasActiveSubItem;
  const portalLabel = role === "L3" ? "L3 Admin" : role;

  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-1 border-r border-sidebar-border bg-sidebar px-3 py-4 text-sidebar-foreground lg:flex">
      <div className="mb-3 flex items-center gap-2 px-2 text-xs uppercase tracking-wider text-sidebar-foreground/70">
        <ShieldCheck className="h-3.5 w-3.5" /> {portalLabel} Portal
      </div>
      <nav className="flex flex-col gap-0.5">
        {/* Render L2 Header */}
        {role === "L2" && (
          <div className="mb-2 flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/60">
            <Folder className="h-3.5 w-3.5" /> {workspaceLabel}
          </div>
        )}

        {/* Render Top Level flat items */}
        {topLevelItems.map((item) => {
          let displayLabel = item.label;
          if (item.to === "/admin/employees") {
            displayLabel = "User Management";
          }
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {displayLabel}
            </Link>
          );
        })}

        {/* Collapsible Section for reports */}
        {(role === "ADMIN" || role === "L3") && subItems.length > 0 && (
          <div className="mt-1">
            <button
              onClick={() => setIsReportsOpen(!isReportsOpen)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <span className="flex items-center gap-2.5">
                <Folder className="h-4 w-4" />
                Reports &amp; Miscellaneous
              </span>
              {shouldBeOpen ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
            {shouldBeOpen && (
              <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-sidebar-border pl-2.5">
                {subItems.map((item) => {
                  const active = pathname === item.to || pathname.startsWith(item.to + "/");
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <item.icon className="h-3.5 w-3.5 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Render L3 Workspace Header and Links */}
        {role === "L3" && (
          <>
            <div className="mt-4 mb-2 flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/60 border-t border-sidebar-border/30 pt-4">
              <Folder className="h-3.5 w-3.5" /> {workspaceLabel}
            </div>
            {l3PersonalItems.map((item) => {
              const active = pathname === item.to || pathname.startsWith(item.to + "/");
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>
    </aside>
  );
}

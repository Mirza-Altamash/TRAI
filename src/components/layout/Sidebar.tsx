import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";
import {
  BarChart3, ClipboardList, FileText, Gauge, LayoutDashboard, ListChecks,
  PlusCircle, ShieldCheck, UserCircle, Users, History, TimerReset, Inbox,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem { to: string; label: string; icon: LucideIcon }

const NAV: Record<Role, NavItem[]> = {
  ADMIN: [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/totalticket", label: "Total Tickets", icon: Inbox },
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
  const pathname = useRouterState({ select: s => s.location.pathname });
  
  let items = NAV[role];
  if (role === "L3") {
    const adminItems = NAV.ADMIN.filter(item => item.to !== "/admin/sla");
    items = [
      ...adminItems,
      { to: "/admin/l3-tickets", label: "My L3 Tickets", icon: ListChecks }
    ];
  } else if (role === "ADMIN") {
    items = NAV.ADMIN.filter(item => item.to !== "/admin/sla");
  }

  const portalLabel = role === "L3" ? "L3 Admin" : role;

  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-1 border-r border-sidebar-border bg-sidebar px-3 py-4 text-sidebar-foreground lg:flex">
      <div className="mb-3 flex items-center gap-2 px-2 text-xs uppercase tracking-wider text-sidebar-foreground/70">
        <ShieldCheck className="h-3.5 w-3.5" /> {portalLabel} Portal
      </div>
      <nav className="flex flex-col gap-0.5">
        {items.map(item => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to} to={item.to}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
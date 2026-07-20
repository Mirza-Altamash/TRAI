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

// ─── ADMIN oversight items (shared by ADMIN advisors) ────────────────────────
const ADMIN_OVERSIGHT: NavItem[] = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/totalticket", label: "Total Tickets", icon: Inbox },
  { to: "/admin/priority", label: "Priority Tickets", icon: Star },
  { to: "/admin/employees", label: "User Management", icon: Users },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/reports", label: "Reports & Export", icon: FileText },
  { to: "/admin/audit", label: "Audit Logs", icon: History },
  { to: "/admin/mis", label: "MIS Reports", icon: ClipboardList },
];

// ─── ADVISOR oversight (no user management, no audit - those are IT only) ────
const ADVISOR_OVERSIGHT: NavItem[] = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/totalticket", label: "Total Tickets", icon: Inbox },
  { to: "/admin/priority", label: "Priority Tickets", icon: Star },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/reports", label: "Reports & Export", icon: FileText },
  { to: "/admin/mis", label: "MIS Reports", icon: ClipboardList },
];

// ─── Personal workspace items (used by ADMIN advisors AND L3) ────────────────
const PERSONAL_WORKSPACE: NavItem[] = [
  { to: "/l3/assignments", label: "My Assignments", icon: ListChecks },
  { to: "/admin/tickets/new", label: "Raise Ticket", icon: PlusCircle },
  { to: "/l3/raised", label: "My Raised Tickets", icon: Inbox },
  { to: "/l3/priority", label: "My Priority Tickets", icon: Star },
];

const REPORT_ROUTES = ["/admin/analytics", "/admin/reports", "/admin/mis", "/admin/audit"];

export function Sidebar({ role }: { role: Role }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session } = useAuth();
  const subRole = session?.user?.subRole;

  // Every ADMIN in this system is a senior officer (Advisor/Chairman/Member/Secretary)
  // They all get the Advisor workspace + oversight view
  const isAdmin = role === "ADMIN";
  const isL3 = role === "L3";
  const isL2 = role === "L2";

  // ─── Build nav items ────────────────────────────────────────────────────────
  let oversightItems: NavItem[] = [];
  if (isAdmin) {
    oversightItems = ADVISOR_OVERSIGHT;
  } else if (isL3) {
    oversightItems = ADMIN_OVERSIGHT.filter((i) => i.to !== "/admin/sla");
  } else if (isL2) {
    oversightItems = [
      { to: "/l2/assignments", label: "Assignments", icon: ListChecks },
      { to: "/l2/tickets/new", label: "Raise Ticket", icon: PlusCircle },
      { to: "/l2/raised", label: "My Raised Tickets", icon: Inbox },
      { to: "/l2/profile", label: "Profile", icon: UserCircle },
    ];
  } else {
    // USER
    oversightItems = [
      { to: "/user/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/user/tickets", label: "My Tickets", icon: ListChecks },
      { to: "/user/tickets/new", label: "Raise Ticket", icon: PlusCircle },
      { to: "/user/profile", label: "Profile", icon: UserCircle },
    ];
  }

  const topItems = oversightItems.filter((i) => !REPORT_ROUTES.includes(i.to));
  const reportItems = oversightItems.filter((i) => REPORT_ROUTES.includes(i.to));

  const hasActiveReport = reportItems.some(
    (i) => pathname === i.to || pathname.startsWith(i.to + "/"),
  );
  const [isReportsOpen, setIsReportsOpen] = useState(hasActiveReport);
  const reportsExpanded = isReportsOpen || hasActiveReport;

  // ─── Labels ─────────────────────────────────────────────────────────────────
  const getSubRoleLabel = (sub: string | null | undefined): string => {
    if (!sub) return "Advisor";
    if (sub === "J.Adv" || sub === "JAdv") return "Jt. Advisor";
    if (sub === "D.Adv" || sub === "DAdv") return "Dy. Advisor";
    if (sub === "Adv") return "Advisor";
    if (sub === "Pr.Adv") return "Pr. Advisor";
    if (sub === "Sr.Adv") return "Sr. Advisor";
    if (sub === "SRO") return "SRO";
    if (sub === "TO") return "TO";
    if (sub === "SO") return "SO";
    return sub;
  };

  const portalLabel =
    isAdmin ? "Advisor" :
    isL3 ? getSubRoleLabel(subRole) :
    isL2 ? getSubRoleLabel(subRole) :
    "User";

  const workspaceLabel = `${getSubRoleLabel(subRole)} Workspace`;

  const navLink = (item: NavItem) => {
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
  };

  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-1 border-r border-sidebar-border bg-sidebar px-3 py-4 text-sidebar-foreground lg:flex">
      <div className="mb-3 flex items-center gap-2 px-2 text-xs uppercase tracking-wider text-sidebar-foreground/70">
        <ShieldCheck className="h-3.5 w-3.5" /> {portalLabel} Portal
      </div>

      <nav className="flex flex-col gap-0.5">

        {/* ── L2 workspace label ──────────────────────────────── */}
        {isL2 && (
          <div className="mb-2 flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/60">
            <Folder className="h-3.5 w-3.5" /> {workspaceLabel}
          </div>
        )}

        {/* ── Top-level navigation items ──────────────────────── */}
        {topItems.map(navLink)}

        {/* ── Collapsible Reports section (ADMIN + L3) ─────────── */}
        {(isAdmin || isL3) && reportItems.length > 0 && (
          <div className="mt-1">
            <button
              onClick={() => setIsReportsOpen(!isReportsOpen)}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            >
              <span className="flex items-center gap-2.5">
                <Folder className="h-4 w-4" />
                Reports & Miscellaneous
              </span>
              {reportsExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
            {reportsExpanded && (
              <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-sidebar-border pl-2.5">
                {reportItems.map((item) => {
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

        {/* ── ADMIN Advisor Personal Workspace ────────────────── */}
        {isAdmin && (
          <>
            <div className="mt-4 mb-2 flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/60 border-t border-sidebar-border/30 pt-4">
              <Folder className="h-3.5 w-3.5" /> My Workspace
            </div>
            {PERSONAL_WORKSPACE.map(navLink)}
          </>
        )}

        {/* ── L3 Personal Workspace ───────────────────────────── */}
        {isL3 && (
          <>
            <div className="mt-4 mb-2 flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/60 border-t border-sidebar-border/30 pt-4">
              <Folder className="h-3.5 w-3.5" /> {workspaceLabel}
            </div>
            {PERSONAL_WORKSPACE.map(navLink)}
          </>
        )}

      </nav>
    </aside>
  );
}

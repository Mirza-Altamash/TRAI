import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, CheckCircle2, Inbox, Users, XCircle, Clock, Star } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { MetricCard } from "@/components/common/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketTable } from "@/components/common/TicketTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAdminMetrics, listTickets, listEmployees } from "@/services/mock";
import { getAdminPriorityTickets, getGlobalPriorityCount } from "@/services/ticketApi";
import { useState, useEffect } from "react";
import type { TicketStatus } from "@/types";

export const Route = createFileRoute("/_app/admin/dashboard")({ component: AdminDashboard });

function AdminDashboard() {
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "Assigned" | "Priority" | null>(
    null,
  );

  // Search & Filter input states
  const [search, setSearch] = useState("");
  const [division, setDivision] = useState("");
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState("");
  const [type, setType] = useState("");

  const { data: m } = useQuery({ queryKey: ["admin", "metrics"], queryFn: getAdminMetrics });

  const { data: priorityCountData } = useQuery({
    queryKey: ["priority-count", "global"],
    queryFn: getGlobalPriorityCount,
  });

  // Fetch L2/L3 employees for assignment filter
  const { data: usersData } = useQuery({
    queryKey: ["employees", { pageSize: 1000 }],
    queryFn: () => listEmployees({ pageSize: 1000 }),
    enabled: statusFilter !== null,
  });
  const assignees = usersData?.rows.filter((e) => e.role === "L2" || e.role === "L3") ?? [];

  const isPriorityFilter = statusFilter === "Priority";

  const { data: recent } = useQuery({
    queryKey: isPriorityFilter
      ? [
          "priority-tickets",
          "global",
          {
            search: search || undefined,
            division: division || undefined,
            assignee: assignee || undefined,
            priority: priority || undefined,
            type: type || undefined,
            page: 1,
            pageSize: 50,
          },
        ]
      : [
          "tickets",
          {
            status: statusFilter ?? undefined,
            search: search || undefined,
            division: division || undefined,
            assignee: assignee || undefined,
            priority: priority || undefined,
            type: type || undefined,
            page: 1,
            pageSize: statusFilter ? 50 : 8,
          },
        ],
    queryFn: () =>
      isPriorityFilter
        ? getAdminPriorityTickets({
            search: search || undefined,
            division: division || undefined,
            assignee: assignee || undefined,
            priority: priority || undefined,
            type: type || undefined,
            page: 1,
            pageSize: 50,
          })
        : listTickets({
            status: statusFilter ?? undefined,
            search: search || undefined,
            division: division || undefined,
            assignee: assignee || undefined,
            priority: priority || undefined,
            type: type || undefined,
            page: 1,
            pageSize: statusFilter ? 50 : 8,
          }),
  });

  useEffect(() => {
    let active = true;
    import("@/lib/socketClient").then(({ getSocket }) => {
      if (!active) return;
      const socket = getSocket();
      if (socket) {
        const onPriorityUpdated = () => {
          qc.invalidateQueries({ queryKey: ["priority-count", "global"] });
          qc.invalidateQueries({ queryKey: ["priority-tickets", "global"] });
        };
        socket.on("ticket:priority-updated", onPriorityUpdated);
        return () => {
          socket.off("ticket:priority-updated", onPriorityUpdated);
        };
      }
    });
    return () => {
      active = false;
    };
  }, [qc]);

  const toggleFilter = (status: TicketStatus | "Assigned" | "Priority") => {
    setStatusFilter((prev) => {
      const next = prev === status ? null : status;
      if (next === null) {
        // Reset all search/filter states when clearing the metric card status
        setSearch("");
        setDivision("");
        setAssignee("");
        setPriority("");
        setType("");
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        subtitle="System overview across all divisions and roles."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Total Tickets"
          value={m?.total ?? "—"}
          icon={Inbox}
          accent="primary"
          onClick={() => navigate({ to: "/admin/totalticket" })}
        />
        <MetricCard
          label="Open"
          value={m?.open ?? "—"}
          icon={Clock}
          accent="info"
          onClick={() => toggleFilter("Open")}
          hint={statusFilter === "Open" ? "Filter active" : undefined}
        />
        <MetricCard
          label="Resolved"
          value={m?.resolved ?? "—"}
          icon={CheckCircle2}
          accent="success"
          onClick={() => toggleFilter("Resolved")}
          hint={statusFilter === "Resolved" ? "Filter active" : undefined}
        />
        <MetricCard
          label="Closed"
          value={m?.closed ?? "—"}
          icon={XCircle}
          accent="warn"
          onClick={() => toggleFilter("Closed")}
          hint={statusFilter === "Closed" ? "Filter active" : undefined}
        />
        <MetricCard
          label="Priority"
          value={priorityCountData?.count ?? "—"}
          icon={Star}
          accent="warn"
          onClick={() => toggleFilter("Priority")}
          hint={statusFilter === "Priority" ? "Filter active" : undefined}
        />
        <MetricCard
          label="Users"
          value={m?.employees ?? "—"}
          icon={Users}
          accent="primary"
          onClick={() => navigate({ to: "/admin/employees" })}
        />
      </div>

      {statusFilter !== null && (
        <Card className="border border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[280px] space-y-1.5">
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search by ID, title, user, division, member..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="w-44 space-y-1.5">
                  <Label htmlFor="division">Division</Label>
                  <Select
                    value={division || "all"}
                    onValueChange={(v) => setDivision(v === "all" ? "" : v)}
                  >
                    <SelectTrigger id="division">
                      <SelectValue placeholder="All Divisions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Divisions</SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="NSL">NSL</SelectItem>
                      <SelectItem value="QoS">QoS</SelectItem>
                      <SelectItem value="B&CS">B&CS</SelectItem>
                      <SelectItem value="F&EA">F&EA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-52 space-y-1.5">
                  <Label htmlFor="assignee">Assigned Member</Label>
                  <Select
                    value={assignee || "all"}
                    onValueChange={(v) => setAssignee(v === "all" ? "" : v)}
                  >
                    <SelectTrigger id="assignee">
                      <SelectValue placeholder="All Members" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Members</SelectItem>
                      {assignees.map((emp) => (
                        <SelectItem key={emp.empId} value={emp.empId}>
                          {emp.name} ({emp.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-40 space-y-1.5">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={priority || "all"}
                    onValueChange={(v) => setPriority(v === "all" ? "" : v)}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="All Priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-44 space-y-1.5">
                  <Label htmlFor="type">Type/Category</Label>
                  <Select
                    value={type || "all"}
                    onValueChange={(v) => setType(v === "all" ? "" : v)}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="New Development">New Development</SelectItem>
                      <SelectItem value="Modification">Modification</SelectItem>
                      <SelectItem value="Reports">Reports</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-base">
            {statusFilter ? `${statusFilter} Tickets` : "Recent Tickets"}
          </CardTitle>
          {statusFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFilter(statusFilter)}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear filter
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <TicketTable
            rows={recent?.rows ?? []}
            showPriorityDetails={isPriorityFilter}
            onRowClick={(t) => router.navigate({ to: `/tickets/${t.ticketId}` })}
          />
        </CardContent>
      </Card>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketTable } from "@/components/common/TicketTable";
import { Pager } from "@/components/common/Pager";
import { MetricCard } from "@/components/common/MetricCard";
import { useCurrentUser } from "@/lib/auth";
import { listTickets } from "@/services/mock";
import { getAssigneeMetrics } from "@/services/reportApi";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Clock, CheckCircle2, XCircle, Search } from "lucide-react";
import type { TicketStatus } from "@/types";

export const Route = createFileRoute("/_app/l2/assignments")({ component: L2Assignments });

function L2Assignments() {
  const user = useCurrentUser();
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");

  // Fetch metrics scoped to assignee
  const { data: metrics } = useQuery({
    queryKey: ["metrics", user.empId, "assigned"],
    queryFn: () => getAssigneeMetrics(user.empId, "assigned")
  });

  // Fetch personal assigned tickets list
  const { data: ticketData } = useQuery({
    queryKey: ["tickets", { assignee: user.empId, page, status: statusFilter === "all" ? undefined : statusFilter, search: searchText || undefined }],
    queryFn: () => listTickets({
      assignee: user.empId,
      page,
      pageSize: 10,
      status: (statusFilter === "all" ? undefined : statusFilter) as any,
      search: searchText || undefined
    })
  });

  const designation = user.subRole || "L2";
  const workspaceTitle = "My Assigned Tickets";

  const handleMetricClick = (status: TicketStatus | "all") => {
    setStatusFilter(status);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader title={workspaceTitle} subtitle="Track and manage tickets assigned to you." />

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="Total Assigned"
          value={metrics?.assigned ?? "—"}
          icon={Activity}
          accent="primary"
          onClick={() => handleMetricClick("all")}
          hint={statusFilter === "all" ? "Showing all" : "Click to show all"}
        />
        <MetricCard
          label="Open Assigned"
          value={metrics?.open ?? "—"}
          icon={Clock}
          accent="info"
          onClick={() => handleMetricClick("Open")}
          hint={statusFilter === "Open" ? "Filter active" : "Click to filter"}
        />
        <MetricCard
          label="Resolved Assigned"
          value={metrics?.resolved ?? "—"}
          icon={CheckCircle2}
          accent="success"
          onClick={() => handleMetricClick("Resolved")}
          hint={statusFilter === "Resolved" ? "Filter active" : "Click to filter"}
        />
        <MetricCard
          label="Closed Assigned"
          value={metrics?.closed ?? "—"}
          icon={XCircle}
          accent="warn"
          onClick={() => handleMetricClick("Closed")}
          hint={statusFilter === "Closed" ? "Filter active" : "Click to filter"}
        />
      </div>

      {/* Advanced Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by ID, title, category, status..."
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
            className="pl-9 bg-slate-50/50 dark:bg-slate-950/30"
          />
        </div>

        <div className="w-44">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as any); setPage(1); }}>
            <SelectTrigger className="bg-slate-50/50 dark:bg-slate-950/30">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ticket List Table */}
      <Card>
        <CardHeader className="py-4 border-b border-border">
          <CardTitle className="text-base font-bold">
            {statusFilter === "all" ? "All Assigned Tickets" : `${statusFilter} Assigned Tickets`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TicketTable rows={ticketData?.rows ?? []} showAssignee={false} />
          {ticketData && (
            <Pager page={ticketData.page} pageSize={ticketData.pageSize} total={ticketData.total} onPageChange={setPage} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

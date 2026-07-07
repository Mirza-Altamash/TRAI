import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { MetricCard } from "@/components/common/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketTable } from "@/components/common/TicketTable";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useCurrentUser } from "@/lib/auth";
import { getAssigneeMetrics, listTickets } from "@/services/mock";
import { Activity, Clock, CheckCircle2, XCircle, PlusCircle } from "lucide-react";
import { useState } from "react";
import type { TicketStatus } from "@/types";

export function AssigneeDashboard({ label }: { label: "L2" | "L3" }) {
  const user = useCurrentUser();
  const [statusFilter, setStatusFilter] = useState<TicketStatus | null>(null);

  const { data: m } = useQuery({ queryKey: [label, "metrics", user.empId], queryFn: () => getAssigneeMetrics(user.empId) });
  const { data: recent } = useQuery({
    queryKey: ["tickets", { assignee: user.empId, status: statusFilter ?? undefined, page: 1, pageSize: statusFilter ? 50 : 8 }],
    queryFn: () => listTickets({ assignee: user.empId, status: statusFilter ?? undefined, page: 1, pageSize: statusFilter ? 50 : 8 }),
  });

  const toggleFilter = (status: TicketStatus) => {
    setStatusFilter(prev => prev === status ? null : status);
  };

  const showRaiseTicket = label === "L3";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${label} Dashboard`}
        subtitle="Tickets assigned to you."
        actions={
          showRaiseTicket ? (
            <Button asChild>
              <Link to="/admin/tickets/new">
                <PlusCircle className="mr-1.5 h-4 w-4" /> Raise Ticket
              </Link>
            </Button>
          ) : undefined
        }
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Assigned" value={m?.assigned ?? "—"} icon={Activity} accent="primary" onClick={() => setStatusFilter(null)} hint={statusFilter === null ? "Showing all" : "Click to clear filter"} />
        <MetricCard label="Open" value={m?.open ?? "—"} icon={Clock} accent="info" onClick={() => toggleFilter("Open")} hint={statusFilter === "Open" ? "Filter active" : undefined} />
        <MetricCard label="Resolved" value={m?.resolved ?? "—"} icon={CheckCircle2} accent="success" onClick={() => toggleFilter("Resolved")} hint={statusFilter === "Resolved" ? "Filter active" : undefined} />
        <MetricCard label="Closed" value={m?.closed ?? "—"} icon={XCircle} accent="warn" onClick={() => toggleFilter("Closed")} hint={statusFilter === "Closed" ? "Filter active" : undefined} />
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-base">
            {statusFilter ? `${statusFilter} Tickets` : "Recent Assigned Tickets"}
          </CardTitle>
          {statusFilter && (
            <Button variant="ghost" size="sm" onClick={() => setStatusFilter(null)} className="h-8 text-xs text-muted-foreground hover:text-foreground">
              Clear filter
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0"><TicketTable rows={recent?.rows ?? []} showAssignee={false} /></CardContent>
      </Card>
    </div>
  );
}
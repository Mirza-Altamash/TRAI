import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { MetricCard } from "@/components/common/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketTable } from "@/components/common/TicketTable";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/auth";
import { getUserMetrics, listTickets } from "@/services/mock";
import { Inbox, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import type { TicketStatus } from "@/types";

export const Route = createFileRoute("/_app/user/dashboard")({ component: UserDash });

function UserDash() {
  const user = useCurrentUser();
  const [statusFilter, setStatusFilter] = useState<TicketStatus | null>(null);

  const { data: m } = useQuery({ queryKey: ["user", "metrics", user.empId], queryFn: () => getUserMetrics(user.empId) });
  const { data: recent } = useQuery({
    queryKey: ["tickets", { createdBy: user.empId, status: statusFilter ?? undefined, page: 1, pageSize: statusFilter ? 50 : 6 }],
    queryFn: () => listTickets({ createdBy: user.empId, status: statusFilter ?? undefined, page: 1, pageSize: statusFilter ? 50 : 6 })
  });

  const toggleFilter = (status: TicketStatus) => {
    setStatusFilter(prev => prev === status ? null : status);
  };

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${user.name.split(" ")[0]}`} subtitle="Your ticket activity at a glance." />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Total Tickets" value={m?.total ?? "—"} icon={Inbox} accent="primary" onClick={() => setStatusFilter(null)} hint={statusFilter === null ? "Showing all" : "Click to clear filter"} />
        <MetricCard label="Open" value={m?.open ?? "—"} icon={Clock} accent="info" onClick={() => toggleFilter("Open")} hint={statusFilter === "Open" ? "Filter active" : undefined} />
        <MetricCard label="Resolved" value={m?.resolved ?? "—"} icon={CheckCircle2} accent="success" onClick={() => toggleFilter("Resolved")} hint={statusFilter === "Resolved" ? "Filter active" : undefined} />
        <MetricCard label="Closed" value={m?.closed ?? "—"} icon={XCircle} accent="warn" onClick={() => toggleFilter("Closed")} hint={statusFilter === "Closed" ? "Filter active" : undefined} />
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-base">
            {statusFilter ? `${statusFilter} Tickets` : "Recent Tickets"}
          </CardTitle>
          {statusFilter && (
            <Button variant="ghost" size="sm" onClick={() => setStatusFilter(null)} className="h-8 text-xs text-muted-foreground hover:text-foreground">
              Clear filter
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0"><TicketTable rows={recent?.rows ?? []} showCreatedBy={false} /></CardContent>
      </Card>
    </div>
  );
}
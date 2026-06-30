import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, CheckCircle2, Inbox, Users, XCircle, Clock } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { MetricCard } from "@/components/common/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketTable } from "@/components/common/TicketTable";
import { Button } from "@/components/ui/button";
import { getAdminMetrics, listTickets } from "@/services/mock";
import { useState } from "react";
import type { TicketStatus } from "@/types";

export const Route = createFileRoute("/_app/admin/dashboard")({ component: AdminDashboard });

function AdminDashboard() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "Assigned" | null>(null);
  
  const { data: m } = useQuery({ queryKey: ["admin", "metrics"], queryFn: getAdminMetrics });
  const { data: recent } = useQuery({
    queryKey: ["tickets", { status: statusFilter ?? undefined, page: 1, pageSize: statusFilter ? 50 : 8 }],
    queryFn: () => listTickets({ status: statusFilter ?? undefined, page: 1, pageSize: statusFilter ? 50 : 8 })
  });

  const toggleFilter = (status: TicketStatus | "Assigned") => {
    setStatusFilter(prev => prev === status ? null : status);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" subtitle="System overview across all divisions and roles." />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Total Tickets" value={m?.total ?? "—"} icon={Inbox} accent="primary" onClick={() => navigate({ to: "/admin/totalticket" })} />
        <MetricCard label="Open" value={m?.open ?? "—"} icon={Clock} accent="info" onClick={() => toggleFilter("Open")} hint={statusFilter === "Open" ? "Filter active" : undefined} />
        <MetricCard label="Resolved" value={m?.resolved ?? "—"} icon={CheckCircle2} accent="success" onClick={() => toggleFilter("Resolved")} hint={statusFilter === "Resolved" ? "Filter active" : undefined} />
        <MetricCard label="Closed" value={m?.closed ?? "—"} icon={XCircle} accent="warn" onClick={() => toggleFilter("Closed")} hint={statusFilter === "Closed" ? "Filter active" : undefined} />
        <MetricCard label="Assigned" value={m?.assigned ?? "—"} icon={Activity} accent="primary" onClick={() => toggleFilter("Assigned")} hint={statusFilter === "Assigned" ? "Filter active" : undefined} />
        <MetricCard label="Employees" value={m?.employees ?? "—"} icon={Users} accent="primary" onClick={() => navigate({ to: "/admin/employees" })} />
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
        <CardContent className="p-0"><TicketTable rows={recent?.rows ?? []} /></CardContent>
      </Card>
    </div>
  );
}
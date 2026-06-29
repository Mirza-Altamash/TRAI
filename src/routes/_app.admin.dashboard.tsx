import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, CheckCircle2, Inbox, Users, XCircle, Clock } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { MetricCard } from "@/components/common/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketTable } from "@/components/common/TicketTable";
import { getAdminMetrics, listTickets } from "@/services/mock";

export const Route = createFileRoute("/_app/admin/dashboard")({ component: AdminDashboard });

function AdminDashboard() {
  const navigate = useNavigate();
  const { data: m } = useQuery({ queryKey: ["admin", "metrics"], queryFn: getAdminMetrics });
  const { data: recent } = useQuery({ queryKey: ["tickets", { page: 1, pageSize: 8 }], queryFn: () => listTickets({ page: 1, pageSize: 8 }) });

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" subtitle="System overview across all divisions and roles." />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Total Tickets" value={m?.total ?? "—"} icon={Inbox} accent="primary" onClick={() => navigate({ to: "/admin/analytics" })} />
        <MetricCard label="Open" value={m?.open ?? "—"} icon={Clock} accent="info" />
        <MetricCard label="Resolved" value={m?.resolved ?? "—"} icon={CheckCircle2} accent="success" />
        <MetricCard label="Closed" value={m?.closed ?? "—"} icon={XCircle} accent="warn" />
        <MetricCard label="Assigned" value={m?.assigned ?? "—"} icon={Activity} accent="primary" />
        <MetricCard label="Employees" value={m?.employees ?? "—"} icon={Users} accent="primary" onClick={() => navigate({ to: "/admin/employees" })} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent Tickets</CardTitle></CardHeader>
        <CardContent className="p-0"><TicketTable rows={recent?.rows ?? []} /></CardContent>
      </Card>
    </div>
  );
}
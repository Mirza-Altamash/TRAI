import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { MetricCard } from "@/components/common/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketTable } from "@/components/common/TicketTable";
import { useCurrentUser } from "@/lib/auth";
import { getUserMetrics, listTickets } from "@/services/mock";
import { Inbox, Clock, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_app/user/dashboard")({ component: UserDash });

function UserDash() {
  const user = useCurrentUser();
  const { data: m } = useQuery({ queryKey: ["user", "metrics", user.empId], queryFn: () => getUserMetrics(user.empId) });
  const { data: recent } = useQuery({ queryKey: ["tickets", { createdBy: user.empId, page: 1, pageSize: 6 }], queryFn: () => listTickets({ createdBy: user.empId, page: 1, pageSize: 6 }) });

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${user.name.split(" ")[0]}`} subtitle="Your ticket activity at a glance." />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Total Tickets" value={m?.total ?? "—"} icon={Inbox} accent="primary" />
        <MetricCard label="Open" value={m?.open ?? "—"} icon={Clock} accent="info" />
        <MetricCard label="Resolved" value={m?.resolved ?? "—"} icon={CheckCircle2} accent="success" />
        <MetricCard label="Closed" value={m?.closed ?? "—"} icon={XCircle} accent="warn" />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Recent Tickets</CardTitle></CardHeader>
        <CardContent className="p-0"><TicketTable rows={recent?.rows ?? []} showCreatedBy={false} /></CardContent>
      </Card>
    </div>
  );
}
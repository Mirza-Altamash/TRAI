import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { MetricCard } from "@/components/common/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketTable } from "@/components/common/TicketTable";
import { useCurrentUser } from "@/lib/auth";
import { getAssigneeMetrics, listTickets } from "@/services/mock";
import { Activity, Clock, CheckCircle2, XCircle } from "lucide-react";

export function AssigneeDashboard({ label }: { label: "L2" | "L3" }) {
  const user = useCurrentUser();
  const { data: m } = useQuery({ queryKey: [label, "metrics", user.empId], queryFn: () => getAssigneeMetrics(user.empId) });
  const { data: recent } = useQuery({
    queryKey: ["tickets", { assignee: user.empId, page: 1, pageSize: 8 }],
    queryFn: () => listTickets({ assignee: user.empId, page: 1, pageSize: 8 }),
  });
  return (
    <div className="space-y-6">
      <PageHeader title={`${label} Dashboard`} subtitle="Tickets assigned to you." />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Assigned" value={m?.assigned ?? "—"} icon={Activity} accent="primary" />
        <MetricCard label="Open" value={m?.open ?? "—"} icon={Clock} accent="info" />
        <MetricCard label="Resolved" value={m?.resolved ?? "—"} icon={CheckCircle2} accent="success" />
        <MetricCard label="Closed" value={m?.closed ?? "—"} icon={XCircle} accent="warn" />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Recent Assigned Tickets</CardTitle></CardHeader>
        <CardContent className="p-0"><TicketTable rows={recent?.rows ?? []} showAssignee={false} /></CardContent>
      </Card>
    </div>
  );
}
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { MetricCard } from "@/components/common/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalytics } from "@/services/mock";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { TimerReset, Timer } from "lucide-react";

export const Route = createFileRoute("/_app/admin/analytics")({ component: AnalyticsPage });

const PALETTE = ["#00448B", "#1f7a4d", "#c98a2e", "#3b6fbf", "#b1452f"];

function AnalyticsPage() {
  const { data: a } = useQuery({ queryKey: ["analytics"], queryFn: getAnalytics });
  if (!a) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Cross-division ticket performance and workload distribution." />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <MetricCard label="Avg Resolution Time" value={`${a.avgResolutionDays} days`} icon={Timer} accent="primary" />
        <MetricCard label="Avg Closure Time" value={`${a.avgClosureDays} days`} icon={TimerReset} accent="info" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Tickets by Division">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={a.byDivision}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#00448B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Priority Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={a.byPriority} dataKey="count" nameKey="name" outerRadius={90} label>
                {a.byPriority.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Legend /><Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Status Breakdown">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={a.byStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#1f7a4d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Open vs Resolved (Monthly)">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={a.monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} />
              <Tooltip /><Legend />
              <Line type="monotone" dataKey="open" stroke="#00448B" strokeWidth={2} />
              <Line type="monotone" dataKey="resolved" stroke="#1f7a4d" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="L2 Workload">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={a.l2workload}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={11} /><YAxis fontSize={12} />
              <Tooltip /><Bar dataKey="count" fill="#3b6fbf" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="L3 Workload">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={a.l3workload}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={11} /><YAxis fontSize={12} />
              <Tooltip /><Bar dataKey="count" fill="#c98a2e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
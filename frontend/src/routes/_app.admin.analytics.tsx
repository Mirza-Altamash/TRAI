import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { MetricCard } from "@/components/common/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalytics } from "@/services/mock";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { TimerReset, Timer } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export const Route = createFileRoute("/_app/admin/analytics")({ component: AnalyticsPage });

function AnalyticsPage() {
  const { data: a } = useQuery({ queryKey: ["analytics"], queryFn: getAnalytics });
  const { theme } = useTheme();
  
  if (!a) return null;

  const isDark = theme === "dark";
  const primaryColor = isDark ? "#60a5fa" : "#00448B";
  const successColor = isDark ? "#34d399" : "#1f7a4d";
  const secondaryColor = isDark ? "#93c5fd" : "#3b6fbf";
  const warningColor = isDark ? "#fbbf24" : "#c98a2e";
  const gridColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)";
  
  const palette = isDark 
    ? ["#60a5fa", "#34d399", "#fbbf24", "#818cf8", "#f87171"] 
    : ["#00448B", "#1f7a4d", "#c98a2e", "#3b6fbf", "#b1452f"];

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Cross-division ticket performance and workload distribution." />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <MetricCard label="Avg Resolution Time" value={`${a.avgResolutionDays} days`} icon={Timer} accent="primary" />
        <MetricCard label="Avg Closure Time" value={`${a.avgClosureDays} days`} icon={TimerReset} accent="info" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Tickets by Division" totals={a.byDivision}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={a.byDivision}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" fontSize={12} stroke={isDark ? "#94a3b8" : "#475569"} />
              <YAxis fontSize={12} stroke={isDark ? "#94a3b8" : "#475569"} />
              <Tooltip contentStyle={{ backgroundColor: isDark ? "#1e293b" : "#ffffff", borderColor: isDark ? "#334155" : "#e2e8f0", color: isDark ? "#f8fafc" : "#0f172a" }} />
              <Bar dataKey="count" fill={primaryColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Priority Distribution" totals={a.byPriority}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={a.byPriority} dataKey="count" nameKey="name" outerRadius={90} label>
                {a.byPriority.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
              </Pie>
              <Legend wrapperStyle={{ color: isDark ? "#f8fafc" : "#0f172a" }} />
              <Tooltip contentStyle={{ backgroundColor: isDark ? "#1e293b" : "#ffffff", borderColor: isDark ? "#334155" : "#e2e8f0", color: isDark ? "#f8fafc" : "#0f172a" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Status Breakdown" totals={a.byStatus}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={a.byStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" fontSize={12} stroke={isDark ? "#94a3b8" : "#475569"} />
              <YAxis fontSize={12} stroke={isDark ? "#94a3b8" : "#475569"} />
              <Tooltip contentStyle={{ backgroundColor: isDark ? "#1e293b" : "#ffffff", borderColor: isDark ? "#334155" : "#e2e8f0", color: isDark ? "#f8fafc" : "#0f172a" }} />
              <Bar dataKey="count" fill={successColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Open vs Resolved (Monthly)" customTotalText={`Total Open: ${a.monthly.reduce((sum, item) => sum + (item.open || 0), 0)} | Total Resolved: ${a.monthly.reduce((sum, item) => sum + (item.resolved || 0), 0)}`}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={a.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" fontSize={12} stroke={isDark ? "#94a3b8" : "#475569"} />
              <YAxis fontSize={12} stroke={isDark ? "#94a3b8" : "#475569"} />
              <Tooltip contentStyle={{ backgroundColor: isDark ? "#1e293b" : "#ffffff", borderColor: isDark ? "#334155" : "#e2e8f0", color: isDark ? "#f8fafc" : "#0f172a" }} />
              <Legend wrapperStyle={{ color: isDark ? "#f8fafc" : "#0f172a" }} />
              <Line type="monotone" dataKey="open" stroke={primaryColor} strokeWidth={2} />
              <Line type="monotone" dataKey="resolved" stroke={successColor} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="L2 Workload" totals={a.l2workload}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={a.l2workload}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" fontSize={11} stroke={isDark ? "#94a3b8" : "#475569"} />
              <YAxis fontSize={12} stroke={isDark ? "#94a3b8" : "#475569"} />
              <Tooltip contentStyle={{ backgroundColor: isDark ? "#1e293b" : "#ffffff", borderColor: isDark ? "#334155" : "#e2e8f0", color: isDark ? "#f8fafc" : "#0f172a" }} />
              <Bar dataKey="count" fill={secondaryColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>


      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
  totals,
  customTotalText,
}: {
  title: string;
  children: React.ReactNode;
  totals?: { name: string; count: number }[];
  customTotalText?: string;
}) {
  const totalVal = totals ? totals.reduce((sum, item) => sum + item.count, 0) : null;
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {customTotalText ? customTotalText : totalVal !== null ? `Total: ${totalVal}` : ""}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
        {totals && totals.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-border/60 justify-center">
            {totals.map(t => (
              <span key={t.name} className="inline-flex items-center gap-1 rounded-full bg-secondary/15 border border-secondary/30 px-2.5 py-0.5 text-xs font-medium text-foreground">
                <span className="font-semibold text-muted-foreground mr-1">{t.name}:</span> {t.count}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
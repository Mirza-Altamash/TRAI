import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function MetricCard({
  label, value, icon: Icon, accent = "primary", onClick, hint,
}: {
  label: string; value: number | string; icon?: LucideIcon;
  accent?: "primary" | "success" | "warn" | "info" | "destructive";
  onClick?: () => void; hint?: string;
}) {
  const accentMap = {
    primary: "text-primary bg-primary-soft",
    success: "text-success bg-success/10",
    warn: "text-warn-foreground bg-warn/15",
    info: "text-info bg-info/10",
    destructive: "text-destructive bg-destructive/10",
  } as const;
  return (
    <Card
      className={cn("transition-shadow hover:shadow-md", onClick && "cursor-pointer hover:border-primary/40")}
      onClick={onClick}
    >
      <CardContent className="flex items-center gap-4 py-5">
        {Icon && (
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-md", accentMap[accent])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold text-foreground">{value}</div>
          {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
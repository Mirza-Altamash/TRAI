import type { Priority } from "@/types";
import { cn } from "@/lib/utils";

const styles: Record<Priority, string> = {
  Normal: "bg-muted text-muted-foreground border-border",
  Medium: "bg-warn/15 text-warn-foreground border-warn/40",
  High: "bg-destructive/15 text-destructive border-destructive/40 font-semibold",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs", styles[priority])}>
      {priority}
    </span>
  );
}
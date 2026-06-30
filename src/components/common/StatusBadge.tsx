import type { TicketStatus } from "@/types";
import { cn } from "@/lib/utils";

const styles: Record<TicketStatus, string> = {
  Open: "bg-info/15 text-info border-info/30",
  Resolved: "bg-success/15 text-success border-success/30",
  Closed: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", styles[status])}>
      {status}
    </span>
  );
}
import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title = "No records found",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <Inbox className="h-10 w-10 text-muted-foreground/60" />
      <div className="text-sm font-medium text-foreground">{title}</div>
      {description && <div className="text-xs text-muted-foreground">{description}</div>}
      {action}
    </div>
  );
}

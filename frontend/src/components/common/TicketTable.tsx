import { Link } from "@tanstack/react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { EmptyState } from "./EmptyState";
import { formatIstDate } from "@/lib/format";
import { Eye } from "lucide-react";
import type { Ticket } from "@/types";
import { cn } from "@/lib/utils";

export function TicketTable({
  rows,
  showCreatedBy = true,
  showAssignee = true,
  markNewAll = false,
  onRowClick,
  selectedTicketId,
}: {
  rows: Ticket[];
  showCreatedBy?: boolean;
  showAssignee?: boolean;
  markNewAll?: boolean;
  onRowClick?: (ticket: Ticket) => void;
  selectedTicketId?: string;
}) {
  if (!rows.length)
    return <EmptyState title="No tickets" description="Tickets will appear here." />;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticket #</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Division</TableHead>
          {showCreatedBy && <TableHead>Created By</TableHead>}
          {showAssignee && <TableHead>Assignee</TableHead>}
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="w-16 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((t) => (
          <TableRow
            key={t.ticketId}
            className={cn(
              onRowClick && "cursor-pointer transition-colors",
              t.ticketId === selectedTicketId &&
                "bg-[#00448B]/10 dark:bg-white/10 hover:bg-[#00448B]/15 dark:hover:bg-white/15 border-l-4 border-l-[#00448B]",
            )}
            onClick={() => onRowClick?.(t)}
          >
            <TableCell className="font-mono text-xs">
              <span className="inline-flex items-center gap-1.5">
                {t.ticketId}
                {markNewAll && (
                  <Badge className="h-4 px-1.5 text-[10px] font-semibold uppercase">New</Badge>
                )}
              </span>
            </TableCell>
            <TableCell className="max-w-[260px] truncate">{t.summary}</TableCell>
            <TableCell>{t.division}</TableCell>
            {showCreatedBy && <TableCell>{t.createdByName}</TableCell>}
            {showAssignee && <TableCell>{t.currentAssigneeName}</TableCell>}
            <TableCell>
              <PriorityBadge priority={t.priority} />
            </TableCell>
            <TableCell>
              <StatusBadge status={t.currentStatus} />
            </TableCell>
            <TableCell className="text-muted-foreground">{formatIstDate(t.createdAt)}</TableCell>
            <TableCell className="text-right">
              {onRowClick ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRowClick(t);
                  }}
                  className={cn(t.ticketId === selectedTicketId && "bg-[#00448B]/10")}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              ) : (
                <Button asChild variant="ghost" size="icon">
                  <Link to="/tickets/$ticketId" params={{ ticketId: t.ticketId }}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

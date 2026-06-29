import { Link } from "@tanstack/react-router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { EmptyState } from "./EmptyState";
import { formatIstDate } from "@/lib/format";
import { Eye } from "lucide-react";
import type { Ticket } from "@/types";

export function TicketTable({ rows, showCreatedBy = true, showAssignee = true, markNewAll = false }: {
  rows: Ticket[]; showCreatedBy?: boolean; showAssignee?: boolean; markNewAll?: boolean;
}) {
  if (!rows.length) return <EmptyState title="No tickets" description="Tickets will appear here." />;
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
        {rows.map(t => (
          <TableRow key={t.ticketId}>
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
            <TableCell><PriorityBadge priority={t.priority} /></TableCell>
            <TableCell><StatusBadge status={t.currentStatus} /></TableCell>
            <TableCell className="text-muted-foreground">{formatIstDate(t.createdAt)}</TableCell>
            <TableCell className="text-right">
              <Button asChild variant="ghost" size="icon">
                <Link to="/tickets/$ticketId" params={{ ticketId: t.ticketId }}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
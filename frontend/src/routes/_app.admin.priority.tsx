import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketTable } from "@/components/common/TicketTable";
import { Pager } from "@/components/common/Pager";
import { getAdminPriorityTickets } from "@/services/ticketApi";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TicketStatus } from "@/types";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_app/admin/priority")({ component: AdminPriorityTickets });

function AdminPriorityTickets() {
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");

  const { data: ticketData, isLoading } = useQuery({
    queryKey: [
      "priority-tickets",
      "global",
      {
        page,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: searchText || undefined,
      },
    ],
    queryFn: () =>
      getAdminPriorityTickets({
        page,
        pageSize: 10,
        status: (statusFilter === "all" ? undefined : statusFilter) as any,
        search: searchText || undefined,
      }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Priority Tickets"
        subtitle="Track and manage all priority tickets across the system."
      />
      <Card className="border border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[280px] space-y-1.5">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search by ID, title..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>

              <div className="w-44 space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as TicketStatus | "all")}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-base">Tickets ({ticketData?.total ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TicketTable
            rows={ticketData?.rows ?? []}
            showAssignee={true}
            showPriorityDetails={true}
          />
          {ticketData && ticketData.total > ticketData.pageSize && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
              <Pager page={ticketData.page} pageSize={ticketData.pageSize} total={ticketData.total} onPageChange={setPage} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

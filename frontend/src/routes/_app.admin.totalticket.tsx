import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketTable } from "@/components/common/TicketTable";
import { Pager } from "@/components/common/Pager";
import { listEmployees, listTickets, listTrail } from "@/services/mock";
import { DIVISIONS } from "@/types";
import type { TicketStatus, Ticket } from "@/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { formatIstDateTime } from "@/lib/format";
import { FileCheck, ClipboardList, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/admin/totalticket")({ component: AdminTotalTickets });

const STATUS_OPTIONS: TicketStatus[] = ["Open", "Resolved", "Closed"];

function AdminTotalTickets() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [division, setDivision] = useState<string>("");
  const [assignee, setAssignee] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const router = useRouter();

  const { data: emps } = useQuery({
    queryKey: ["employees", "handlers-all"],
    queryFn: () => listEmployees({ pageSize: 200 }),
  });
  const handlers = useMemo(
    () => (emps?.rows ?? []).filter((e) => e.role === "L2" || e.role === "L3"),
    [emps],
  );

  const { data } = useQuery({
    queryKey: ["admin", "totaltickets", { search, status, division, assignee, from, to, page }],
    queryFn: () =>
      listTickets({
        search: search || undefined,
        status: (status as TicketStatus) || undefined,
        division: division || undefined,
        assignee: assignee || undefined,
        page,
        pageSize: 1000,
      }),
  });
  const filtered = useMemo(() => {
    let rows = data?.rows ?? [];
    if (from) rows = rows.filter((r) => r.createdAt >= from);
    if (to) rows = rows.filter((r) => r.createdAt <= to + "T23:59:59");
    return rows;
  }, [data, from, to]);

  const total = filtered.length;
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const reset = (fn: (v: string) => void) => (v: string) => {
    fn(v);
    setPage(1);
  };

  const handleRowClick = (t: Ticket) => {
    router.navigate({ to: `/tickets/${t.ticketId}` });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Total Tickets"
        subtitle="All tickets across the system. Detailed lifecycle view."
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[240px] space-y-1.5">
              <Label>Search</Label>
              <Input
                placeholder="Ticket # or subject"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="w-36 space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status || "all"}
                onValueChange={(v) => reset(setStatus)(v === "all" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-36 space-y-1.5">
              <Label>Division</Label>
              <Select
                value={division || "all"}
                onValueChange={(v) => reset(setDivision)(v === "all" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {DIVISIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48 space-y-1.5">
              <Label>Assignee</Label>
              <Select
                value={assignee || "all"}
                onValueChange={(v) => reset(setAssignee)(v === "all" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">All</SelectItem>
                  {handlers.map((h) => (
                    <SelectItem key={h.empId} value={h.empId}>
                      {h.name} ({h.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40 space-y-1.5">
              <Label>From</Label>
              <Input
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="w-40 space-y-1.5">
              <Label>To</Label>
              <Input
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 items-start">
        {/* Tickets List Card */}
        <Card>
          <CardContent className="p-0">
            <TicketTable rows={pageRows} onRowClick={handleRowClick} />
            <Pager page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

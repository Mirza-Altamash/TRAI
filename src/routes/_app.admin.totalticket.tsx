import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TicketTable } from "@/components/common/TicketTable";
import { Pager } from "@/components/common/Pager";
import { listEmployees, listTickets } from "@/services/mock";
import { DIVISIONS } from "@/types";
import type { TicketStatus } from "@/types";

export const Route = createFileRoute("/_app/admin/totalticket")({ component: AdminTotalTickets });

const STATUS_OPTIONS: TicketStatus[] = ["Open", "Assigned", "Closed"];

function AdminTotalTickets() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [division, setDivision] = useState<string>("");
  const [assignee, setAssignee] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: emps } = useQuery({
    queryKey: ["employees", "handlers-all"],
    queryFn: () => listEmployees({ pageSize: 200 }),
  });
  const handlers = useMemo(
    () => (emps?.rows ?? []).filter(e => e.role === "L2" || e.role === "L3"),
    [emps],
  );

  const { data } = useQuery({
    queryKey: ["admin", "totaltickets", { search, status, division, assignee, from, to, page }],
    queryFn: () => listTickets({
      search: search || undefined,
      status: (status as TicketStatus) || undefined,
      division: division || undefined,
      assignee: assignee || undefined,
      page, pageSize: 1000,
    }),
  });

  const filtered = useMemo(() => {
    let rows = data?.rows ?? [];
    if (from) rows = rows.filter(r => r.createdAt >= from);
    if (to) rows = rows.filter(r => r.createdAt <= to + "T23:59:59");
    return rows;
  }, [data, from, to]);

  const total = filtered.length;
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const reset = (fn: (v: string) => void) => (v: string) => { fn(v); setPage(1); };

  return (
    <div className="space-y-6">
      <PageHeader title="Total Tickets" subtitle="All tickets across the system. Read-only view." />

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            <div className="space-y-1.5 lg:col-span-2">
              <Label>Search</Label>
              <Input placeholder="Ticket # or subject" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status || "all"} onValueChange={(v) => reset(setStatus)(v === "all" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Division</Label>
              <Select value={division || "all"} onValueChange={(v) => reset(setDivision)(v === "all" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {DIVISIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Assignee</Label>
              <Select value={assignee || "all"} onValueChange={(v) => reset(setAssignee)(v === "all" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">All</SelectItem>
                  {handlers.map(h => <SelectItem key={h.empId} value={h.empId}>{h.name} ({h.role})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>From</Label>
              <Input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} />
            </div>
            <div className="space-y-1.5">
              <Label>To</Label>
              <Input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <TicketTable rows={pageRows} />
          <Pager page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
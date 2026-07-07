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
import { listEmployees, listTickets, listTrail } from "@/services/mock";
import { DIVISIONS } from "@/types";
import type { TicketStatus, Ticket } from "@/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { formatIstDateTime } from "@/lib/format";
import { FileCheck, ClipboardList, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
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

  const { data: trailData, isLoading: trailLoading } = useQuery({
    queryKey: ["ticket", "trail", selectedTicketId],
    queryFn: () => listTrail(selectedTicketId!),
    enabled: !!selectedTicketId,
  });
  const trail = trailData?.rows ?? [];

  const filtered = useMemo(() => {
    let rows = data?.rows ?? [];
    if (from) rows = rows.filter(r => r.createdAt >= from);
    if (to) rows = rows.filter(r => r.createdAt <= to + "T23:59:59");
    return rows;
  }, [data, from, to]);

  const selectedTicket = useMemo(() => {
    if (!selectedTicketId) return null;
    return filtered.find(r => r.ticketId === selectedTicketId) || null;
  }, [filtered, selectedTicketId]);

  const total = filtered.length;
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const reset = (fn: (v: string) => void) => (v: string) => { fn(v); setPage(1); };

  const handleRowClick = (t: Ticket) => {
    setSelectedTicketId(t.ticketId);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Total Tickets" subtitle="All tickets across the system. Detailed lifecycle view." />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[240px] space-y-1.5">
              <Label>Search</Label>
              <Input placeholder="Ticket # or subject" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div className="w-36 space-y-1.5">
              <Label>Status</Label>
              <Select value={status || "all"} onValueChange={(v) => reset(setStatus)(v === "all" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-36 space-y-1.5">
              <Label>Division</Label>
              <Select value={division || "all"} onValueChange={(v) => reset(setDivision)(v === "all" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {DIVISIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48 space-y-1.5">
              <Label>Assignee</Label>
              <Select value={assignee || "all"} onValueChange={(v) => reset(setAssignee)(v === "all" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">All</SelectItem>
                  {handlers.map(h => <SelectItem key={h.empId} value={h.empId}>{h.name} ({h.role})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40 space-y-1.5">
              <Label>From</Label>
              <Input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} />
            </div>
            <div className="w-40 space-y-1.5">
              <Label>To</Label>
              <Input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Tickets List Card */}
        <Card className={selectedTicket ? "xl:col-span-7" : "xl:col-span-12"}>
          <CardContent className="p-0">
            <TicketTable 
              rows={pageRows} 
              onRowClick={handleRowClick}
              selectedTicketId={selectedTicketId || undefined}
            />
            <Pager page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
          </CardContent>
        </Card>

        {/* Selected Ticket Split View Panel */}
        {selectedTicket && (
          <Card className="xl:col-span-5 border border-slate-200 dark:border-slate-800">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-lg text-foreground">Ticket Lifecycle</h3>
                <Button variant="outline" size="sm" onClick={() => setSelectedTicketId(null)}>Close Split</Button>
              </div>

              {/* Essential Info */}
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-0.5">Ticket ID</span>
                    <span className="font-mono text-sm text-foreground">{selectedTicket.ticketId}</span>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-0.5">Status</span>
                    <StatusBadge status={selectedTicket.currentStatus} />
                  </div>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-0.5">Subject</span>
                  <span className="font-medium text-foreground text-sm">{selectedTicket.summary}</span>
                </div>
                {selectedTicket.description && (
                  <div>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-0.5">Description</span>
                    <div className="text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-3 leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] max-w-full">
                      {selectedTicket.description}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-0.5">Division</span>
                    <span className="font-semibold text-foreground">{selectedTicket.division}</span>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-0.5">Priority</span>
                    <PriorityBadge priority={selectedTicket.priority} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-0.5">Assignee</span>
                    <span className="text-foreground">{selectedTicket.currentAssigneeName}</span>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-0.5">Created By</span>
                    <span className="text-foreground">{selectedTicket.createdByName}</span>
                  </div>
                </div>
              </div>

              {/* Attachments Section */}
              {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Attachments</h4>
                  <ul className="text-sm space-y-1.5">
                    {selectedTicket.attachments.map((a) => {
                      const baseApiUrl = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000/api";
                      const baseUrl = baseApiUrl.replace(/\/api\/?$/, "");
                      const downloadUrl = `${baseUrl}/uploads/${a.id}`;
                      return (
                        <li key={a.id}>
                          <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[#00448B] dark:text-blue-400 hover:underline font-semibold"
                            download={a.name}
                          >
                            <FileCheck className="h-4 w-4" />
                            {a.name} <span className="text-xs text-muted-foreground font-normal ml-1">({a.sizeKb} KB)</span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Trail logs */}
              <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Trail History</span>
                  {trailLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <span className="text-[10px] text-muted-foreground font-normal">({trail.length} steps)</span>
                  )}
                </h4>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {trail.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No history trail logs recorded yet.</p>
                  ) : (
                    trail.map((log: any) => (
                      <div key={log.id} className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-3 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground text-xs">{log.action}</span>
                          <span className="text-[10px] text-muted-foreground">{formatIstDateTime(log.createdAt)}</span>
                        </div>
                        <div className="text-slate-600 dark:text-slate-300">
                          <span className="font-semibold">{log.performedByName}</span> ({log.performerRole})
                        </div>
                        {log.comment && (
                          <div className="border-t border-slate-100 dark:border-slate-800 pt-1.5 mt-1.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            &ldquo;{log.comment}&rdquo;
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
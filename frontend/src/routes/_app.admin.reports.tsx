import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DIVISIONS } from "@/types";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatIstDateTime } from "@/lib/format";
import { listEmployees, listTickets } from "@/services/mock";
import { exportEmployees, exportTickets, exportAssigneeAssignments } from "@/lib/report-export";
import { getAssigneeAssignmentsReport } from "@/services/reportApi";
import { useCurrentUser } from "@/lib/auth";
import type { Employee, Ticket, TicketStatus } from "@/types";

export const Route = createFileRoute("/_app/admin/reports")({ component: ReportsPage });

const ALL = "__all__";

interface PanelFilters {
  division: string;
  status: string;
  from: string;
  to: string;
}

const emptyFilters: PanelFilters = { division: ALL, status: ALL, from: "", to: "" };

function withinRange(iso: string, from: string, to: string) {
  const t = new Date(iso).getTime();
  if (from && t < new Date(from).getTime()) return false;
  if (to && t > new Date(to + "T23:59:59").getTime()) return false;
  return true;
}

function EmployeeExportPanel() {
  const me = useCurrentUser();
  const [filters, setFilters] = useState<PanelFilters>(emptyFilters);
  const [busy, setBusy] = useState<"Excel" | "PDF" | null>(null);

  const run = async (kind: "Excel" | "PDF") => {
    setBusy(kind);
    try {
      const res = await listEmployees({ pageSize: 10000 });
      let rows: Employee[] = res.rows;
      if (filters.division !== ALL) rows = rows.filter((r) => r.division === filters.division);
      if (filters.status === "active") rows = rows.filter((r) => r.isActive);
      if (filters.status === "inactive") rows = rows.filter((r) => !r.isActive);
      if (filters.from || filters.to)
        rows = rows.filter((r) => withinRange(r.createdAt, filters.from, filters.to));
      if (rows.length === 0) {
        toast.warning(
          "No records found for the selected filters. Please adjust filters before exporting.",
        );
        return;
      }
      await exportEmployees(kind, rows, me.name);
      toast.success("Export downloaded successfully");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Employee Export</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FilterField label="Division">
            <Select
              value={filters.division}
              onValueChange={(v) => setFilters((f) => ({ ...f, division: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All</SelectItem>
                {DIVISIONS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="Status">
            <Select
              value={filters.status}
              onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="From">
            <Input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            />
          </FilterField>
          <FilterField label="To">
            <Input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            />
          </FilterField>
        </div>
        <ExportButtons busy={busy} onExport={run} />
      </CardContent>
    </Card>
  );
}

function TicketExportPanel() {
  const me = useCurrentUser();
  const [filters, setFilters] = useState<PanelFilters>(emptyFilters);
  const [busy, setBusy] = useState<"Excel" | "PDF" | null>(null);

  const run = async (kind: "Excel" | "PDF") => {
    setBusy(kind);
    try {
      const res = await listTickets({ pageSize: 10000 });
      let rows: Ticket[] = res.rows;
      if (filters.division !== ALL) rows = rows.filter((r) => r.division === filters.division);
      if (filters.status !== ALL)
        rows = rows.filter((r) => r.currentStatus === (filters.status as TicketStatus));
      if (filters.from || filters.to)
        rows = rows.filter((r) => withinRange(r.createdAt, filters.from, filters.to));
      if (rows.length === 0) {
        toast.warning(
          "No records found for the selected filters. Please adjust filters before exporting.",
        );
        return;
      }
      await exportTickets(kind, rows, me.name);
      toast.success("Export downloaded successfully");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ticket Export</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FilterField label="Division">
            <Select
              value={filters.division}
              onValueChange={(v) => setFilters((f) => ({ ...f, division: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All</SelectItem>
                {DIVISIONS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="Status">
            <Select
              value={filters.status}
              onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="From">
            <Input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            />
          </FilterField>
          <FilterField label="To">
            <Input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            />
          </FilterField>
        </div>
        <ExportButtons busy={busy} onExport={run} />
      </CardContent>
    </Card>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ExportButtons({
  busy,
  onExport,
}: {
  busy: "Excel" | "PDF" | null;
  onExport: (k: "Excel" | "PDF") => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      <Button variant="outline" disabled={busy !== null} onClick={() => onExport("Excel")}>
        {busy === "Excel" ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="mr-1.5 h-4 w-4" />
        )}
        {busy === "Excel" ? "Exporting…" : "Export Excel"}
      </Button>
      <Button disabled={busy !== null} onClick={() => onExport("PDF")}>
        {busy === "PDF" ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="mr-1.5 h-4 w-4" />
        )}
        {busy === "PDF" ? "Exporting…" : "Export PDF"}
      </Button>
    </div>
  );
}

function AssigneeAssignmentReportPanel() {
  const me = useCurrentUser();
  const [assigneeQuery, setAssigneeQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [report, setReport] = useState<any>(null);
  const [busyPreview, setBusyPreview] = useState(false);
  const [busyExport, setBusyExport] = useState<"Excel" | "PDF" | null>(null);

  const fetchPreview = async () => {
    if (!assigneeQuery) return toast.error("Please enter assignee name or ID");
    if (!from || !to) return toast.error("Please select a date range");

    setBusyPreview(true);
    setReport(null);
    try {
      const res = await getAssigneeAssignmentsReport({
        assigneeName: assigneeQuery,
        fromDate: from,
        toDate: to,
      });
      setReport(res);
      if (res.tickets.length === 0) {
        toast.info(`No tickets assigned to ${res.assignee.name} between ${from} and ${to}.`);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || "Failed to fetch report");
    } finally {
      setBusyPreview(false);
    }
  };

  const handleExport = async (kind: "Excel" | "PDF") => {
    if (!assigneeQuery) return toast.error("Please enter assignee name or ID");
    if (!from || !to) return toast.error("Please select a date range");

    setBusyExport(kind);
    try {
      let currentReport = report;
      // Fetch inline if they didn't preview first
      if (!currentReport) {
        currentReport = await getAssigneeAssignmentsReport({
          assigneeName: assigneeQuery,
          fromDate: from,
          toDate: to,
        });
        if (currentReport.tickets.length === 0) {
          toast.info(
            `No tickets assigned to ${currentReport.assignee.name} between ${from} and ${to}.`,
          );
          return;
        }
      }

      if (currentReport.tickets.length === 0) return toast.error("No data to export");

      await exportAssigneeAssignments(kind, currentReport, me.name);
      toast.success("Export downloaded successfully");
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || "Export failed");
    } finally {
      setBusyExport(null);
    }
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-base">Assignee Assignment Report (PDF / Excel)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FilterField label="Assignee Name or ID">
            <Input
              placeholder="e.g. Sandeep or TRAI-L2-001"
              value={assigneeQuery}
              onChange={(e) => setAssigneeQuery(e.target.value)}
            />
          </FilterField>
          <FilterField label="From Date">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </FilterField>
          <FilterField label="To Date">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </FilterField>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={fetchPreview} disabled={busyPreview}>
            {busyPreview ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            Preview Table
          </Button>
          <ExportButtons busy={busyExport} onExport={handleExport} />
        </div>

        {report && (
          <div className="mt-6 space-y-4">
            <div className="p-3 bg-muted rounded-md text-sm">
              <span className="font-semibold">{report.assignee.name}</span> (
              {report.assignee.userId}) — {report.assignee.role}
              <br />
              <span className="text-muted-foreground">
                Found {report.tickets.length} assigned ticket(s) from {report.fromDate} to{" "}
                {report.toDate}.
              </span>
            </div>

            {report.tickets.length > 0 && (
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead>Assigned At</TableHead>
                      <TableHead>Assigned By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assignee Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.tickets.map((t: any) => (
                      <TableRow key={t.ticketId}>
                        <TableCell className="font-medium">{t.ticketId}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={t.summary}>
                          {t.summary}
                        </TableCell>
                        <TableCell>{formatIstDateTime(t.assignedAt)}</TableCell>
                        <TableCell>
                          {t.assignedBy.name}{" "}
                          <span className="text-muted-foreground text-xs">
                            ({t.assignedBy.role})
                          </span>
                        </TableCell>
                        <TableCell>{t.status}</TableCell>
                        <TableCell className="max-w-[300px] text-xs space-y-1">
                          {t.assigneeActions.map((a: any, i: number) => (
                            <div key={i} className="truncate" title={a.formatted}>
                              • {a.formatted}
                            </div>
                          ))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Export"
        subtitle="Generate Excel and PDF reports across employees and tickets."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <AssigneeAssignmentReportPanel />
        <EmployeeExportPanel />
        <TicketExportPanel />
      </div>
    </div>
  );
}

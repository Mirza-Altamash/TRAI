import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DIVISIONS } from "@/types";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { listEmployees, listTickets } from "@/services/mock";
import { exportEmployees, exportTickets } from "@/lib/report-export";
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
      if (filters.division !== ALL) rows = rows.filter(r => r.division === filters.division);
      if (filters.status === "active") rows = rows.filter(r => r.isActive);
      if (filters.status === "inactive") rows = rows.filter(r => !r.isActive);
      if (filters.from || filters.to) rows = rows.filter(r => withinRange(r.createdAt, filters.from, filters.to));
      if (rows.length === 0) {
        toast.warning("No records found for the selected filters. Please adjust filters before exporting.");
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
      <CardHeader><CardTitle className="text-base">Employee Export</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FilterField label="Division">
            <Select value={filters.division} onValueChange={(v) => setFilters(f => ({ ...f, division: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All</SelectItem>
                {DIVISIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="Status">
            <Select value={filters.status} onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="From"><Input type="date" value={filters.from} onChange={(e) => setFilters(f => ({ ...f, from: e.target.value }))} /></FilterField>
          <FilterField label="To"><Input type="date" value={filters.to} onChange={(e) => setFilters(f => ({ ...f, to: e.target.value }))} /></FilterField>
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
      if (filters.division !== ALL) rows = rows.filter(r => r.division === filters.division);
      if (filters.status !== ALL) rows = rows.filter(r => r.currentStatus === filters.status as TicketStatus);
      if (filters.from || filters.to) rows = rows.filter(r => withinRange(r.createdAt, filters.from, filters.to));
      if (rows.length === 0) {
        toast.warning("No records found for the selected filters. Please adjust filters before exporting.");
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
      <CardHeader><CardTitle className="text-base">Ticket Export</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FilterField label="Division">
            <Select value={filters.division} onValueChange={(v) => setFilters(f => ({ ...f, division: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All</SelectItem>
                {DIVISIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="Status">
            <Select value={filters.status} onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="From"><Input type="date" value={filters.from} onChange={(e) => setFilters(f => ({ ...f, from: e.target.value }))} /></FilterField>
          <FilterField label="To"><Input type="date" value={filters.to} onChange={(e) => setFilters(f => ({ ...f, to: e.target.value }))} /></FilterField>
        </div>
        <ExportButtons busy={busy} onExport={run} />
      </CardContent>
    </Card>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function ExportButtons({ busy, onExport }: { busy: "Excel" | "PDF" | null; onExport: (k: "Excel" | "PDF") => void }) {
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      <Button variant="outline" disabled={busy !== null} onClick={() => onExport("Excel")}>
        {busy === "Excel" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-1.5 h-4 w-4" />}
        {busy === "Excel" ? "Exporting…" : "Export Excel"}
      </Button>
      <Button disabled={busy !== null} onClick={() => onExport("PDF")}>
        {busy === "PDF" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileText className="mr-1.5 h-4 w-4" />}
        {busy === "PDF" ? "Exporting…" : "Export PDF"}
      </Button>
    </div>
  );
}

function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Export" subtitle="Generate Excel and PDF reports across employees and tickets." />
      <div className="grid gap-4 lg:grid-cols-2">
        <EmployeeExportPanel />
        <TicketExportPanel />
      </div>
    </div>
  );
}
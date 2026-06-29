import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pager } from "@/components/common/Pager";
import { listAudit } from "@/services/mock";
import { formatIstDateTime } from "@/lib/format";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { exportGeneric } from "@/lib/report-export";
import { useCurrentUser } from "@/lib/auth";

export const Route = createFileRoute("/_app/admin/audit")({ component: AuditPage });

const ACTIONS = ["Login","Logout","Password Change","Employee Create","Employee Update","Employee Delete","Ticket Create","Assignment","Reassignment","Comment","Status Change","Resolve","Close","Export"];

function AuditPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<string>("");
  const [empId, setEmpId] = useState("");
  const [exporting, setExporting] = useState<"Excel" | "PDF" | null>(null);
  const user = useCurrentUser();
  const { data } = useQuery({
    queryKey: ["audit", { page, action, empId }],
    queryFn: () => listAudit({ page, pageSize: 15, action: action || undefined, empId: empId || undefined }),
  });

  async function handleExport(kind: "Excel" | "PDF") {
    // Pull all matching rows (not just current page).
    const all = await listAudit({ action: action || undefined, empId: empId || undefined, page: 1, pageSize: 10000 });
    if (!all.rows.length) {
      toast.warning("No records found for selected filters.");
      return;
    }
    setExporting(kind);
    try {
      const stamp = Date.now();
      await exportGeneric({
        kind,
        filename: `audit-log-export-${stamp}.${kind === "Excel" ? "xlsx" : "pdf"}`,
        reportName: "Audit Log Report",
        generatedBy: user.name,
        headers: ["Sr No", "Date & Time (IST)", "Employee", "Employee ID", "Role", "Action", "Context"],
        data: all.rows.map((r, i) => [
          i + 1, formatIstDateTime(r.createdAt), r.empName, r.empId, r.role, r.action, r.context ?? "",
        ]),
        summary: [
          ["Total Records", all.rows.length],
          ["Action Filter", action || "All"],
          ["Employee Filter", empId || "All"],
        ],
      });
      toast.success(`${kind} export downloaded`);
    } catch (e) {
      toast.error(`${kind} export failed`);
      console.error(e);
    } finally {
      setExporting(null);
    }
  }
  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" subtitle="System-wide activity log for compliance and traceability." actions={
        <div className="flex gap-2">
          <Button variant="outline" disabled={exporting !== null} onClick={() => handleExport("Excel")}>
            {exporting === "Excel" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-1.5 h-4 w-4" />}
            {exporting === "Excel" ? "Exporting…" : "Excel"}
          </Button>
          <Button disabled={exporting !== null} onClick={() => handleExport("PDF")}>
            {exporting === "PDF" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileText className="mr-1.5 h-4 w-4" />}
            {exporting === "PDF" ? "Exporting…" : "PDF"}
          </Button>
        </div>
      } />
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-wrap gap-2 border-b border-border p-4">
            <Input className="w-48" placeholder="Filter by Employee ID" value={empId} onChange={e => { setEmpId(e.target.value); setPage(1); }} />
            <Select value={action} onValueChange={(v) => { setAction(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Action type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {ACTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date & Time</TableHead><TableHead>Employee</TableHead>
              <TableHead>Role</TableHead><TableHead>Action</TableHead><TableHead>Context</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data?.rows.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="text-muted-foreground">{formatIstDateTime(r.createdAt)}</TableCell>
                  <TableCell><div className="font-medium">{r.empName}</div><div className="text-xs text-muted-foreground">{r.empId}</div></TableCell>
                  <TableCell><Badge variant="secondary">{r.role}</Badge></TableCell>
                  <TableCell>{r.action}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.context ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data && <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />}
        </CardContent>
      </Card>
    </div>
  );
}
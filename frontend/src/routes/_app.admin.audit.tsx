import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pager } from "@/components/common/Pager";
import { listAudit } from "@/services/mock";
import { formatIstDateTime } from "@/lib/format";
import { FileSpreadsheet, FileText, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { exportGeneric } from "@/lib/report-export";
import { useCurrentUser } from "@/lib/auth";

export const Route = createFileRoute("/_app/admin/audit")({ component: AuditPage });

const ACTIONS = [
  "Login",
  "Logout",
  "Password Change",
  "Employee Create",
  "Employee Update",
  "Employee Delete",
  "Ticket Create",
  "Ticket Delete",
  "Assignment",
  "Reassignment",
  "Comment",
  "Status Change",
  "Resolve",
  "Close",
  "Export",
];
const ROLES = ["Admin", "User", "L2", "L3"];

function AuditPage() {
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [actionFilter, setActionFilter] = useState("All");

  const [exporting, setExporting] = useState<"Excel" | "PDF" | null>(null);
  const user = useCurrentUser();

  const queryParams: any = {
    page,
    pageSize: 15,
    searchText: searchText || undefined,
    role: roleFilter !== "All" ? roleFilter.toUpperCase() : undefined,
    actionType: actionFilter !== "All" ? actionFilter : undefined,
  };

  const { data } = useQuery({
    queryKey: ["audit", queryParams],
    queryFn: () => listAudit(queryParams as any),
  });

  async function handleExport(kind: "Excel" | "PDF") {
    const exportParams = { ...queryParams, page: 1, pageSize: 10000 };
    const all = await listAudit(exportParams as any);
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
        headers: ["Sr No", "Date & Time (IST)", "User", "User ID", "Role", "Action", "Context"],
        data: all.rows.map((r, i) => [
          i + 1,
          formatIstDateTime(r.createdAt),
          r.empName,
          r.empId,
          r.role,
          r.action,
          r.context ?? "",
        ]),
        summary: [
          ["Total Records", all.rows.length],
          ["Search Text", searchText || "None"],
          ["Role Filter", roleFilter],
          ["Action Filter", actionFilter],
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
      <PageHeader
        title="Audit Logs"
        subtitle="System-wide activity log for compliance and traceability."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={exporting !== null}
              onClick={() => handleExport("Excel")}
            >
              {exporting === "Excel" ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="mr-1.5 h-4 w-4" />
              )}
              {exporting === "Excel" ? "Exporting…" : "Excel"}
            </Button>
            <Button disabled={exporting !== null} onClick={() => handleExport("PDF")}>
              {exporting === "PDF" ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-1.5 h-4 w-4" />
              )}
              {exporting === "PDF" ? "Exporting…" : "PDF"}
            </Button>
          </div>
        }
      />

      {/* Universal Search & Filters (3 Controls) */}
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row md:items-center gap-4 border-b border-border p-4 bg-muted/20">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 w-full bg-white dark:bg-slate-900"
                placeholder="Search by name, ID, role, action, or date…"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Select
                value={roleFilter}
                onValueChange={(v) => {
                  setRoleFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[140px] bg-white dark:bg-slate-900">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Roles</SelectItem>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={actionFilter}
                onValueChange={(v) => {
                  setActionFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px] bg-white dark:bg-slate-900">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Actions</SelectItem>
                  {ACTIONS.map((a) => {
                    let displayLabel = a;
                    if (a === "Employee Create") displayLabel = "User Created";
                    else if (a === "Employee Update") displayLabel = "User Updated";
                    else if (a === "Employee Delete") displayLabel = "User Deleted";
                    else if (a === "Ticket Create") displayLabel = "Ticket Created";
                    else if (a === "Ticket Delete") displayLabel = "Ticket Deleted";
                    else if (a === "Assignment") displayLabel = "Ticket Assigned";
                    else if (a === "Reassignment") displayLabel = "Ticket Reassigned";
                    else if (a === "Comment") displayLabel = "Comment Added";
                    else if (a === "Status Change") displayLabel = "Status Changed";
                    return (
                      <SelectItem key={a} value={a}>
                        {displayLabel}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          {!data?.rows.length ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No audit logs found matching your criteria.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Context</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((r) => {
                  let displayAction = r.action;
                  if (r.action === "Employee Create") displayAction = "User Create" as any;
                  else if (r.action === "Employee Update") displayAction = "User Update" as any;
                  else if (r.action === "Employee Delete") displayAction = "User Delete" as any;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {formatIstDateTime(r.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {r.empName} <span className="text-muted-foreground">({r.empId})</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{r.role}</Badge>
                      </TableCell>
                      <TableCell>{displayAction}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-pre-wrap break-all max-w-sm py-2 px-3">
                        {r.context ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {data && (
            <Pager
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

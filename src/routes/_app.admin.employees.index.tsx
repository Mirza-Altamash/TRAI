import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pager } from "@/components/common/Pager";
import { EmptyState } from "@/components/common/EmptyState";
import { listEmployees, deleteEmployee } from "@/services/mock";
import { DIVISIONS } from "@/types";
import { Plus, Search, Trash2, Pencil } from "lucide-react";
import { formatIstDate } from "@/lib/format";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_app/admin/employees/")({ component: EmployeesPage });

function EmployeesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [division, setDivision] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const filters = { search, division: division || undefined, role: role || undefined, page, pageSize: 10 };
  const { data } = useQuery({ queryKey: ["employees", filters], queryFn: () => listEmployees(filters) });

  const onDelete = async () => {
    if (!pendingDelete) return;
    await deleteEmployee(pendingDelete);
    toast.success("Employee removed");
    setPendingDelete(null);
    qc.invalidateQueries({ queryKey: ["employees"] });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        subtitle="Manage TRAI users, L2 and L3 members."
        actions={
          <Button asChild><Link to="/admin/employees/create"><Plus className="mr-1.5 h-4 w-4" /> Add Employee</Link></Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, employee ID, or email" className="pl-8" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Select value={division} onValueChange={(v) => { setDivision(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Division" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All divisions</SelectItem>
                {DIVISIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={role} onValueChange={(v) => { setRole(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="L2">L2</SelectItem>
                <SelectItem value="L3">L3</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!data?.rows.length ? (
            <EmptyState title="No employees match these filters" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Sr.</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Sub Role</TableHead>
                  <TableHead>Division</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((e, i) => (
                  <TableRow key={e.empId}>
                    <TableCell className="text-muted-foreground">{(page - 1) * 10 + i + 1}</TableCell>
                    <TableCell className="font-mono text-xs">{e.empId}</TableCell>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell className="text-muted-foreground">{e.email}</TableCell>
                    <TableCell><Badge variant="secondary">{e.role}</Badge></TableCell>
                    <TableCell>{e.subRole ?? "—"}</TableCell>
                    <TableCell>{e.division}</TableCell>
                    <TableCell>{e.designation}</TableCell>
                    <TableCell>{e.floor}</TableCell>
                    <TableCell className="text-muted-foreground">{formatIstDate(e.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="icon" aria-label="Edit"><Link to="/admin/employees/$empId/edit" params={{ empId: e.empId }}><Pencil className="h-4 w-4" /></Link></Button>
                      <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => setPendingDelete(e.empId)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {data && <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />}
        </CardContent>
      </Card>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove employee?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the account from the system.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
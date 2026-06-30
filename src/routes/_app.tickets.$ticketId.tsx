import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { Pager } from "@/components/common/Pager";
import { addComment, getTicket, listMembers, listTrail, reassignTicket, updateStatus, deleteTicket } from "@/services/mock";
import { useCurrentUser } from "@/lib/auth";
import { formatIstDateTime } from "@/lib/format";
import { L2_SUBROLES, L3_SUBROLES } from "@/types";
import type { Role, TicketStatus, TrailAction, TrailLog } from "@/types";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, ExternalLink, FileSpreadsheet, FileText, MessageSquare, RefreshCcw, Trash2 } from "lucide-react";
import { exportTrailToExcel, exportTrailToPdf } from "@/lib/trail-export";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_app/tickets/$ticketId")({
  component: TicketDetail,
  notFoundComponent: () => <div className="p-8 text-sm text-muted-foreground">Ticket not found.</div>,
});

function TicketDetail() {
  const { ticketId } = Route.useParams();
  const user = useCurrentUser();
  const qc = useQueryClient();
  const router = useRouter();

  const { data: t } = useQuery({ queryKey: ["ticket", ticketId], queryFn: () => getTicket(ticketId) });
  if (t === undefined) return null;
  if (t === null) throw notFound();
  const isL3 = user.role === "L3";
  const isL2 = user.role === "L2";
  const isAdmin = user.role === "ADMIN";
  const isUser = user.role === "USER";
  const isClosed = t!.currentStatus === "Closed";
  const showManage = !isClosed;
  const showTrailInDetails = isAdmin || isL2 || isL3;

  const onDelete = async () => {
    try {
      await deleteTicket(ticketId);
      toast.success("Ticket deleted successfully.");
      qc.invalidateQueries({ queryKey: ["tickets"] });
      router.navigate({ to: "/admin/dashboard" });
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to delete ticket.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t!.summary}
        subtitle={`${t!.ticketId} · ${t!.division} · ${t!.type}`}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.history.back();
                } else {
                  const fallback =
                    user.role === "ADMIN" ? "/admin/dashboard"
                    : user.role === "L3" ? "/admin/l3-tickets"
                    : user.role === "L2" ? "/l2/tickets"
                    : "/user/tickets";
                  router.navigate({ to: fallback });
                }
              }}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
            </Button>

            {(isAdmin || isL3) && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-1.5 h-4 w-4" /> Delete Ticket
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete ticket <span className="font-mono font-semibold">{t!.ticketId}</span> and all related history records.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Yes, Delete Ticket
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        }
      />

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">{isAdmin ? "Total Ticket (Lifecycle)" : "Ticket Details"}</TabsTrigger>
          {isUser && <TabsTrigger value="status">Current Status</TabsTrigger>}
          {!showTrailInDetails && <TabsTrigger value="trail">Complete Trail</TabsTrigger>}
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <Card><CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-sm">
              <Detail k="Ticket Number" v={<span className="font-mono">{t!.ticketId}</span>} />
              <Detail k="Created By" v={`${t!.createdByName} (${t!.createdBy})`} />
              <Detail k="Division" v={t!.division} />
              <Detail k="Type" v={t!.type} />
              <Detail k="Priority" v={<PriorityBadge priority={t!.priority} />} />
              <Detail k="Current Status" v={<StatusBadge status={t!.currentStatus} />} />
              <Detail k="Portal Name" v={t!.portalName ?? "—"} />
              <Detail k="Portal URL" v={t!.portalUrl ? <a className="inline-flex items-center gap-1 text-primary hover:underline" href={t!.portalUrl} target="_blank" rel="noreferrer">{t!.portalUrl}<ExternalLink className="h-3 w-3" /></a> : "—"} />
              <Detail k="Report Name" v={t!.reportName ?? "—"} />
              <Detail k="Current Assignee" v={`${t!.currentAssigneeName} (${t!.currentAssigneeRole})`} />
              <Detail k="Created" v={formatIstDateTime(t!.createdAt)} />
              {t!.resolvedAt && <Detail k="Resolved" v={formatIstDateTime(t!.resolvedAt)} />}
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Summary</div>
              <p className="mt-1 text-sm text-foreground">{t!.summary}</p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Description</div>
              <p className="mt-1 whitespace-pre-line text-sm text-foreground">{t!.description}</p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Attachments</div>
              {t!.attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attachments.</p>
              ) : (
                <ul className="text-sm text-foreground space-y-1">
                  {t!.attachments.map((a) => {
                    const baseApiUrl = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000/api";
                    const baseUrl = baseApiUrl.replace(/\/api\/?$/, "");
                    const downloadUrl = `${baseUrl}/uploads/${a.id}`;
                    return (
                      <li key={a.id}>
                        <a
                          href={downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                          download={a.name}
                        >
                          {a.name}
                          <span className="text-xs text-muted-foreground font-normal ml-1">
                            ({a.sizeKb} KB)
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </CardContent></Card>

          {showManage && <ManagePanel ticketId={t!.ticketId} currentStatus={t!.currentStatus} />}
          {showTrailInDetails && (
            <div className="mt-4">
              <TrailTable ticketId={t!.ticketId} generatedBy={`${user.name} (${user.empId})`} />
            </div>
          )}
        </TabsContent>

        {isUser && (
          <TabsContent value="status" className="mt-4">
            <Card><CardContent className="p-6 grid grid-cols-1 gap-4 md:grid-cols-2 text-sm">
              <Detail k="Current Status" v={<StatusBadge status={t!.currentStatus} />} />
              <Detail k="Current Assignee" v={`${t!.currentAssigneeName} · ${t!.currentAssigneeRole}`} />
              <Detail k="Created" v={formatIstDateTime(t!.createdAt)} />
              <Detail k="Assigned" v={t!.assignedAt ? formatIstDateTime(t!.assignedAt) : "—"} />
              <Detail k="Closed" v={t!.closedAt ? formatIstDateTime(t!.closedAt) : "—"} />
            </CardContent></Card>
          </TabsContent>
        )}

        {!showTrailInDetails && (
          <TabsContent value="trail" className="mt-4">
            <TrailTable ticketId={t!.ticketId} generatedBy={`${user.name} (${user.empId})`} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );

  function Detail({ k, v }: { k: string; v: React.ReactNode }) {
    return (
      <div className="flex flex-col gap-0.5">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{k}</div>
        <div className="text-sm text-foreground">{v}</div>
      </div>
    );
  }

  function ManagePanel({ ticketId, currentStatus }: { ticketId: string; currentStatus: TicketStatus }) {
    const [comment, setComment] = useState("");
    const [reassignLevel, setReassignLevel] = useState<"L2" | "L3">("L2");
    const [reassignSub, setReassignSub] = useState<string>("");
    const [reassignMember, setReassignMember] = useState<string>("");
    const [closing, setClosing] = useState(false);
    const [closeComment, setCloseComment] = useState("");
    const [onlyComment, setOnlyComment] = useState("");
    const [resolveComment, setResolveComment] = useState("");
    const [resolving, setResolving] = useState(false);

    const { data: members = [] } = useQuery({
      queryKey: ["members", reassignLevel, reassignSub], enabled: !!reassignSub,
      queryFn: () => listMembers(reassignLevel, reassignSub),
    });

    const resolvedAtDate = t!.resolvedAt ? new Date(t!.resolvedAt) : null;
    const isMoreThan15Days = resolvedAtDate
      ? (new Date().getTime() - resolvedAtDate.getTime()) / (1000 * 60 * 60 * 24) > 15
      : false;

    const canUserClose = user.role === "USER" && currentStatus === "Resolved" && !isMoreThan15Days && user.empId === t!.createdBy;
    const canL3Close = user.role === "L3" && currentStatus === "Resolved" && isMoreThan15Days;

    const tabs: { value: string; label: string; icon: any }[] = [
      { value: "comment", label: "Comment Only", icon: MessageSquare }
    ];

    if (user.role === "L2" || user.role === "L3") {
      tabs.push({ value: "reassign", label: "Reassign", icon: RefreshCcw });
    }

    if (user.role === "L3" && currentStatus === "Open") {
      tabs.push({ value: "resolve", label: "Resolve Ticket", icon: CheckCircle2 });
    }

    if (canUserClose || canL3Close) {
      tabs.push({ value: "close", label: "Close Ticket", icon: CheckCircle2 });
    }

    const onReassign = async () => {
      if (!reassignMember || !comment.trim()) return;
      try {
        await reassignTicket(ticketId, reassignMember, comment.trim());
        setComment("");
        toast.success("Ticket reassigned successfully");
        qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
        qc.invalidateQueries({ queryKey: ["trail", ticketId] });
        qc.invalidateQueries({ queryKey: ["assignee-tickets"] });
      } catch (e: any) {
        toast.error(e.response?.data?.message || "Failed to reassign");
      }
    };

    const onClose = async () => {
      if (!closeComment.trim()) {
        toast.error("A comment is required to close the ticket");
        return;
      }
      setClosing(true);
      try {
        await updateStatus(ticketId, "Closed", closeComment.trim());
        toast.success("Ticket closed");
        setCloseComment("");
        qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
        qc.invalidateQueries({ queryKey: ["trail", ticketId] });
        qc.invalidateQueries({ queryKey: ["assignee-tickets"] });
      } catch (e: any) {
        toast.error(e.response?.data?.message || "Failed to close ticket");
      } finally {
        setClosing(false);
      }
    };

    const onResolve = async () => {
      if (!resolveComment.trim()) {
        toast.error("A comment is required to resolve the ticket");
        return;
      }
      setResolving(true);
      try {
        await updateStatus(ticketId, "Resolved", resolveComment.trim());
        toast.success("Ticket resolved");
        setResolveComment("");
        qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
        qc.invalidateQueries({ queryKey: ["trail", ticketId] });
        qc.invalidateQueries({ queryKey: ["assignee-tickets"] });
      } catch (e: any) {
        toast.error(e.response?.data?.message || "Failed to resolve ticket");
      } finally {
        setResolving(false);
      }
    };

    const onCommentOnly = async () => {
      if (!onlyComment.trim()) return;
      try {
        await addComment(ticketId, onlyComment.trim(), user);
        setOnlyComment("");
        toast.success("Comment added");
        qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
        qc.invalidateQueries({ queryKey: ["trail", ticketId] });
        qc.invalidateQueries({ queryKey: ["assignee-tickets"] });
      } catch (e: any) {
        toast.error(e.response?.data?.message || "Failed to add comment");
      }
    };

    const defaultTab = tabs[0]?.value || "comment";

    return (
      <Card className="mt-4 border border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base">Manage Ticket</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs defaultValue={defaultTab} className="w-full">
            {tabs.length > 1 && (
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 max-w-lg mb-4 bg-muted/50">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger key={tab.value} value={tab.value} className="text-xs font-semibold">
                      <Icon className="mr-1.5 h-3.5 w-3.5" /> {tab.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            )}

            {/* Tab 1: Comment Only */}
            {tabs.some(t => t.value === "comment") && (
              <TabsContent value="comment" className="space-y-4 mt-0">
                <div className="space-y-1.5">
                  <Label htmlFor="manage-comment-only">Your Comment</Label>
                  <Textarea
                    id="manage-comment-only"
                    rows={3}
                    placeholder="Add a comment without changing status or assignee…"
                    value={onlyComment}
                    onChange={(e) => setOnlyComment(e.target.value)}
                    className="bg-slate-50/50 dark:bg-slate-900/50"
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={onCommentOnly} disabled={!onlyComment.trim()}>
                    Post Comment
                  </Button>
                </div>
              </TabsContent>
            )}

            {/* Tab 2: Reassign */}
            {tabs.some(t => t.value === "reassign") && (
              <TabsContent value="reassign" className="space-y-4 mt-0">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>Target Level</Label>
                    <Select value={reassignLevel} onValueChange={(v) => { setReassignLevel(v as "L2" | "L3"); setReassignSub(""); setReassignMember(""); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="L2">L2</SelectItem><SelectItem value="L3">L3</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select value={reassignSub} onValueChange={(v) => { setReassignSub(v); setReassignMember(""); }}>
                      <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                      <SelectContent>
                        {(reassignLevel === "L2" ? L2_SUBROLES : L3_SUBROLES).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Member</Label>
                    <Select value={reassignMember} onValueChange={setReassignMember}>
                      <SelectTrigger><SelectValue placeholder={reassignSub ? "Select Member" : "Pick category first"} /></SelectTrigger>
                      <SelectContent>{members.map(m => <SelectItem key={m.empId} value={m.empId}>{m.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Reassignment Comment <span className="text-destructive">*</span></Label>
                  <Textarea
                    rows={3}
                    placeholder="Add a comment to include with the reassignment (required)…"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="bg-slate-50/50 dark:bg-slate-900/50"
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={onReassign} disabled={!reassignMember || !comment.trim()}>
                    Reassign &amp; Comment
                  </Button>
                </div>
              </TabsContent>
            )}

            {/* Tab 3: Resolve Ticket */}
            {tabs.some(t => t.value === "resolve") && (
              <TabsContent value="resolve" className="space-y-4 mt-0">
                <div className="space-y-1.5">
                  <Label>Resolution Comment <span className="text-destructive">*</span></Label>
                  <Textarea
                    rows={3}
                    placeholder="Explain the resolution details (required)…"
                    value={resolveComment}
                    onChange={(e) => setResolveComment(e.target.value)}
                    className="bg-slate-50/50 dark:bg-slate-900/50"
                  />
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <p className="text-xs text-muted-foreground">This will set the status to Resolved and assign the ticket back to the creator.</p>
                  <Button variant="default" onClick={onResolve} disabled={resolving || !resolveComment.trim()}>
                    {resolving ? "Resolving…" : "Resolve Ticket"}
                  </Button>
                </div>
              </TabsContent>
            )}

            {/* Tab 4: Close Ticket */}
            {tabs.some(t => t.value === "close") && (
              <TabsContent value="close" className="space-y-4 mt-0">
                <div className="space-y-1.5">
                  <Label>Closure Comment <span className="text-destructive">*</span></Label>
                  <Textarea
                    rows={3}
                    placeholder="Explain the reason for closing this ticket (required)…"
                    value={closeComment}
                    onChange={(e) => setCloseComment(e.target.value)}
                    className="bg-slate-50/50 dark:bg-slate-900/50"
                  />
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <p className="text-xs text-muted-foreground font-medium text-amber-600 dark:text-amber-400">
                    {canL3Close ? "Closing this ticket on behalf of the user due to 15 days of inactivity." : "Please verify the resolution and close this ticket."}
                  </p>
                  <Button variant="default" onClick={onClose} disabled={closing || !closeComment.trim()}>
                    {closing ? "Closing…" : "Close Ticket"}
                  </Button>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    );
  }
}

const ROLE_OPTIONS: Role[] = ["USER", "L2", "L3", "ADMIN"];
const ACTION_OPTIONS: TrailAction[] = ["Ticket Created","Assignment","Reassignment","Comment","Status Change","Resolve","Close","Export"];

function TrailTable({ ticketId, generatedBy }: { ticketId: string; generatedBy: string }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("");
  const [action, setAction] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [exporting, setExporting] = useState<null | "pdf" | "excel">(null);

  const { data } = useQuery({
    queryKey: ["trail", ticketId, { page, search, role, action, sortDir }],
    queryFn: () => listTrail(ticketId, {
      page, pageSize: 10, search: search || undefined,
      role: (role as Role) || undefined,
      action: (action as TrailAction) || undefined, sortDir,
    }),
  });

  const runExport = async (format: "pdf" | "excel") => {
    const rows = data?.rows ?? [];
    if (rows.length === 0) {
      toast.error("No trail entries to export");
      return;
    }
    setExporting(format);
    try {
      if (format === "pdf") {
        await exportTrailToPdf(ticketId, rows, generatedBy);
        toast.success("PDF downloaded");
      } else {
        await exportTrailToExcel(ticketId, rows, generatedBy);
        toast.success("Excel downloaded");
      }
    } catch (e) {
      console.error(e);
      toast.error("Export failed");
    } finally {
      setExporting(null);
    }
  };

  return (
    <Card><CardContent className="p-0">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
        <Input className="w-56" placeholder="Search name or comment" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <Select value={role} onValueChange={(v) => { setRole(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ROLE_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={action} onValueChange={(v) => { setAction(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Action" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {ACTION_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => setSortDir(sortDir === "desc" ? "asc" : "desc")}>
          {sortDir === "desc" ? "Latest First" : "Oldest First"}
        </Button>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" disabled={exporting !== null} onClick={() => runExport("excel")}>
            <FileSpreadsheet className="mr-1.5 h-4 w-4" /> {exporting === "excel" ? "Exporting…" : "Excel"}
          </Button>
          <Button size="sm" disabled={exporting !== null} onClick={() => runExport("pdf")}>
            <FileText className="mr-1.5 h-4 w-4" /> {exporting === "pdf" ? "Exporting…" : "PDF"}
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader><TableRow>
          <TableHead>Date & Time</TableHead>
          <TableHead>Action By &amp; Role</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Comment</TableHead>
          <TableHead>Status</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {data?.rows.map(r => (
            <TableRow key={r.id}>
              <TableCell className="text-muted-foreground whitespace-nowrap">{formatIstDateTime(r.createdAt)}</TableCell>
              <TableCell className="font-medium">
                {r.performedByName} <span className="text-muted-foreground">({r.performerRole})</span>
              </TableCell>
              <TableCell>{r.action}</TableCell>
              <TableCell className="max-w-md text-muted-foreground">{r.comment ?? "—"}</TableCell>
              <TableCell><StatusBadge status={r.currentStatus || "Open"} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {data && <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />}
    </CardContent></Card>
  );
}
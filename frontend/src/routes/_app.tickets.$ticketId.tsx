import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { Pager } from "@/components/common/Pager";
import {
  addComment,
  getTicket,
  listMembers,
  listTrail,
  reassignTicket,
  updateStatus,
  deleteTicket,
  reopenTicket,
} from "@/services/mock";
import { markTicketPriority, removeTicketPriority } from "@/services/ticketApi";
import { useCurrentUser } from "@/lib/auth";
import { formatIstDateTime } from "@/lib/format";
import { L2_SUBROLES, L3_SUBROLES } from "@/types";
import type { Role, TicketStatus, TrailAction, TrailLog, Ticket } from "@/types";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  MessageSquare,
  RefreshCcw,
  Trash2,
  Paperclip,
  Download,
  FileArchive,
  Image as FileIconImage,
  Star,
} from "lucide-react";
import { exportTrailToExcel, exportTrailToPdf } from "@/lib/trail-export";
import { getSocket } from "@/lib/socketClient";
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
  notFoundComponent: () => (
    <div className="p-8 text-sm text-muted-foreground">Ticket not found.</div>
  ),
});

function TicketDetail() {
  const { ticketId } = Route.useParams();
  const user = useCurrentUser();
  const qc = useQueryClient();
  const router = useRouter();

  const { data: t } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: () => getTicket(ticketId),
  });
  const [priorityModalOpen, setPriorityModalOpen] = useState(false);
  const [priorityReason, setPriorityReason] = useState("");
  const [isPriorityLoading, setIsPriorityLoading] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onPriorityMarked = (data: any) => {
      if (data.ticketId === ticketId) {
        qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
      }
    };
    const onPriorityRemoved = (data: any) => {
      if (data.ticketId === ticketId) {
        qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
      }
    };
    const onPriorityCleared = (data: any) => {
      if (data.ticketId === ticketId) {
        qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
      }
    };
    const onTrailUpdated = (data: any) => {
      if (data.ticketId === ticketId) {
        qc.invalidateQueries({ queryKey: ["trail", ticketId] });
      }
    };

    socket.on("ticket:priority-marked", onPriorityMarked);
    socket.on("ticket:priority-removed", onPriorityRemoved);
    socket.on("ticket:priority-cleared-on-close", onPriorityCleared);
    socket.on("ticket:trail-updated", onTrailUpdated);

    return () => {
      socket.off("ticket:priority-marked", onPriorityMarked);
      socket.off("ticket:priority-removed", onPriorityRemoved);
      socket.off("ticket:priority-cleared-on-close", onPriorityCleared);
      socket.off("ticket:trail-updated", onTrailUpdated);
    };
  }, [ticketId, qc]);

  if (t === undefined) return null;
  if (t === null) throw notFound();
  const isL3 = user.role === "L3";
  const isL2 = user.role === "L2";
  const isAdmin = user.role === "ADMIN";
  const isUser = user.role === "USER";
  const isClosed = t!.currentStatus === "Closed";
  const showManage = !isClosed;
  const showTrailInDetails = isAdmin || isL2 || isL3;
  const hasMarkedPriority = t!.priorityMarkedBy?.some((p) => p.userId === user.empId);

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

  const onMarkPriority = async () => {
    setIsPriorityLoading(true);
    try {
      await markTicketPriority(ticketId, priorityReason);
      toast.success("Ticket marked as Priority successfully.");
      setPriorityModalOpen(false);
      setPriorityReason("");
      qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
      qc.invalidateQueries({ queryKey: ["tickets"] });
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to mark priority.");
    } finally {
      setIsPriorityLoading(false);
    }
  };

  const onRemovePriority = async () => {
    setIsPriorityLoading(true);
    try {
      await removeTicketPriority(ticketId);
      toast.success("Priority removed successfully.");
      qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
      qc.invalidateQueries({ queryKey: ["tickets"] });
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to remove priority.");
    } finally {
      setIsPriorityLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.history.back();
            } else {
              const fallback =
                user.role === "ADMIN"
                  ? "/admin/dashboard"
                  : user.role === "L3"
                    ? "/admin/l3-tickets"
                    : user.role === "L2"
                      ? "/l2/tickets"
                      : "/user/tickets";
              router.navigate({ to: fallback });
            }
          }}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>

        {(isAdmin || isL3) && (
          <>
            {hasMarkedPriority ? (
              <Button
                variant="outline"
                size="sm"
                className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 dark:bg-amber-900/30 dark:text-amber-500"
                onClick={onRemovePriority}
                disabled={isPriorityLoading}
              >
                <Star className="mr-1.5 h-4 w-4 fill-current" /> Remove Priority
              </Button>
            ) : (
              <AlertDialog open={priorityModalOpen} onOpenChange={setPriorityModalOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:text-amber-600 hover:bg-amber-50"
                  >
                    <Star className="mr-1.5 h-4 w-4" /> Mark as Priority
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Mark Ticket as Priority</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will flag the ticket for urgent handling and notify the assignee.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="my-4">
                    <Label>Reason (Optional)</Label>
                    <Input
                      placeholder="e.g. Immediate regulatory attention required"
                      value={priorityReason}
                      onChange={(e) => setPriorityReason(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button onClick={onMarkPriority} disabled={isPriorityLoading}>
                      Mark Priority
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

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
                    This action cannot be undone. This will permanently delete ticket{" "}
                    <span className="font-mono font-semibold">{t!.ticketId}</span> and all related
                    history records.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, Delete Ticket
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">
            {isAdmin ? "Total Ticket (Lifecycle)" : "Ticket Details"}
          </TabsTrigger>
          {isUser && <TabsTrigger value="status">Current Status</TabsTrigger>}
          {!showTrailInDetails && <TabsTrigger value="trail">Complete Trail</TabsTrigger>}
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-sm">
                <Detail k="Ticket Number" v={<span className="font-mono">{t!.ticketId}</span>} />
                <Detail k="Created By" v={`${t!.createdByName} (${t!.createdBy})`} />
                <Detail k="Division" v={t!.division} />
                <Detail k="Type" v={t!.type} />
                <Detail
                  k="Priority"
                  v={
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={t!.priority} />
                      {t!.isPriority && (
                        <Badge
                          variant="default"
                          className="bg-amber-500 text-white hover:bg-amber-600 border-transparent"
                        >
                          <Star className="h-3 w-3 fill-current mr-1" /> Priority
                        </Badge>
                      )}
                    </div>
                  }
                />
                <Detail k="Current Status" v={<StatusBadge status={t!.currentStatus} />} />
                <Detail k="Portal Name" v={t!.portalName ?? "—"} />
                <Detail
                  k="Portal URL"
                  v={
                    t!.portalUrl ? (
                      <a
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                        href={t!.portalUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t!.portalUrl}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      "—"
                    )
                  }
                />
                <Detail k="Report Name" v={t!.reportName ?? "—"} />
                <Detail
                  k="Current Assignee"
                  v={`${t!.currentAssigneeName} (${t!.currentAssigneeRole})`}
                />
                <Detail k="Created" v={formatIstDateTime(t!.createdAt)} />
                {t!.resolvedAt && <Detail k="Resolved" v={formatIstDateTime(t!.resolvedAt)} />}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Summary</div>
                <p className="mt-1 text-sm text-foreground">{t!.summary}</p>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Description
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words [overflow-wrap:anywhere] max-w-full text-sm text-foreground bg-slate-50/50 dark:bg-slate-900/50 rounded border border-border/40 p-3 leading-relaxed">
                  {t!.description}
                </p>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Attachments
                </div>
                {t!.attachments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No attachments.</p>
                ) : (
                  <ul className="text-sm text-foreground space-y-1">
                    {t!.attachments.map((a) => {
                      const baseApiUrl =
                        (import.meta.env.VITE_API_URL as string) || "http://localhost:5000/api";
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
            </CardContent>
          </Card>

          {showManage && <ManagePanel ticket={t!} />}
          {showTrailInDetails && (
            <div className="mt-4">
              <TrailTable
                key={t!.ticketId}
                ticketId={t!.ticketId}
                generatedBy={`${user.name} (${user.empId})`}
              />
            </div>
          )}
        </TabsContent>

        {isUser && (
          <TabsContent value="status" className="mt-4">
            <Card>
              <CardContent className="p-6 grid grid-cols-1 gap-4 md:grid-cols-2 text-sm">
                <Detail k="Current Status" v={<StatusBadge status={t!.currentStatus} />} />
                <Detail
                  k="Current Assignee"
                  v={`${t!.currentAssigneeName} · ${t!.currentAssigneeRole}`}
                />
                <Detail k="Created" v={formatIstDateTime(t!.createdAt)} />
                <Detail k="Assigned" v={t!.assignedAt ? formatIstDateTime(t!.assignedAt) : "—"} />
                <Detail k="Closed" v={t!.closedAt ? formatIstDateTime(t!.closedAt) : "—"} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {!showTrailInDetails && (
          <TabsContent value="trail" className="mt-4">
            <TrailTable
              key={t!.ticketId}
              ticketId={t!.ticketId}
              generatedBy={`${user.name} (${user.empId})`}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function Detail({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{k}</div>
      <div className="text-sm text-foreground">{v}</div>
    </div>
  );
}

function ManagePanel({ ticket }: { ticket: Ticket }) {
  const ticketId = ticket.ticketId;
  const currentStatus = ticket.currentStatus;
  const user = useCurrentUser();
  const qc = useQueryClient();

  const [comment, setComment] = useState("");
  const [reassignLevel, setReassignLevel] = useState<"L2" | "L3">("L2");
  const [reassignSub, setReassignSub] = useState<string>("");
  const [reassignMember, setReassignMember] = useState<string>("");
  const [closing, setClosing] = useState(false);
  const [closeComment, setCloseComment] = useState("");
  const [onlyComment, setOnlyComment] = useState("");
  const [resolveComment, setResolveComment] = useState("");
  const [resolving, setResolving] = useState(false);
  const [reopenComment, setReopenComment] = useState("");
  const [reopening, setReopening] = useState(false);

  const [onlyFiles, setOnlyFiles] = useState<File[]>([]);
  const [reassignFiles, setReassignFiles] = useState<File[]>([]);
  const [resolveFiles, setResolveFiles] = useState<File[]>([]);
  const [closeFiles, setCloseFiles] = useState<File[]>([]);
  const [reopenFiles, setReopenFiles] = useState<File[]>([]);

  const { data: members = [] } = useQuery({
    queryKey: ["members", reassignLevel, reassignSub],
    enabled: !!reassignSub,
    queryFn: () => listMembers(reassignLevel, reassignSub),
  });

  const resolvedAtDate = ticket.resolvedAt ? new Date(ticket.resolvedAt) : null;
  const isMoreThan30Days = resolvedAtDate
    ? (new Date().getTime() - resolvedAtDate.getTime()) / (1000 * 60 * 60 * 24) > 30
    : false;

  const canUserClose =
    currentStatus === "Resolved" && !isMoreThan30Days && user.empId === ticket.createdBy;
  const canUserReopen =
    currentStatus === "Resolved" && !isMoreThan30Days && user.empId === ticket.createdBy;
  const canL3Close = user.role === "L3" && currentStatus === "Resolved" && isMoreThan30Days;

  const tabs: { value: string; label: string; icon: any }[] = [
    { value: "comment", label: "Comment Only", icon: MessageSquare },
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

  if (canUserReopen) {
    tabs.push({ value: "reopen", label: "Reopen Ticket", icon: RefreshCcw });
  }

  const onReassign = async () => {
    if (!reassignMember || !comment.trim()) return;
    try {
      await reassignTicket(ticketId, reassignMember, comment.trim(), reassignFiles);
      setComment("");
      setReassignFiles([]);
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
      await updateStatus(ticketId, "Closed", closeComment.trim(), closeFiles);
      toast.success("Ticket closed");
      setCloseComment("");
      setCloseFiles([]);
      qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
      qc.invalidateQueries({ queryKey: ["trail", ticketId] });
      qc.invalidateQueries({ queryKey: ["assignee-tickets"] });
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to close ticket");
    } finally {
      setClosing(false);
    }
  };

  const onReopen = async () => {
    if (!reopenComment.trim()) {
      toast.error("A comment is required to reopen the ticket");
      return;
    }
    setReopening(true);
    try {
      await reopenTicket(ticketId, reopenComment.trim(), reopenFiles);
      toast.success("Ticket reopened");
      setReopenComment("");
      setReopenFiles([]);
      qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
      qc.invalidateQueries({ queryKey: ["trail", ticketId] });
      qc.invalidateQueries({ queryKey: ["assignee-tickets"] });
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to reopen ticket");
    } finally {
      setReopening(false);
    }
  };

  const onResolve = async () => {
    if (!resolveComment.trim()) {
      toast.error("A comment is required to resolve the ticket");
      return;
    }
    setResolving(true);
    try {
      await updateStatus(ticketId, "Resolved", resolveComment.trim(), resolveFiles);
      toast.success("Ticket resolved");
      setResolveComment("");
      setResolveFiles([]);
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
      await addComment(ticketId, onlyComment.trim(), onlyFiles);
      setOnlyComment("");
      setOnlyFiles([]);
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
          {tabs.some((t) => t.value === "comment") && (
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
              <AttachmentInput files={onlyFiles} setFiles={setOnlyFiles} />
              <div className="flex justify-end">
                <Button onClick={onCommentOnly} disabled={!onlyComment.trim()}>
                  Post Comment
                </Button>
              </div>
            </TabsContent>
          )}

          {/* Tab 2: Reassign */}
          {tabs.some((t) => t.value === "reassign") && (
            <TabsContent value="reassign" className="space-y-4 mt-0">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Target Level</Label>
                  <Select
                    value={reassignLevel}
                    onValueChange={(v) => {
                      setReassignLevel(v as "L2" | "L3");
                      setReassignSub("");
                      setReassignMember("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L2">L2</SelectItem>
                      <SelectItem value="L3">L3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select
                    value={reassignSub}
                    onValueChange={(v) => {
                      setReassignSub(v);
                      setReassignMember("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {(reassignLevel === "L2" ? L2_SUBROLES : L3_SUBROLES).map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Member</Label>
                  <Select value={reassignMember} onValueChange={setReassignMember}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={reassignSub ? "Select Member" : "Pick category first"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((m) => (
                        <SelectItem key={m.empId} value={m.empId}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>
                  Reassignment Comment <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  rows={3}
                  placeholder="Add a comment to include with the reassignment (required)…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="bg-slate-50/50 dark:bg-slate-900/50"
                />
              </div>
              <AttachmentInput files={reassignFiles} setFiles={setReassignFiles} />
              <div className="flex justify-end">
                <Button onClick={onReassign} disabled={!reassignMember || !comment.trim()}>
                  Reassign &amp; Comment
                </Button>
              </div>
            </TabsContent>
          )}

          {/* Tab 3: Resolve Ticket */}
          {tabs.some((t) => t.value === "resolve") && (
            <TabsContent value="resolve" className="space-y-4 mt-0">
              <div className="space-y-1.5">
                <Label>
                  Resolution Comment <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  rows={3}
                  placeholder="Explain the resolution details (required)…"
                  value={resolveComment}
                  onChange={(e) => setResolveComment(e.target.value)}
                  className="bg-slate-50/50 dark:bg-slate-900/50"
                />
              </div>
              <AttachmentInput files={resolveFiles} setFiles={setResolveFiles} />
              <div className="flex justify-end">
                <Button onClick={onResolve} disabled={resolving || !resolveComment.trim()}>
                  {resolving ? "Resolving…" : "Resolve Ticket"}
                </Button>
              </div>
            </TabsContent>
          )}

          {/* Tab 4: Close Ticket */}
          {tabs.some((t) => t.value === "close") && (
            <TabsContent value="close" className="space-y-4 mt-0">
              <div className="space-y-1.5">
                <Label>
                  Closing Comment <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  rows={3}
                  placeholder="Provide details about closing this ticket (required)…"
                  value={closeComment}
                  onChange={(e) => setCloseComment(e.target.value)}
                  className="bg-slate-50/50 dark:bg-slate-900/50"
                />
              </div>
              <AttachmentInput files={closeFiles} setFiles={setCloseFiles} />
              <div className="flex items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                <p className="text-xs text-muted-foreground">
                  This will finalize and close the ticket.
                </p>
                <Button
                  variant="default"
                  onClick={onClose}
                  disabled={closing || !closeComment.trim()}
                >
                  {closing ? "Closing…" : "Close Ticket"}
                </Button>
              </div>
            </TabsContent>
          )}

          {/* Tab 5: Reopen Ticket */}
          {tabs.some((t) => t.value === "reopen") && (
            <TabsContent value="reopen" className="space-y-4 mt-0">
              <div className="space-y-1.5">
                <Label>
                  Reopening Comment <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  rows={3}
                  placeholder="Describe why this ticket needs to be reopened (required)…"
                  value={reopenComment}
                  onChange={(e) => setReopenComment(e.target.value)}
                  className="bg-slate-50/50 dark:bg-slate-900/50"
                />
              </div>
              <AttachmentInput files={reopenFiles} setFiles={setReopenFiles} />
              <div className="flex items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                <p className="text-xs text-muted-foreground">
                  This will reopen the ticket and assign it back to the L3 supervisor.
                </p>
                <Button
                  variant="default"
                  onClick={onReopen}
                  disabled={reopening || !reopenComment.trim()}
                >
                  {reopening ? "Reopening…" : "Reopen Ticket"}
                </Button>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}

const ROLE_OPTIONS: Role[] = ["USER", "L2", "L3", "ADMIN"];
const ACTION_OPTIONS: TrailAction[] = [
  "Ticket Created",
  "Assignment",
  "Reassignment",
  "Comment",
  "Status Change",
  "Resolve",
  "Close",
  "Export",
];

function TrailTable({ ticketId, generatedBy }: { ticketId: string; generatedBy: string }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("");
  const [action, setAction] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [exporting, setExporting] = useState<null | "pdf" | "excel">(null);
  const [trail, setTrail] = useState<TrailLog[]>([]);

  const { data } = useQuery({
    queryKey: ["trail", ticketId, { page, search, role, action, sortDir }],
    queryFn: () =>
      listTrail(ticketId, {
        page,
        pageSize: 10,
        search: search || undefined,
        role: (role as Role) || undefined,
        action: (action as TrailAction) || undefined,
        sortDir,
      }),
  });

  useEffect(() => {
    setTrail([]);
  }, [ticketId]);

  useEffect(() => {
    if (data) {
      setTrail(data.rows);
    }
  }, [data]);

  const runExport = async (format: "pdf" | "excel") => {
    const rows = trail;
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
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
          <Input
            className="w-56"
            placeholder="Search name or comment"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Select
            value={role}
            onValueChange={(v) => {
              setRole(v === "all" ? "" : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {ROLE_OPTIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={action}
            onValueChange={(v) => {
              setAction(v === "all" ? "" : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {ACTION_OPTIONS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortDir(sortDir === "desc" ? "asc" : "desc")}
          >
            {sortDir === "desc" ? "Latest First" : "Oldest First"}
          </Button>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={exporting !== null}
              onClick={() => runExport("excel")}
            >
              <FileSpreadsheet className="mr-1.5 h-4 w-4" />{" "}
              {exporting === "excel" ? "Exporting…" : "Excel"}
            </Button>
            <Button size="sm" disabled={exporting !== null} onClick={() => runExport("pdf")}>
              <FileText className="mr-1.5 h-4 w-4" /> {exporting === "pdf" ? "Exporting…" : "PDF"}
            </Button>
          </div>
        </div>

        <div className="trail-table-wrapper w-full overflow-x-auto max-h-[70vh] bg-slate-50/20 dark:bg-slate-900/10 border-t border-border">
          {trail.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No trail records found.
            </div>
          ) : (
            <table className="trail-table w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-slate-100/60 dark:bg-slate-800/40">
                  <th className="p-3 font-semibold text-slate-700 dark:text-slate-300 w-[140px]">
                    Date & Time
                  </th>
                  <th className="p-3 font-semibold text-slate-700 dark:text-slate-300 w-[160px]">
                    Action By & Role
                  </th>
                  <th className="p-3 font-semibold text-slate-700 dark:text-slate-300 w-[120px]">
                    Action
                  </th>
                  <th className="p-3 font-semibold text-slate-700 dark:text-slate-300 min-w-[280px]">
                    Comment / Description
                  </th>
                  <th className="p-3 font-semibold text-slate-700 dark:text-slate-300 w-[90px] text-center">
                    Status
                  </th>
                  <th className="p-3 font-semibold text-slate-700 dark:text-slate-300 w-[240px]">
                    Attachments
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {trail.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors even:bg-slate-50/20 dark:even:bg-slate-900/5"
                  >
                    <td valign="top" className="p-3 align-top text-muted-foreground font-medium">
                      {formatIstDateTime(r.createdAt)}
                    </td>
                    <td
                      valign="top"
                      className="p-3 align-top font-medium text-slate-800 dark:text-slate-200"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span>{r.performedByName}</span>
                        <span className="inline-block text-[10px] text-muted-foreground bg-slate-100 dark:bg-slate-800 border border-border/50 rounded-full px-2 py-0.5 w-max font-semibold">
                          {r.performerRole}
                        </span>
                      </div>
                    </td>
                    <td
                      valign="top"
                      className="p-3 align-top font-semibold text-slate-700 dark:text-slate-300"
                    >
                      {r.action}
                    </td>
                    <td valign="top" className="p-3 align-top">
                      {r.comment ? (
                        <div className="trail-text text-foreground pr-4 leading-relaxed">
                          {r.comment}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">No comment.</span>
                      )}
                    </td>
                    <td valign="top" className="p-3 align-top text-center">
                      <div className="flex justify-center">
                        <StatusBadge status={r.currentStatus || "Open"} />
                      </div>
                    </td>
                    <td valign="top" className="p-3 align-top">
                      {r.attachments && r.attachments.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {r.attachments.map((file, idx) => {
                            const baseApiUrl =
                              (import.meta.env.VITE_API_URL as string) ||
                              "http://localhost:5000/api";
                            const baseUrl = baseApiUrl.replace(/\/api\/?$/, "");
                            const fullUrl = `${baseUrl}${file.url}`;
                            return (
                              <div
                                key={idx}
                                className="flex items-center gap-1.5 rounded border border-border bg-background dark:bg-slate-900/50 px-2 py-0.5 text-[11px] text-foreground shadow-sm w-full max-w-[220px]"
                              >
                                {getFileIcon(file.mimeType || file.filename)}
                                <span
                                  className="truncate font-medium max-w-[90px] text-muted-foreground"
                                  title={file.filename}
                                >
                                  {file.filename}
                                </span>
                                <span className="text-[9px] text-muted-foreground shrink-0">
                                  ({formatBytes(file.size)})
                                </span>
                                <div className="flex items-center gap-1 border-l border-border pl-1.5 ml-auto shrink-0">
                                  <a
                                    href={fullUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-primary-hover transition-colors"
                                    title="View File"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                  <a
                                    href={fullUrl}
                                    download={file.filename}
                                    className="text-primary hover:text-primary-hover transition-colors"
                                    title="Download File"
                                  >
                                    <Download className="h-3 w-3" />
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground font-normal">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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
  );
}

function getFileIcon(filenameOrMime: string) {
  const name = filenameOrMime.toLowerCase();
  if (name.includes("pdf")) return <FileText className="h-3.5 w-3.5 text-red-500 shrink-0" />;
  if (name.includes("doc") || name.includes("txt"))
    return <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
  if (name.includes("xls") || name.includes("xlsx") || name.includes("csv"))
    return <FileSpreadsheet className="h-3.5 w-3.5 text-green-500 shrink-0" />;
  if (name.includes("ppt")) return <FileText className="h-3.5 w-3.5 text-orange-500 shrink-0" />;
  if (name.includes("zip") || name.includes("rar") || name.includes("tar") || name.includes("gzip"))
    return <FileArchive className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
  if (
    name.includes("png") ||
    name.includes("jpg") ||
    name.includes("jpeg") ||
    name.includes("gif") ||
    name.includes("image")
  )
    return <FileIconImage className="h-3.5 w-3.5 text-purple-500 shrink-0" />;
  return <Paperclip className="h-3.5 w-3.5 text-slate-400 shrink-0" />;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function AttachmentInput({
  files,
  setFiles,
}: {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}) {
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const [inputId] = useState(() => `file-upload-${Math.random().toString(36).substr(2, 9)}`);

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shadow-sm"
      >
        <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
        Attach Files
      </label>
      <input
        id={inputId}
        type="file"
        multiple
        className="hidden"
        onChange={onFileChange}
        onClick={(e) => {
          (e.target as HTMLInputElement).value = "";
        }}
      />
      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {files.map((file, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              <span className="truncate max-w-[150px]">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="text-muted-foreground hover:text-slate-900 dark:hover:text-white font-bold ml-0.5"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTicket, listMembers } from "@/services/mock";
import { DIVISIONS, L2_SUBROLES, L3_SUBROLES, PRIORITIES, TICKET_TYPES } from "@/types";
import { useCurrentUser } from "@/lib/auth";
import { toast } from "sonner";
import { Paperclip } from "lucide-react";

const schema = z.object({
  division: z.string().min(1, "Required"),
  priority: z.string().min(1, "Required"),
  type: z.string().min(1, "Required"),
  portalName: z.string().optional(),
  portalUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  reportName: z.string().optional(),
  summary: z.string().min(4, "Required"),
  description: z.string().min(10, "Min 10 characters"),
  level: z.enum(["L2", "L3"]),
  subRole: z.string().min(1, "Required"),
  assignee: z.string().min(1, "Required"),
});
type FormVals = z.infer<typeof schema>;

export const Route = createFileRoute("/_app/user/tickets/new")({ component: NewTicket });

function NewTicket() {
  const user = useCurrentUser();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [level, setLevel] = useState<"L2" | "L3">("L2");
  const [subRole, setSubRole] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<FormVals>({ resolver: zodResolver(schema), defaultValues: { level: "L2" } });

  const type = watch("type");
  const { data: members = [] } = useQuery({
    queryKey: ["members", level, subRole], enabled: !!subRole,
    queryFn: () => listMembers(level, subRole),
  });

  const onSubmit = async (v: FormVals) => {
    const t = await createTicket({
      division: v.division as never, priority: v.priority as never, type: v.type as never,
      portalName: v.portalName, portalUrl: v.portalUrl || undefined, reportName: v.reportName,
      summary: v.summary, description: v.description,
      assigneeEmpId: v.assignee,
    }, selectedFiles);
    toast.success(`Ticket ${t.ticketId} created`);
    qc.invalidateQueries({ queryKey: ["tickets"] });
    navigate({ to: "/tickets/$ticketId", params: { ticketId: t.ticketId } });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Raise a Ticket" subtitle="Submit a new development, modification, or report request." />
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
            <Field label="Division" error={errors.division?.message}>
              <Select onValueChange={(v) => setValue("division", v)}>
                <SelectTrigger><SelectValue placeholder="Select division" /></SelectTrigger>
                <SelectContent>{DIVISIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Priority" error={errors.priority?.message}>
              <Select onValueChange={(v) => setValue("priority", v)}>
                <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Type" error={errors.type?.message}>
              <Select onValueChange={(v) => setValue("type", v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{TICKET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <div />

            {(type === "Modification" || type === "Reports") && (
              <>
                <Field label="Portal Name"><Input {...register("portalName")} /></Field>
                <Field label="Portal URL" error={errors.portalUrl?.message}><Input placeholder="https://" {...register("portalUrl")} /></Field>
                <Field label="Report Name"><Input {...register("reportName")} /></Field>
                <div />
              </>
            )}

            <Field label="Summary" error={errors.summary?.message}><Input {...register("summary")} /></Field>
            <div />
            <div className="md:col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={5} {...register("description")} />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Attachments</Label>
              <div className="flex items-center gap-2 rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
                <Paperclip className="h-4 w-4" />
                <input 
                  type="file" 
                  multiple 
                  className="text-xs" 
                  onChange={(e) => setSelectedFiles(e.target.files)} 
                />
                {selectedFiles && selectedFiles.length > 0 ? (
                  <span className="text-xs text-foreground font-medium">({selectedFiles.length} file(s) selected)</span>
                ) : (
                  <span>(Files will be uploaded to backend storage.)</span>
                )}
              </div>
            </div>

            <div className="md:col-span-2 border-t border-border pt-4">
              <div className="text-sm font-medium mb-3">Assignment</div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Level">
                  <Select value={level} onValueChange={(v) => { setLevel(v as "L2" | "L3"); setValue("level", v as "L2" | "L3"); setSubRole(""); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="L2">L2</SelectItem><SelectItem value="L3">L3</SelectItem></SelectContent>
                  </Select>
                </Field>
                <Field label="Category" error={errors.subRole?.message}>
                  <Select value={subRole} onValueChange={(v) => { setSubRole(v); setValue("subRole", v); }}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {(level === "L2" ? L2_SUBROLES : L3_SUBROLES).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Member" error={errors.assignee?.message}>
                  <Select onValueChange={(v) => setValue("assignee", v)}>
                    <SelectTrigger><SelectValue placeholder={subRole ? "Select member" : "Pick category first"} /></SelectTrigger>
                    <SelectContent>{members.map(m => <SelectItem key={m.empId} value={m.empId}>{m.name}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/user/tickets" })}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Create ticket</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTicket, listMembers } from "@/services/mock";
import { DIVISIONS, L2_SUBROLES, L3_SUBROLES, PRIORITIES, TICKET_TYPES } from "@/types";
import { useCurrentUser } from "@/lib/auth";
import { toast } from "sonner";
import { Paperclip, FileText } from "lucide-react";

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
  comment: z.string().optional(),
});
type FormVals = z.infer<typeof schema>;

export const Route = createFileRoute("/_app/l2/tickets/new")({ component: L2NewTicket });

function L2NewTicket() {
  const user = useCurrentUser();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [level, setLevel] = useState<"L2" | "L3">("L2");
  const [subRole, setSubRole] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (idx: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  };

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
      comment: v.comment || undefined,
    }, selectedFiles);
    toast.success(`Ticket ${t.ticketId} created`);
    qc.invalidateQueries({ queryKey: ["tickets"] });
    navigate({ to: "/tickets/$ticketId", params: { ticketId: t.ticketId } });
  };

  const filesArray = selectedFiles;

  return (
    <div className="space-y-6">
      <PageHeader title="Raise Ticket" subtitle="Submit a new development, modification, or report request." />
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Card 1: Ticket Classification */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ticket Details</CardTitle>
            <CardDescription>Specify the division, priority, and ticket type category.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
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
          </CardContent>
        </Card>

        {/* Card 2: Conditional Portal / Report Fields */}
        {type && type !== "New Development" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Classification Details</CardTitle>
              <CardDescription>Specify details about the portal or report to be modified.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {type === "Modification" && (
                <>
                  <Field label="Portal Name" error={errors.portalName?.message}>
                    <Input placeholder="e.g. TRAI CMS" {...register("portalName")} />
                  </Field>
                  <Field label="Portal URL (Optional)" error={errors.portalUrl?.message}>
                    <Input placeholder="e.g. https://cms.trai.gov.in" {...register("portalUrl")} />
                  </Field>
                </>
              )}
              {type === "Reports" && (
                <Field label="Report Name" error={errors.reportName?.message}>
                  <Input placeholder="e.g. Monthly Broadband Report" {...register("reportName")} />
                </Field>
              )}
            </CardContent>
          </Card>
        )}

        {/* Card 3: Summary and Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
            <CardDescription>Provide a concise summary and detailed explanation of the request.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Title / Subject" error={errors.summary?.message}>
              <Input placeholder="Brief title of the issue or feature request" {...register("summary")} />
            </Field>
            <Field label="Description" error={errors.description?.message}>
              <Textarea 
                placeholder="Describe your request in detail. Provide specs, step-by-step logs, or reproduction steps..." 
                rows={5}
                {...register("description")} 
              />
            </Field>
          </CardContent>
        </Card>

        {/* Card 4: Attachments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attachments</CardTitle>
            <CardDescription>Upload any supporting documents, logs, or screenshots.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 bg-slate-50/50 dark:bg-slate-950/20">
              <Paperclip className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Drag &amp; drop files here, or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">Supports Doc, PDF, Excel, ZIP, images up to 10MB</p>
              <Button 
                type="button" 
                variant="secondary" 
                size="sm" 
                className="mt-4"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                Choose files
              </Button>
              <input 
                id="file-upload"
                type="file" 
                multiple 
                className="hidden" 
                onChange={handleFileChange} 
                onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
              />
            </div>
            
            {filesArray.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Selected Files</Label>
                <div className="flex flex-wrap gap-2">
                  {filesArray.map((file, i) => (
                    <div 
                      key={i} 
                      className="inline-flex items-center gap-2 rounded-lg bg-primary/5 dark:bg-white/5 border border-primary/20 dark:border-white/10 px-3 py-1.5 text-xs text-foreground font-semibold"
                    >
                      <FileText className="h-4 w-4 text-primary dark:text-blue-400" />
                      <span>{file.name}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">({Math.round(file.size / 1024)} KB)</span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-muted-foreground hover:text-slate-900 dark:hover:text-white font-bold ml-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 5: Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Target Assignment</CardTitle>
            <CardDescription>Route this ticket to the appropriate support level and member.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <div className="space-y-1.5">
              <Label htmlFor="assignment-comment">Assignment Comment</Label>
              <Textarea
                id="assignment-comment"
                placeholder="Add a comment to display in the Complete Trail logs..."
                rows={3}
                {...register("comment")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Controls */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/l2/assignments" })}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Create ticket"}
          </Button>
        </div>

      </form>
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

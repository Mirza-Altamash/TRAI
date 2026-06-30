import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createEmployee } from "@/services/mock";
import { DIVISIONS, L2_SUBROLES, L3_SUBROLES } from "@/types";
import { toast } from "sonner";

const schema = z.object({
  empId: z.string().min(3, "Required"),
  name: z.string().min(2, "Required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Min 8 chars"),
  role: z.enum(["USER", "L2", "L3", "ADMIN"]),
  subRole: z.string().optional(),
  division: z.string().min(1, "Required"),
  designation: z.string().min(1, "Required"),
  floor: z.string().min(1, "Required"),
  isActive: z.boolean(),
}).refine(d => d.role === "USER" || d.role === "ADMIN" || !!d.subRole, { path: ["subRole"], message: "Required for L2/L3" });

type FormVals = z.infer<typeof schema>;

export const Route = createFileRoute("/_app/admin/employees/create")({ component: CreateEmployee });

function CreateEmployee() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<FormVals>({ resolver: zodResolver(schema), defaultValues: { isActive: true, role: "USER" } });
  const role = watch("role");

  const onSubmit = async (v: FormVals) => {
    await createEmployee({
      empId: v.empId, name: v.name, email: v.email, role: v.role,
      subRole: (v.role === "USER" || v.role === "ADMIN" ? null : (v.subRole as never)) ?? null,
      division: v.division as never, designation: v.designation, floor: v.floor, isActive: v.isActive,
      password: v.password
    });
    toast.success("Employee created");
    qc.invalidateQueries({ queryKey: ["employees"] });
    navigate({ to: "/admin/employees" });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Create Employee" subtitle="Add a new user, L2, or L3 member." />
      <Card>
        <CardContent className="p-6">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
            <Field label="Role" error={errors.role?.message}>
              <Select value={role} onValueChange={(v) => { setValue("role", v as never); setValue("subRole", undefined); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="L2">L2</SelectItem>
                  <SelectItem value="L3">L3</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {role !== "USER" && (
              <Field label="Sub Role" error={errors.subRole?.message}>
                <Select onValueChange={(v) => setValue("subRole", v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {(role === "L2" ? L2_SUBROLES : L3_SUBROLES).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            )}
            <Field label="Employee ID" error={errors.empId?.message}><Input placeholder="TRAI-USR-200" {...register("empId")} /></Field>
            <Field label="Name" error={errors.name?.message}><Input {...register("name")} /></Field>
            <Field label="Email" error={errors.email?.message}><Input type="email" {...register("email")} /></Field>
            <Field label="Password" error={errors.password?.message}><Input type="password" {...register("password")} /></Field>
            <Field label="Division" error={errors.division?.message}>
              <Select onValueChange={(v) => setValue("division", v)}>
                <SelectTrigger><SelectValue placeholder="Select division" /></SelectTrigger>
                <SelectContent>{DIVISIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Designation" error={errors.designation?.message}><Input {...register("designation")} /></Field>
            <Field label="Floor" error={errors.floor?.message}><Input placeholder="e.g. 5F" {...register("floor")} /></Field>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <div className="text-sm font-medium">Active</div>
                <div className="text-xs text-muted-foreground">Inactive users cannot sign in.</div>
              </div>
              <Switch defaultChecked onCheckedChange={(c) => setValue("isActive", c)} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/employees" })}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Create employee</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
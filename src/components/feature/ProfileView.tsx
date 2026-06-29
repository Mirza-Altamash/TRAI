import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/auth";
import { ChangePasswordDialog } from "@/components/common/ChangePasswordDialog";
import { KeyRound } from "lucide-react";

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border py-3 last:border-0 md:flex-row md:items-center md:justify-between">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{k}</div>
      <div className="text-sm text-foreground">{v}</div>
    </div>
  );
}

export function ProfileView() {
  const u = useCurrentUser();
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" subtitle="Your TRAI account details." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Account Information</CardTitle></CardHeader>
          <CardContent>
            <Item k="Employee ID" v={u.empId} />
            <Item k="Name" v={u.name} />
            <Item k="Email" v={u.email} />
            <Item k="Role" v={`${u.role}${u.subRole ? ` · ${u.subRole}` : ""}`} />
            <Item k="Division" v={String(u.division)} />
            <Item k="Designation" v={u.designation} />
            <Item k="Floor" v={u.floor} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Security</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Keep your account secure by rotating your password regularly.</p>
            <Button onClick={() => setOpen(true)}><KeyRound className="mr-1.5 h-4 w-4" /> Change Password</Button>
          </CardContent>
        </Card>
      </div>
      <ChangePasswordDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
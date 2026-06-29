import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { loginMock } from "@/services/mock";
import { dashboardPathFor, getCurrentSession, useAuth } from "@/lib/auth";

const schema = z.object({
  identifier: z.string().min(2, "Required"),
  password: z.string().min(1, "Required"),
});
type FormVals = z.infer<typeof schema>;

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    const s = getCurrentSession();
    if (s) throw redirect({ to: dashboardPathFor(s.user.role) });
  },
  component: LoginPage,
});

function LoginPage() {
  const [mode, setMode] = useState<"empId" | "email">("empId");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<FormVals>({ resolver: zodResolver(schema) });

  const onSubmit = async (vals: FormVals) => {
    setLoading(true); setError(null);
    try {
      const session = await loginMock(vals.identifier, vals.password, mode);
      setSession(session);
      navigate({ to: dashboardPathFor(session.user.role) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-primary-soft via-background to-background">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        <div className="hidden lg:flex flex-col justify-between bg-primary p-12 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-primary-foreground/10">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">Telecom Regulatory Authority of India</div>
              <div className="text-xs text-primary-foreground/70">भारतीय दूरसंचार विनियामक प्राधिकरण</div>
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold leading-tight">Complaint & Workflow Management Portal</h1>
            <p className="text-sm text-primary-foreground/80 max-w-md">
              Internal system for ticketing, assignments, escalations and reporting across IT, NSL, QoS, B&CS and F&EA divisions.
            </p>
          </div>
          <div className="text-xs text-primary-foreground/60">
            Authorised access only · All activity is logged for audit purposes.
          </div>
        </div>

        <div className="flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-8 shadow-sm">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 lg:hidden">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <div className="text-sm font-semibold text-foreground">TRAI Portal</div>
              </div>
              <h2 className="text-xl font-semibold text-foreground">Sign in</h2>
              <p className="text-sm text-muted-foreground">Use your TRAI credentials to continue.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as "empId" | "email")} className="grid grid-cols-2 gap-2">
                <Label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background p-2 text-sm">
                  <RadioGroupItem value="empId" /> Employee ID
                </Label>
                <Label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background p-2 text-sm">
                  <RadioGroupItem value="email" /> Email
                </Label>
              </RadioGroup>

              <div className="space-y-1.5">
                <Label>{mode === "empId" ? "Employee ID" : "Email"}</Label>
                <Input
                  placeholder={mode === "empId" ? "TRAI-USR-001" : "name@trai.gov.in"}
                  autoComplete="username"
                  {...register("identifier")}
                />
                {errors.identifier && <p className="text-xs text-destructive">{errors.identifier.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="pr-10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign in
              </Button>

              <div className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-[11px] text-muted-foreground">
                <div className="font-medium text-foreground mb-1">Demo accounts (any password)</div>
                <ul className="space-y-0.5">
                  <li>Admin: <code>TRAI-ADM-001</code></li>
                  <li>User: <code>TRAI-USR-001</code></li>
                  <li>L2: <code>TRAI-L2-001</code></li>
                  <li>L3: <code>TRAI-L3-001</code></li>
                </ul>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
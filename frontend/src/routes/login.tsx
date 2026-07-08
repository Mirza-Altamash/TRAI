import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck, AlertCircle, Loader2, Eye, EyeOff, FileCheck, Landmark, HelpCircle } from "lucide-react";
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
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: "", password: "" }
  });
  const identifierVal = watch("identifier") || "";

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
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Dynamic Keyframes for 3D Floating Effect */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slowFloat {
          0%, 100% { transform: translateY(0) rotateY(-10deg) rotateX(5deg); }
          50% { transform: translateY(-12px) rotateY(-10deg) rotateX(5deg); }
        }
        .animate-slow-float {
          animation: slowFloat 7s ease-in-out infinite;
        }
      `}} />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        {/* Left Side: Branded Hero Panel (lg:col-span-7) */}
        <div className="relative hidden lg:flex lg:col-span-7 flex-col justify-between bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900 via-[#00448B] to-slate-950 p-16 text-white overflow-hidden border-r border-blue-800/20">
          
          {/* Subtle Ambient Orbs */}
          <div className="absolute rounded-full bg-blue-500/20 blur-3xl w-96 h-96 -top-12 -left-12 pointer-events-none" />
          <div className="absolute rounded-full bg-amber-500/5 blur-3xl w-80 h-80 bottom-12 right-12 pointer-events-none" />
          
          {/* Header Area */}
          <div className="relative flex items-center gap-4 z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm">
              <Landmark className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-wider uppercase text-white">Telecom Regulatory Authority of India</div>
              <div className="text-xs text-blue-200/70 font-semibold tracking-wide">भारतीय दूरसंचार विनियामक प्राधिकरण</div>
            </div>
          </div>

          {/* Interactive 3D Mockup Container */}
          <div className="relative flex items-center justify-center my-12 z-10" style={{ perspective: '1200px' }}>
            {/* Background Layer Card */}
            <div 
              className="absolute top-12 left-12 w-full max-w-sm h-64 rounded-2xl border border-white/10 bg-white/5 opacity-30 shadow-2xl pointer-events-none"
              style={{
                transform: 'perspective(1200px) rotateY(-10deg) rotateX(5deg) translateZ(-60px)',
              }}
            />

            {/* Front Floating Dashboard Card */}
            <div 
              className="animate-slow-float relative w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md text-white"
              style={{
                transformStyle: 'preserve-3d',
                transform: 'perspective(1200px) rotateY(-10deg) rotateX(5deg)',
              }}
            >
              {/* Mock Ticket List Header */}
              <div className="flex items-center justify-between border-b border-white/15 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <FileCheck className="h-5 w-5 text-amber-400" />
                  <span className="font-bold text-xs tracking-wider uppercase text-white/90">TRAI Ticketing Core</span>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] text-emerald-400 font-bold tracking-wider uppercase">System Live</span>
              </div>
              
              {/* Mock Queue Stats */}
              <div className="grid grid-cols-3 gap-3 mb-5 text-center">
                <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                  <div className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Tickets</div>
                  <div className="text-xl font-extrabold text-white mt-0.5">1,482</div>
                </div>
                <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                  <div className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Pending L2</div>
                  <div className="text-xl font-extrabold text-amber-400 mt-0.5">12</div>
                </div>
                <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                  <div className="text-[9px] font-bold text-white/50 uppercase tracking-wider">SLA Met</div>
                  <div className="text-xl font-extrabold text-emerald-400 mt-0.5">98.4%</div>
                </div>
              </div>

              {/* Mock Ticket Rows */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 text-xs border border-white/5">
                  <div className="font-mono text-white/80">TRAI-2026-0412</div>
                  <div className="rounded bg-rose-500/20 px-2 py-0.5 text-[9px] font-semibold text-rose-400 uppercase tracking-wider">High Priority</div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 text-xs border border-white/5">
                  <div className="font-mono text-white/80">TRAI-2026-0413</div>
                  <div className="rounded bg-amber-500/20 px-2 py-0.5 text-[9px] font-semibold text-amber-400 uppercase tracking-wider">In Progress</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Text */}
          <div className="relative space-y-4 z-10">
            <h2 className="text-2xl font-bold leading-tight tracking-wide text-white">Complaint & Workflow Portal</h2>
            <p className="text-sm text-blue-200/80 max-w-md leading-relaxed">
              Internal system for issue resolutions, resource assignments, divisional escalations, and automated SLA tracking.
            </p>
            <div className="text-[10px] text-blue-300/50 uppercase tracking-wider">
              Secure administrative terminal · All requests logged & audited
            </div>
          </div>
        </div>

        {/* Right Side: Login Card (lg:col-span-5) */}
        <div className="flex items-center justify-center p-6 md:p-16 lg:col-span-5 bg-slate-50">
          <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-200 bg-white p-8 md:p-10 shadow-xl border-t-4 border-t-[#00448B] relative z-10">
            
            {/* Small Brand Indicator for Mobile View */}
            <div className="flex items-center gap-2.5 lg:hidden pb-2 border-b border-slate-100">
              <Landmark className="h-5 w-5 text-[#00448B]" />
              <div>
                <div className="text-xs font-bold text-slate-800 tracking-wide">TRAI CITIZEN HUB</div>
                <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Telecom Regulator of India</div>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Portal Authentication</h2>
              <p className="text-sm text-slate-500">Please enter your authorized TRAI credentials to sign in.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              
              {/* Segmented Auth Mode Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Identity Mode</Label>
                <RadioGroup value={mode} onValueChange={(v) => setMode(v as "empId" | "email")} className="grid grid-cols-2 gap-2">
                  <div className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-semibold tracking-wide transition-all ${mode === "empId" ? "border-[#00448B] bg-blue-50/50 text-[#00448B]" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"}`}>
                    <RadioGroupItem id="mode-empId" value="empId" className="sr-only" />
                    <span className={`h-2 w-2 rounded-full ${mode === "empId" ? "bg-[#00448B]" : "bg-slate-300"}`} />
                    <Label htmlFor="mode-empId" className="cursor-pointer">User ID</Label>
                  </div>
                  <div className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-semibold tracking-wide transition-all ${mode === "email" ? "border-[#00448B] bg-blue-50/50 text-[#00448B]" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"}`}>
                    <RadioGroupItem id="mode-email" value="email" className="sr-only" />
                    <span className={`h-2 w-2 rounded-full ${mode === "email" ? "bg-[#00448B]" : "bg-slate-300"}`} />
                    <Label htmlFor="mode-email" className="cursor-pointer">Email Address</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Identifier Input */}
              <div className="space-y-1.5">
                <Label htmlFor="identifier" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {mode === "empId" ? "User ID" : "Official Email"}
                </Label>
                <Input
                  id="identifier"
                  placeholder={mode === "empId" ? "e.g., TRAI-USR-001" : "e.g., name@trai.gov.in"}
                  autoComplete="username"
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-colors h-10 text-sm"
                  {...register("identifier")}
                  value={identifierVal}
                  onChange={(e) => setValue("identifier", e.target.value, { shouldValidate: true })}
                />
                {errors.identifier && <p className="text-xs text-rose-500 font-semibold">{errors.identifier.message}</p>}
              </div>

              {/* Password Input with Toggle */}
              <div className="space-y-1.5">
                <Label htmlFor="password-field" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</Label>
                <div className="relative">
                  <Input
                    id="password-field"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="bg-slate-50 border-slate-200 focus:bg-white transition-colors h-10 pr-10 text-sm"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4.5 w-4.5" />
                    ) : (
                      <Eye className="h-4.5 w-4.5" />
                    )}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-rose-500 font-semibold">{errors.password.message}</p>}
              </div>

              {error && (
                <Alert variant="destructive" className="bg-rose-50 border-rose-100 text-rose-800">
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Authentication */}
              <Button type="submit" className="w-full h-10 bg-[#00448B] hover:bg-[#003366] text-white font-semibold transition-all shadow-md active:scale-[0.98]" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Authenticate Session"
                )}
              </Button>

              {/* Helper Links */}
              <div className="flex items-center justify-between text-xs pt-1">
                <a href="mailto:support@trai.gov.in" className="text-[#00448B] hover:underline font-semibold flex items-center gap-1">
                  <HelpCircle className="h-3.5 w-3.5" /> Contact IT Support
                </a>
                <span className="text-slate-400 font-medium">v1.2.0</span>
              </div>

              {/* Audit Warning */}
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-[10px] text-slate-400 font-medium leading-normal text-center">
                🛡️ Authorized Personnel Only. Under the Indian IT Act, all access, logins, and attempts are monitored and recorded.
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
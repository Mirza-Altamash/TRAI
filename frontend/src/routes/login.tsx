import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ShieldCheck,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  FileCheck,
  Landmark,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { dashboardPathFor, getCurrentSession, useAuth } from "@/lib/auth";
import { apiClient } from "@/lib/apiClient";

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
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: "", password: "" },
  });
  const identifierVal = watch("identifier") || "";

  const onSubmit = async (vals: FormVals) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post("/auth/login", {
        identifier: vals.identifier,
        password: vals.password,
        mode,
      });
      const session = {
        user: res.data.user,
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken || "",
        mustChangePassword: res.data.mustChangePassword,
      };
      setSession(session);
      navigate({ to: dashboardPathFor(session.user.role) });
    } catch (e: any) {
      const msg = e.response?.data?.message || "Invalid credentials. Please ensure your User ID and password are correct.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Dynamic Keyframes for 3D Floating Effect */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes slowFloat {
          0%, 100% { transform: translateY(0) rotateY(-10deg) rotateX(5deg); }
          50% { transform: translateY(-12px) rotateY(-10deg) rotateX(5deg); }
        }
        .animate-slow-float {
          animation: slowFloat 7s ease-in-out infinite;
        }
      `,
        }}
      />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        {/* Left Side: Branded Hero Panel (lg:col-span-7) */}
        <div className="relative hidden lg:flex lg:col-span-7 flex-col justify-between bg-[#00275C] p-16 text-white overflow-hidden border-r-4 border-[#FFB800]">
          {/* Strong geometric accent shapes */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#003a8c] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#001f47] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          {/* Gold accent stripe at top */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FFB800] via-[#FFC933] to-[#FFB800]" />

          {/* Header Area */}
          <div className="relative flex items-center gap-4 z-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#FFB800] shadow-lg">
              <Landmark className="h-7 w-7 text-[#00275C]" />
            </div>
            <div>
              <div className="text-base font-extrabold tracking-wider uppercase text-white">
                Telecom Regulatory Authority of India
              </div>
              <div className="text-sm text-[#93C5FD] font-semibold tracking-wide mt-0.5">
                भारतीय दूरसंचार विनियामक प्राधिकरण
              </div>
            </div>
          </div>

          {/* Interactive 3D Mockup Container */}
          <div
            className="relative flex items-center justify-center my-12 z-10"
            style={{ perspective: "1200px" }}
          >
            {/* Shadow depth layer */}
            <div
              className="absolute top-8 left-8 w-full max-w-sm h-72 rounded-2xl bg-[#001f47] shadow-2xl pointer-events-none"
              style={{ transform: "perspective(1200px) rotateY(-10deg) rotateX(5deg) translateZ(-40px)" }}
            />

            {/* Front Floating Dashboard Card — bold & solid */}
            <div
              className="animate-slow-float relative w-full max-w-md rounded-2xl border-2 border-[#1a5faa] bg-[#00347A] p-6 shadow-2xl text-white"
              style={{ transformStyle: "preserve-3d", transform: "perspective(1200px) rotateY(-10deg) rotateX(5deg)" }}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b-2 border-[#1a5faa] pb-4 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFB800]">
                    <FileCheck className="h-4 w-4 text-[#00275C]" />
                  </div>
                  <span className="font-extrabold text-sm tracking-wider uppercase text-white">
                    TRAI Ticketing Core
                  </span>
                </div>
                <span className="rounded-full bg-emerald-500 px-3 py-1 text-[11px] text-white font-bold tracking-wider uppercase shadow">
                  ● System Live
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-5 text-center">
                <div className="rounded-xl bg-[#001f47] p-3 border border-[#1a5faa]">
                  <div className="text-[10px] font-bold text-[#93C5FD] uppercase tracking-wider mb-1">Tickets</div>
                  <div className="text-2xl font-black text-white">1,482</div>
                </div>
                <div className="rounded-xl bg-[#001f47] p-3 border border-[#1a5faa]">
                  <div className="text-[10px] font-bold text-[#93C5FD] uppercase tracking-wider mb-1">Pending L2</div>
                  <div className="text-2xl font-black text-[#FFB800]">12</div>
                </div>
                <div className="rounded-xl bg-[#001f47] p-3 border border-[#1a5faa]">
                  <div className="text-[10px] font-bold text-[#93C5FD] uppercase tracking-wider mb-1">SLA Met</div>
                  <div className="text-2xl font-black text-emerald-400">98.4%</div>
                </div>
              </div>

              {/* Ticket Rows */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between rounded-lg bg-[#001f47] px-4 py-3 border border-[#1a5faa]">
                  <div className="font-mono font-bold text-sm text-white">TRAI-2026-0412</div>
                  <div className="rounded-md bg-rose-600 px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider">High Priority</div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[#001f47] px-4 py-3 border border-[#1a5faa]">
                  <div className="font-mono font-bold text-sm text-white">TRAI-2026-0413</div>
                  <div className="rounded-md bg-[#c98a2e] px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider">In Progress</div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[#001f47] px-4 py-3 border border-[#1a5faa]">
                  <div className="font-mono font-bold text-sm text-white">TRAI-2026-0411</div>
                  <div className="rounded-md bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider">Resolved</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Text */}
          <div className="relative space-y-3 z-10">
            <div className="inline-block rounded-md bg-[#FFB800] px-3 py-1 text-[11px] font-black text-[#00275C] uppercase tracking-widest">
              Internal Portal
            </div>
            <h2 className="text-3xl font-black leading-tight tracking-wide text-white">
              Complaint &amp; Workflow Portal
            </h2>
            <p className="text-sm text-[#93C5FD] font-medium max-w-md leading-relaxed">
              Internal system for issue resolutions, resource assignments, divisional escalations,
              and automated SLA tracking.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-[#93C5FD] font-bold uppercase tracking-wider pt-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#FFB800]" />
              Secure administrative terminal · All requests logged &amp; audited
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
                <div className="text-xs font-bold text-slate-800 tracking-wide">
                  TRAI CITIZEN HUB
                </div>
                <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
                  Telecom Regulator of India
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Portal Authentication
              </h2>
              <p className="text-sm text-slate-500">
                Please enter your authorized TRAI credentials to sign in.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Segmented Auth Mode Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Identity Mode
                </Label>
                <RadioGroup
                  value={mode}
                  onValueChange={(v) => setMode(v as "empId" | "email")}
                  className="grid grid-cols-2 gap-2"
                >
                  <div
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-semibold tracking-wide transition-all ${mode === "empId" ? "border-[#00448B] bg-blue-50/50 text-[#00448B]" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"}`}
                  >
                    <RadioGroupItem id="mode-empId" value="empId" className="sr-only" />
                    <span
                      className={`h-2 w-2 rounded-full ${mode === "empId" ? "bg-[#00448B]" : "bg-slate-300"}`}
                    />
                    <Label htmlFor="mode-empId" className="cursor-pointer">
                      User ID
                    </Label>
                  </div>
                  <div
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-semibold tracking-wide transition-all ${mode === "email" ? "border-[#00448B] bg-blue-50/50 text-[#00448B]" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"}`}
                  >
                    <RadioGroupItem id="mode-email" value="email" className="sr-only" />
                    <span
                      className={`h-2 w-2 rounded-full ${mode === "email" ? "bg-[#00448B]" : "bg-slate-300"}`}
                    />
                    <Label htmlFor="mode-email" className="cursor-pointer">
                      Email Address
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Identifier Input */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="identifier"
                  className="text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
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
                {errors.identifier && (
                  <p className="text-xs text-rose-500 font-semibold">{errors.identifier.message}</p>
                )}
              </div>

              {/* Password Input with Toggle */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="password-field"
                  className="text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  Password
                </Label>
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
                {errors.password && (
                  <p className="text-xs text-rose-500 font-semibold">{errors.password.message}</p>
                )}
              </div>

              {error && (
                <Alert variant="destructive" className="bg-rose-50 border-rose-100 text-rose-800">
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Authentication */}
              <Button
                type="submit"
                className="w-full h-10 bg-[#00448B] hover:bg-[#003366] text-white font-semibold transition-all shadow-md active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Authenticate Session"
                )}
              </Button>

              {/* Helper Links */}
              <div className="flex items-center justify-between text-xs pt-1">
                <a
                  href="mailto:support@trai.gov.in"
                  className="text-[#00448B] hover:underline font-semibold flex items-center gap-1"
                >
                  <HelpCircle className="h-3.5 w-3.5" /> Contact IT Support
                </a>
                <span className="text-slate-400 font-medium">v1.2.0</span>
              </div>

              {/* Audit Warning */}
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-[10px] text-slate-400 font-medium leading-normal text-center">
                🛡️ Authorized Personnel Only. Under the Indian IT Act, all access, logins, and
                attempts are monitored and recorded.
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

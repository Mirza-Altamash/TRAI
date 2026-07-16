import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/apiClient";
import { AlertCircle, Lock } from "lucide-react";

export function ChangePasswordModal() {
  const { session, setSession } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      return setError("New password must be at least 8 characters");
    }
    if (newPassword !== confirmPassword) {
      return setError("New passwords do not match");
    }

    setLoading(true);
    try {
      await apiClient.post("/auth/change-password", {
        current: currentPassword,
        next: newPassword
      });
      
      // Update session to remove the block
      if (session) {
        setSession({ ...session, mustChangePassword: false });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  if (!session?.mustChangePassword) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl overflow-hidden border">
        <div className="bg-primary p-6 text-primary-foreground flex flex-col items-center">
          <div className="bg-primary-foreground/20 p-3 rounded-full mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">Security Notice</h2>
          <p className="text-primary-foreground/80 text-center mt-2 text-sm">
            For security reasons, you are required to change your default password before accessing your account.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center text-sm text-destructive font-medium">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
              placeholder="Enter your current password"
              required
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
              placeholder="Min 8 characters"
              required
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
              placeholder="Re-type new password"
              required
            />
          </div>
          
          <div className="pt-4">
            <Button type="submit" className="w-full h-11 text-base font-semibold rounded-xl" disabled={loading}>
              {loading ? "Updating..." : "Update Password & Continue"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

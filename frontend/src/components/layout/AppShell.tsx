import { Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/lib/auth";
import { ChangePasswordModal } from "../feature/ChangePasswordModal";

export function AppShell() {
  const { session } = useAuth();
  const navigate = useNavigate();
  // Avoid SSR/client hydration mismatch: session is only known on the client
  // (localStorage). Render a stable placeholder on the server + first client
  // paint, then swap to the real shell after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (mounted && !session) {
      navigate({ to: "/login" });
    }
  }, [mounted, session, navigate]);
  if (!mounted || !session) {
    return <div className="min-h-screen bg-background" />;
  }
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopBar />
      <div className="flex flex-1 min-h-0">
        <Sidebar role={session.user.role} />
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
            <Outlet />
          </div>
        </main>
      </div>
      <ChangePasswordModal />
    </div>
  );
}

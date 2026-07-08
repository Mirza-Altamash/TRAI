import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentSession } from "@/lib/auth";

export const Route = createFileRoute("/_app")({
  beforeLoad: ({ location }) => {
    // Skip during SSR — localStorage is unavailable on the server, so we'd
    // always redirect logged-in users to /login on a hard refresh.
    if (typeof window === "undefined") return;
    const s = getCurrentSession();
    if (!s) throw redirect({ to: "/login", search: { redirect: location.href } as never });
  },
  component: AppShell,
});

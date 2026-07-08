import { createFileRoute, redirect } from "@tanstack/react-router";
import { dashboardPathFor, getCurrentSession } from "@/lib/auth";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const s = getCurrentSession();
    if (!s) throw redirect({ to: "/login" });
    throw redirect({ to: dashboardPathFor(s.user.role) });
  },
  component: () => null,
});

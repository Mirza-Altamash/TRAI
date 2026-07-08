import { createFileRoute } from "@tanstack/react-router";
import { AssigneeDashboard } from "@/components/feature/AssigneeDashboard";
export const Route = createFileRoute("/_app/l3/dashboard")({
  component: () => <AssigneeDashboard label="L3" />,
});

import { createFileRoute } from "@tanstack/react-router";
import { AssigneeDashboard } from "@/components/feature/AssigneeDashboard";
export const Route = createFileRoute("/_app/l2/dashboard")({ component: () => <AssigneeDashboard label="L2" /> });
import { createFileRoute } from "@tanstack/react-router";
import { AssigneeTickets } from "@/components/feature/AssigneeTickets";
export const Route = createFileRoute("/_app/l2/tickets/")({
  component: () => <AssigneeTickets label="L2" />,
});

import { login } from "./authApi";
import { listTickets } from "./ticketApi";
import type { Ticket } from "@/types";

// Re-export Auth API with backward compatibility for loginMock
export const loginMock = login;
export * from "./authApi";

// Re-export Employee CRUD API
export * from "./employeeApi";

// Re-export Ticket Workflow API
export * from "./ticketApi";

// Re-export Trail log API
export * from "./trailApi";

// Re-export Notifications API
export * from "./notificationApi";

// Re-export Reports/Analytics API
export * from "./reportApi";

// Convenience helper matching original signature but updated for async database retrieval
export async function allTickets(): Promise<Ticket[]> {
  const res = await listTickets({ pageSize: 10000 });
  return res.rows;
}
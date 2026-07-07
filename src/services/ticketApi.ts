import { apiClient } from "@/lib/apiClient";
import type { Ticket, Paginated, Division, Priority, TicketType, TicketStatus } from "@/types";

export interface TicketQuery {
  search?: string;
  division?: string;
  priority?: string;
  type?: string;
  status?: TicketStatus | "Assigned";
  assignee?: string;
  createdBy?: string;
  createdFrom?: string;
  createdTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
  page?: number;
  pageSize?: number;
}

export async function listTickets(q: TicketQuery = {}): Promise<Paginated<Ticket>> {
  const res = await apiClient.get<Paginated<Ticket>>("/tickets", { params: q });
  return res.data;
}

export async function getTicket(ticketId: string): Promise<Ticket> {
  const res = await apiClient.get<Ticket>(`/tickets/${ticketId}`);
  return res.data;
}

export async function createTicket(
  input: {
    division: Division;
    priority: Priority;
    type: TicketType;
    portalName?: string;
    portalUrl?: string;
    reportName?: string;
    summary: string;
    description: string;
    assigneeEmpId: string;
    comment?: string;
  },
  files?: FileList | File[] | null
): Promise<Ticket> {
  const fd = new FormData();
  fd.append("division", input.division);
  fd.append("priority", input.priority);
  fd.append("type", input.type);
  if (input.portalName) fd.append("portalName", input.portalName);
  if (input.portalUrl) fd.append("portalUrl", input.portalUrl);
  if (input.reportName) fd.append("reportName", input.reportName);
  fd.append("summary", input.summary);
  fd.append("description", input.description);
  fd.append("assigneeEmpId", input.assigneeEmpId);
  if (input.comment) fd.append("comment", input.comment);

  if (files) {
    for (let i = 0; i < files.length; i++) {
      fd.append("attachments", files[i]);
    }
  }

  const res = await apiClient.post<Ticket>("/tickets", fd);
  return res.data;
}

export async function addComment(
  ticketId: string,
  comment: string,
  files?: FileList | File[] | null
): Promise<any> {
  const fd = new FormData();
  fd.append("comment", comment);
  if (files) {
    for (let i = 0; i < files.length; i++) {
      fd.append("attachments", files[i]);
    }
  }
  const res = await apiClient.post(`/tickets/${ticketId}/comments`, fd);
  return res.data;
}

export async function reassignTicket(
  ticketId: string,
  toEmpId: string,
  comment: string,
  files?: FileList | File[] | null
): Promise<Ticket> {
  const fd = new FormData();
  fd.append("toEmpId", toEmpId);
  fd.append("comment", comment);
  if (files) {
    for (let i = 0; i < files.length; i++) {
      fd.append("attachments", files[i]);
    }
  }
  const res = await apiClient.post<Ticket>(`/tickets/${ticketId}/reassign`, fd);
  return res.data;
}

export async function updateStatus(
  ticketId: string,
  status: TicketStatus,
  comment: string,
  files?: FileList | File[] | null
): Promise<Ticket> {
  const fd = new FormData();
  fd.append("status", status);
  fd.append("comment", comment);
  if (files) {
    for (let i = 0; i < files.length; i++) {
      fd.append("attachments", files[i]);
    }
  }
  const res = await apiClient.put<Ticket>(`/tickets/${ticketId}/status`, fd);
  return res.data;
}

export async function listAssigneeTicketsSplit(
  empId: string,
  kind: "new" | "all",
  opts: { page?: number; pageSize?: number } = {}
): Promise<Paginated<Ticket>> {
  const res = await apiClient.get<Paginated<Ticket>>("/tickets/split/assignee", {
    params: { empId, kind, ...opts },
  });
  return res.data;
}

export async function deleteTicket(ticketId: string): Promise<void> {
  await apiClient.delete(`/tickets/${ticketId}`);
}

export async function reopenTicket(
  ticketId: string,
  comment: string,
  files?: FileList | File[] | null
): Promise<Ticket> {
  const fd = new FormData();
  fd.append("comment", comment);
  if (files) {
    for (let i = 0; i < files.length; i++) {
      fd.append("attachments", files[i]);
    }
  }
  const res = await apiClient.post<Ticket>(`/tickets/${ticketId}/reopen`, fd);
  return res.data;
}

export type Role = "ADMIN" | "USER" | "L2" | "L3";
export type L2SubRole = "Developer" | "Infra" | "Network" | "Support";
export type L3SubRole = "SRO" | "J.Adv" | "D.Adv" | "Adv" | "TO" | "SO" | "Assistant";
export type SubRole = L2SubRole | L3SubRole | null;

export type Division = "IT" | "NSL" | "QoS" | "B&CS" | "F&EA";
export type Priority = "Normal" | "Medium" | "High";
export type TicketType = "New Development" | "Modification" | "Reports";
export type TicketStatus = "Open" | "Resolved" | "Closed";

export interface Employee {
  empId: string;
  name: string;
  email: string;
  role: Role;
  subRole: SubRole;
  division: Division | "ALL";
  designation: string;
  floor: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  sizeKb: number;
  uploadedAt: string;
}

export interface Ticket {
  ticketId: string;
  division: Division;
  priority: Priority;
  type: TicketType;
  portalName?: string;
  portalUrl?: string;
  reportName?: string;
  summary: string;
  description: string;
  attachments: Attachment[];
  currentAssignee: string; // empId
  currentAssigneeName: string;
  currentAssigneeRole: Role;
  currentStatus: TicketStatus;
  createdBy: string; // empId
  createdByName: string;
  createdAt: string;
  assignedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  autoCloseEligible?: boolean;
}

export type TrailAction = string;

export interface TrailLog {
  id: string;
  ticketId: string;
  action: TrailAction;
  comment?: string;
  performedBy: string;
  performedByName: string;
  performerRole: Role;
  fromAssignee?: string;
  toAssignee?: string;
  previousStatus?: TicketStatus;
  currentStatus?: TicketStatus;
  attachment?: Attachment;
  attachments?: {
    filename: string;
    url: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
    uploadedBy: string;
  }[];
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  ticketId?: string;
  createdAt: string;
  read: boolean;
}

export type AuditAction =
  | "Login"
  | "Logout"
  | "Password Change"
  | "Employee Create"
  | "Employee Update"
  | "Employee Delete"
  | "Ticket Create"
  | "Ticket Delete"
  | "Assignment"
  | "Reassignment"
  | "Comment"
  | "Status Change"
  | "Resolve"
  | "Close"
  | "Export";

export interface AuditLog {
  id: string;
  empId: string;
  empName: string;
  role: Role;
  action: AuditAction;
  context?: string;
  createdAt: string;
}

export interface Paginated<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const DIVISIONS: Division[] = ["IT", "NSL", "QoS", "B&CS", "F&EA"];
export const PRIORITIES: Priority[] = ["Normal", "Medium", "High"];
export const TICKET_TYPES: TicketType[] = ["New Development", "Modification", "Reports"];
export const STATUSES: TicketStatus[] = ["Open", "Resolved", "Closed"];
export const L2_SUBROLES: L2SubRole[] = ["Developer", "Infra", "Network", "Support"];
export const L3_SUBROLES: L3SubRole[] = ["SRO", "J.Adv", "D.Adv", "Adv", "TO", "SO", "Assistant"];

import { apiClient } from "@/lib/apiClient";
import type { AuditLog, Paginated } from "@/types";

export async function getAdminMetrics() {
  const res = await apiClient.get("/analytics/admin");
  return res.data;
}

export async function getUserMetrics(empId: string) {
  const res = await apiClient.get("/analytics/user", { params: { empId } });
  return res.data;
}

export async function getAssigneeMetrics(empId: string) {
  const res = await apiClient.get("/analytics/assignee", { params: { empId } });
  return res.data;
}

export async function getAnalytics() {
  const res = await apiClient.get("/analytics/charts");
  return res.data;
}

export async function getSlaMetrics() {
  const res = await apiClient.get("/sla/metrics");
  return res.data;
}

export async function getMisReport(period: "Monthly" | "Quarterly" | "Yearly") {
  const res = await apiClient.get("/mis/report", { params: { period } });
  return res.data;
}

export async function listAudit(q: any = {}): Promise<Paginated<AuditLog>> {
  const res = await apiClient.get<Paginated<AuditLog>>("/audit", { params: q });
  return res.data;
}

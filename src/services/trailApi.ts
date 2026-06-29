import { apiClient } from "@/lib/apiClient";
import type { TrailLog, Paginated } from "@/types";

export interface TrailQuery {
  search?: string;
  role?: string;
  action?: string;
  page?: number;
  pageSize?: number;
  sortDir?: "asc" | "desc";
}

export async function listTrail(ticketId: string, opts: TrailQuery = {}): Promise<Paginated<TrailLog>> {
  const res = await apiClient.get<Paginated<TrailLog>>(`/trail/${ticketId}`, { params: opts });
  return res.data;
}

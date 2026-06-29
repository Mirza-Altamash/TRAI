import { apiClient } from "@/lib/apiClient";
import type { Employee } from "@/types";

export interface LoginResponse {
  user: Employee;
  accessToken: string;
  refreshToken: string;
}

export async function login(identifier: string, password: string, mode: "empId" | "email"): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>("/auth/login", { identifier, password, mode });
  return res.data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post("/auth/logout", { refreshToken });
}

export async function refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await apiClient.post<{ accessToken: string; refreshToken: string }>("/auth/refresh", { refreshToken });
  return res.data;
}

export async function changePassword(current: string, next: string): Promise<void> {
  await apiClient.post("/auth/change-password", { current, next });
}

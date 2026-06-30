import { apiClient } from "@/lib/apiClient";
import type { Employee, Paginated } from "@/types";

export interface EmployeeQuery {
  search?: string;
  division?: string;
  role?: string;
  subRole?: string;
  page?: number;
  pageSize?: number;
  sortDir?: "asc" | "desc";
}

export async function listEmployees(q: EmployeeQuery = {}): Promise<Paginated<Employee>> {
  const res = await apiClient.get<Paginated<Employee>>("/employees", { params: q });
  return res.data;
}

export async function getEmployee(empId: string): Promise<Employee> {
  const res = await apiClient.get<Employee>(`/employees/${empId}`);
  return res.data;
}

export async function createEmployee(input: Omit<Employee, "createdAt" | "updatedAt"> & { password?: string }): Promise<Employee> {
  const res = await apiClient.post<Employee>("/employees", input);
  return res.data;
}

export async function updateEmployee(empId: string, patch: Partial<Employee>): Promise<Employee> {
  const res = await apiClient.put<Employee>(`/employees/${empId}`, patch);
  return res.data;
}

export async function deleteEmployee(empId: string): Promise<void> {
  await apiClient.delete(`/employees/${empId}`);
}

export async function listMembers(role: "L2" | "L3", subRole: string): Promise<Employee[]> {
  const res = await apiClient.get<Employee[]>("/employees/members", { params: { role, subRole } });
  return res.data;
}

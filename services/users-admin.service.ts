/**
 * Users admin API service (section 21 of api.md)
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { PaginatedData, User, UserRole } from "@/types/domain";

export interface AdminUserListQuery {
  page?: number;
  limit?: number;
  role?: UserRole;
  isBlocked?: boolean;
  search?: string;
}

export interface AdminUserDetail extends User {
  activeSessionCount: number;
  orderCount: number;
  walletBalance: number;
}

export interface UserSession {
  id: string;
  deviceName?: string | null;
  ip?: string | null;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string | null;
}

export const usersAdminService = {
  list: (query?: AdminUserListQuery) =>
    http.get<PaginatedData<User>>(ENDPOINTS.usersAdmin.list, query),

  byId: (id: string) =>
    http.get<AdminUserDetail>(ENDPOINTS.usersAdmin.byId(id)),

  block: (id: string, body: { reason: string }) =>
    http.put<User>(ENDPOINTS.usersAdmin.block(id), body),

  unblock: (id: string) =>
    http.put<User>(ENDPOINTS.usersAdmin.unblock(id)),

  setRole: (id: string, body: { role: UserRole }) =>
    http.put<User>(ENDPOINTS.usersAdmin.role(id), body),

  sessions: (id: string) =>
    http.get<UserSession[]>(ENDPOINTS.usersAdmin.sessions(id)),

  revokeSession: (id: string, sessionId: string) =>
    http.delete<void>(ENDPOINTS.usersAdmin.session(id, sessionId)),

  revokeAllSessions: (id: string) =>
    http.delete<void>(ENDPOINTS.usersAdmin.sessionsAll(id)),
};

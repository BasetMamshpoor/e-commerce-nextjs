/**
 * Tickets API service (section 17 of api.md)
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type {
  PaginatedData,
  Ticket,
  TicketDepartment,
  TicketPriority,
  TicketStatus,
} from "@/types/domain";

export interface CreateTicketBody {
  subject: string;
  departmentId?: string;
  priority?: TicketPriority;
  orderId?: string;
  message: string;
  attachmentMediaIds?: string[];
}

export interface AddTicketMessageBody {
  message: string;
  attachmentMediaIds?: string[];
}

export interface TicketListQuery {
  page?: number;
  limit?: number;
  status?: TicketStatus;
  departmentId?: string;
  priority?: TicketPriority;
  search?: string;
}

export interface UpsertDepartmentBody {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface AdminUpdateTicketBody {
  status?: TicketStatus;
  priority?: TicketPriority;
  departmentId?: string;
}

export const ticketsService = {
  /* Public */
  departments: () => http.get<TicketDepartment[]>(ENDPOINTS.tickets.departments),

  list: (query?: TicketListQuery) =>
    http.get<PaginatedData<Ticket>>(ENDPOINTS.tickets.list, query),

  create: (body: CreateTicketBody) =>
    http.post<Ticket>(ENDPOINTS.tickets.create, body),

  byId: (id: string) => http.get<Ticket>(ENDPOINTS.tickets.byId(id)),

  addMessage: (id: string, body: AddTicketMessageBody) =>
    http.post<Ticket>(ENDPOINTS.tickets.addMessage(id), body),

  /* Admin */
  createDepartment: (body: UpsertDepartmentBody) =>
    http.post<TicketDepartment>(ENDPOINTS.tickets.departments, body),

  updateDepartment: (id: string, body: Partial<UpsertDepartmentBody>) =>
    http.put<TicketDepartment>(ENDPOINTS.tickets.departmentById(id), body),

  deleteDepartment: (id: string) =>
    http.delete<void>(ENDPOINTS.tickets.departmentById(id)),

  adminList: (query?: TicketListQuery) =>
    http.get<PaginatedData<Ticket>>(ENDPOINTS.tickets.adminList, query),

  adminById: (id: string) =>
    http.get<Ticket>(ENDPOINTS.tickets.adminById(id)),

  adminUpdate: (id: string, body: AdminUpdateTicketBody) =>
    http.put<Ticket>(ENDPOINTS.tickets.adminUpdate(id), body),

  adminAddMessage: (id: string, body: AddTicketMessageBody) =>
    http.post<Ticket>(ENDPOINTS.tickets.adminAddMessage(id), body),
};

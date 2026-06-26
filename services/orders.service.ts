/**
 * Orders API service (section 14 of api.md)
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type {
  CreateOrderBody,
  Order,
  OrderReturn,
  OrderStatus,
  PaginatedData,
  PaymentMethod,
} from "@/types/domain";

export interface OrderListQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  search?: string;
}

export interface AdminOrderListQuery extends OrderListQuery {
  userId?: string;
}

export interface AdminReturnsQuery {
  page?: number;
  limit?: number;
  status?: OrderReturn["status"];
}

export interface UpdateOrderStatusBody {
  status: OrderStatus;
  note?: string;
}

export interface ReviewReturnBody {
  status: "RECEIVED" | "REFUNDED" | "REJECTED" | "APPROVED";
  refundAmount?: number;
  adminNote?: string;
}

export interface RequestReturnBody {
  orderItemId?: string;
  reason: string;
  imageMediaIds?: string[];
}

export const ordersService = {
  /* User */
  list: (query?: OrderListQuery) =>
    http.get<PaginatedData<Order>>(ENDPOINTS.orders.list, query),

  create: (body: CreateOrderBody) =>
    http.post<Order>(ENDPOINTS.orders.create, body),

  byId: (id: string) => http.get<Order>(ENDPOINTS.orders.byId(id)),

  cancel: (id: string, body: { reason: string }) =>
    http.post<Order>(ENDPOINTS.orders.cancel(id), body),

  requestReturn: (id: string, body: RequestReturnBody) =>
    http.post<Order>(ENDPOINTS.orders.return(id), body),

  paymentInitiate: (id: string, body: { gatewaySlug: string }) =>
    http.post<{ redirectUrl: string }>(
      ENDPOINTS.orders.paymentInitiate(id),
      body,
    ),

  paymentVerify: (id: string, body: { providerParams: Record<string, string> }) =>
    http.post<Order>(ENDPOINTS.orders.paymentVerify(id), body),

  /* Admin / Support */
  adminList: (query?: AdminOrderListQuery) =>
    http.get<PaginatedData<Order>>(ENDPOINTS.orders.adminList, query),

  adminReturns: (query?: AdminReturnsQuery) =>
    http.get<PaginatedData<OrderReturn>>(ENDPOINTS.orders.adminReturns, query),

  reviewReturn: (returnId: string, body: ReviewReturnBody) =>
    http.put<OrderReturn>(ENDPOINTS.orders.adminReturn(returnId), body),

  adminById: (id: string) =>
    http.get<Order>(ENDPOINTS.orders.adminById(id)),

  adminUpdateStatus: (id: string, body: UpdateOrderStatusBody) =>
    http.put<Order>(ENDPOINTS.orders.adminStatus(id), body),
};

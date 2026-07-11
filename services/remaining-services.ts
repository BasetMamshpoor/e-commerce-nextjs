/**
 * Remaining services — updated for integer IDs and new API structure.
 * Batch file for: discount-codes, addresses, shipping, payments, orders,
 * notifications, tickets, comments, banners, popups, users-admin, security,
 * analytics, users-me, settings.
 */

import { http } from "@/lib/api-client";
import { buildMultipartFormData } from "@/lib/form-data-helper";
import { ENDPOINTS } from "@/api/endpoints";
import type {
  DiscountApplyResult, DiscountCode, PaginatedData,
  Address, ShippingCompany, PaymentGateway,
  Order, OrderListQuery, AdminOrderListQuery, AdminReturnsQuery,
  OrderReturn, ReviewReturnBody, RequestReturnBody, CreateOrderBody,
  AppNotification, NotificationType, NotificationListQuery, BroadcastBody,
  Ticket, TicketListQuery, TicketDepartment, TicketPriority, TicketStatus,
  CreateTicketBody, AddTicketMessageBody, UpsertDepartmentBody, AdminUpdateTicketBody,
  Comment, CommentStatus, ProductCommentsData, CreateCommentBody,
  Banner, BannerPosition, Popup,
  User, UserRole, AdminUserListQuery, AdminUserDetail, UserSession,
  BlockedIp, BlockIpBody,
  AnalyticsOverview, AnalyticsSalesPoint, AnalyticsOrderStatusBreakdown,
  AnalyticsTopProduct, AnalyticsNewUsersPoint, AnalyticsPeriod,
  Setting, SettingsMap,
  DiscountType,
} from "@/types/domain";

/* ───────── Discount Codes ───────── */
export interface CreateDiscountCodeBody {
  code: string; type: DiscountType; value: number;
  maxDiscountAmount?: number | null; minCartAmount?: number | null;
  maxUsage?: number | null; maxUsagePerUser?: number | null;
  startsAt?: string | null; expiresAt?: string | null; isActive?: boolean;
  productIds?: number[]; categoryIds?: number[]; userIds?: number[];
}

export const discountCodesService = {
  apply: (body: { code: string }) => http.post<DiscountApplyResult>(ENDPOINTS.discountCodes.apply, body),
  list: (params?: { page?: number; limit?: number; isActive?: boolean; search?: string }) =>
    http.get<PaginatedData<DiscountCode>>(ENDPOINTS.discountCodes.list, params),
  byId: (id: number) => http.get<DiscountCode>(ENDPOINTS.discountCodes.byId(id)),
  create: (body: CreateDiscountCodeBody) => http.post<DiscountCode>(ENDPOINTS.discountCodes.create, body),
  update: (id: number, body: Partial<CreateDiscountCodeBody>) => http.put<DiscountCode>(ENDPOINTS.discountCodes.update(id), body),
  delete: (id: number) => http.delete<void>(ENDPOINTS.discountCodes.delete(id)),
};

/* ───────── Addresses ───────── */
export interface UpsertAddressBody {
  title: string; receiverName: string; receiverPhone: string;
  province: string; city: string; postalCode: string; fullAddress: string;
  lat: number; lng: number; isDefault?: boolean;
}

export const addressesService = {
  list: () => http.get<Address[]>(ENDPOINTS.addresses.list),
  byId: (id: number) => http.get<Address>(ENDPOINTS.addresses.byId(id)),
  create: (body: UpsertAddressBody) => http.post<Address>(ENDPOINTS.addresses.create, body),
  update: (id: number, body: Partial<UpsertAddressBody>) => http.put<Address>(ENDPOINTS.addresses.update(id), body),
  delete: (id: number) => http.delete<void>(ENDPOINTS.addresses.delete(id)),
};

/* ───────── Shipping Companies ───────── */
export interface UpsertShippingCompanyBody {
  name: string; logoMediaId?: number; description?: string;
  baseCost: number; estimatedDaysMin?: number; estimatedDaysMax?: number; isActive?: boolean;
}

export const shippingCompaniesService = {
  list: (params?: { includeInactive?: boolean }) => http.get<ShippingCompany[]>(ENDPOINTS.shippingCompanies.list, params),
  byId: (id: number) => http.get<ShippingCompany>(ENDPOINTS.shippingCompanies.byId(id)),
  create: (body: UpsertShippingCompanyBody) => http.post<ShippingCompany>(ENDPOINTS.shippingCompanies.create, body),
  update: (id: number, body: Partial<UpsertShippingCompanyBody>) => http.put<ShippingCompany>(ENDPOINTS.shippingCompanies.update(id), body),
  delete: (id: number) => http.delete<void>(ENDPOINTS.shippingCompanies.delete(id)),
};

/* ───────── Payment Gateways ───────── */
export interface UpsertPaymentGatewayBody {
  name: string; slug: string; isActive?: boolean; config?: Record<string, unknown>;
}

export const paymentGatewaysService = {
  list: () => http.get<PaymentGateway[]>(ENDPOINTS.paymentGateways.list),
  create: (body: UpsertPaymentGatewayBody) => http.post<PaymentGateway>(ENDPOINTS.paymentGateways.create, body),
  update: (id: number, body: Partial<UpsertPaymentGatewayBody>) => http.put<PaymentGateway>(ENDPOINTS.paymentGateways.update(id), body),
  delete: (id: number) => http.delete<void>(ENDPOINTS.paymentGateways.delete(id)),
};

/* ───────── Orders ───────── */
export interface UpdateOrderStatusBody {
  status: Order["status"]; note?: string; trackingCode?: string; packageNumber?: string;
}

export const ordersService = {
  list: (query?: OrderListQuery) => http.get<PaginatedData<Order>>(ENDPOINTS.orders.list, query),
  create: (body: CreateOrderBody) => http.post<Order>(ENDPOINTS.orders.create, body),
  byId: (id: number) => http.get<Order>(ENDPOINTS.orders.byId(id)),
  cancel: (id: number, body: { reason: string }) => http.post<Order>(ENDPOINTS.orders.cancel(id), body),
  requestReturn: (id: number, body: RequestReturnBody) => http.post<Order>(ENDPOINTS.orders.return(id), body),
  paymentInitiate: (id: number, body: { gatewaySlug: string }) => http.post<{ redirectUrl: string }>(ENDPOINTS.orders.paymentInitiate(id), body),
  paymentVerify: (id: number, body: { providerParams: Record<string, string> }) => http.post<Order>(ENDPOINTS.orders.paymentVerify(id), body),
  adminList: (query?: AdminOrderListQuery) => http.get<PaginatedData<Order>>(ENDPOINTS.orders.adminList, query),
  adminReturns: (query?: AdminReturnsQuery) => http.get<PaginatedData<OrderReturn>>(ENDPOINTS.orders.adminReturns, query),
  adminReturnDetail: (returnId: number) => http.get<OrderReturn>(ENDPOINTS.orders.adminReturnDetail(returnId)),
  reviewReturn: (returnId: number, body: ReviewReturnBody) => http.put<OrderReturn>(ENDPOINTS.orders.adminReturnDetail(returnId), body),
  adminById: (id: number) => http.get<Order>(ENDPOINTS.orders.adminById(id)),
  adminUpdateStatus: (id: number, body: UpdateOrderStatusBody) => http.put<Order>(ENDPOINTS.orders.adminStatus(id), body),
};

/* ───────── Notifications ───────── */
export const notificationsService = {
  list: (query?: NotificationListQuery) => http.get<PaginatedData<AppNotification>>(ENDPOINTS.notifications.list, query),
  unreadCount: () => http.get<{ count: number }>(ENDPOINTS.notifications.unreadCount),
  readAll: () => http.patch<void>(ENDPOINTS.notifications.readAll),
  read: (id: number) => http.patch<void>(ENDPOINTS.notifications.read(id)),
  delete: (id: number) => http.delete<void>(ENDPOINTS.notifications.delete(id)),
  broadcast: (body: BroadcastBody) => http.post<{ sentCount: number }>(ENDPOINTS.notifications.broadcast, body),
};

/* ───────── Tickets ───────── */
export const ticketsService = {
  departments: () => http.get<TicketDepartment[]>(ENDPOINTS.tickets.departments),
  list: (query?: TicketListQuery) => http.get<PaginatedData<Ticket>>(ENDPOINTS.tickets.list, query),
  create: (body: CreateTicketBody) => http.post<Ticket>(ENDPOINTS.tickets.create, body),
  /** Create ticket with inline file attachments (multipart/form-data).
   * Fields sent flat with bracket notation for arrays + attachments as files.
   */
  createWithAttachments: (body: CreateTicketBody, files: File[]) => {
    const fd = buildMultipartFormData(body as unknown as Record<string, unknown>, { attachments: files });
    return http.upload<Ticket>(ENDPOINTS.tickets.create, fd);
  },
  byId: (id: number) => http.get<Ticket>(ENDPOINTS.tickets.byId(id)),
  addMessage: (id: number, body: AddTicketMessageBody) => http.post<Ticket>(ENDPOINTS.tickets.addMessage(id), body),
  /** Add message with inline file attachments (multipart/form-data). */
  addMessageWithAttachments: (id: number, body: AddTicketMessageBody, files: File[]) => {
    const fd = buildMultipartFormData(body as unknown as Record<string, unknown>, { attachments: files });
    return http.upload<Ticket>(ENDPOINTS.tickets.addMessage(id), fd);
  },
  createDepartment: (body: UpsertDepartmentBody) => http.post<TicketDepartment>(ENDPOINTS.tickets.createDepartment, body),
  updateDepartment: (id: number, body: Partial<UpsertDepartmentBody>) => http.put<TicketDepartment>(ENDPOINTS.tickets.updateDepartment(id), body),
  deleteDepartment: (id: number) => http.delete<void>(ENDPOINTS.tickets.deleteDepartment(id)),
  adminList: (query?: TicketListQuery) => http.get<PaginatedData<Ticket>>(ENDPOINTS.tickets.adminList, query),
  adminById: (id: number) => http.get<Ticket>(ENDPOINTS.tickets.adminById(id)),
  adminUpdate: (id: number, body: AdminUpdateTicketBody) => http.put<Ticket>(ENDPOINTS.tickets.adminUpdate(id), body),
  adminAddMessage: (id: number, body: AddTicketMessageBody) => http.post<Ticket>(ENDPOINTS.tickets.adminAddMessage(id), body),
  /** Admin reply with inline file attachments (multipart/form-data). */
  adminAddMessageWithAttachments: (id: number, body: AddTicketMessageBody, files: File[]) => {
    const fd = buildMultipartFormData(body as unknown as Record<string, unknown>, { attachments: files });
    return http.upload<Ticket>(ENDPOINTS.tickets.adminAddMessage(id), fd);
  },
};

/* ───────── Comments ───────── */
export const commentsService = {
  byProduct: (productId: number, params?: { page?: number; limit?: number }) =>
    http.get<ProductCommentsData>(ENDPOINTS.comments.byProduct(productId), params),
  create: (productId: number, body: CreateCommentBody) =>
    http.post<Comment>(ENDPOINTS.comments.create(productId), body),
  byBlogPost: (postId: number, params?: { page?: number; limit?: number }) =>
    http.get<ProductCommentsData>(ENDPOINTS.comments.byBlogPost(postId), params),
  createBlog: (postId: number, body: CreateCommentBody) =>
    http.post<Comment>(ENDPOINTS.comments.createBlog(postId), body),
  update: (id: number, body: { content: string }) => http.put<Comment>(ENDPOINTS.comments.byId(id), body),
  delete: (id: number) => http.delete<void>(ENDPOINTS.comments.byId(id)),
  like: (id: number) => http.post<{ liked: boolean; likeCount: number }>(ENDPOINTS.comments.like(id)),
  adminList: (params?: { page?: number; limit?: number; status?: CommentStatus; commentableType?: string; isReviewed?: boolean; productSearch?: string; search?: string }) =>
    http.get<PaginatedData<Comment>>(ENDPOINTS.comments.adminList, params),
  adminUpdate: (id: number, body: { status: CommentStatus }) => http.put<Comment>(ENDPOINTS.comments.adminUpdate(id), body),
};

/* ───────── Banners ───────── */
export interface UpsertBannerBody {
  title: string; mediaId: number; link?: string; position: BannerPosition;
  order?: number; isActive?: boolean; startsAt?: string | null; endsAt?: string | null;
}

export const bannersService = {
  list: (params?: { position?: BannerPosition }) => http.get<Banner[]>(ENDPOINTS.banners.list, params),
  adminList: () => http.get<Banner[]>(ENDPOINTS.banners.adminList),
  create: (body: UpsertBannerBody) => http.post<Banner>(ENDPOINTS.banners.create, body),
  update: (id: number, body: Partial<UpsertBannerBody>) => http.put<Banner>(ENDPOINTS.banners.update(id), body),
  delete: (id: number) => http.delete<void>(ENDPOINTS.banners.delete(id)),
};

/* ───────── Popups ───────── */
export interface UpsertPopupBody {
  title: string; content: string; mediaId?: number | null; link?: string;
  isActive?: boolean; startsAt?: string | null; endsAt?: string | null; showOncePerSession?: boolean;
}

export const popupsService = {
  list: () => http.get<Popup[]>(ENDPOINTS.popups.list),
  adminList: () => http.get<Popup[]>(ENDPOINTS.popups.adminList),
  create: (body: UpsertPopupBody) => http.post<Popup>(ENDPOINTS.popups.create, body),
  /** Create popup with image upload (multipart/form-data). */
  createWithImage: (body: Omit<UpsertPopupBody, "mediaId">, image?: File) => {
    const fd = buildMultipartFormData(body as unknown as Record<string, unknown>, image ? { media:image } : undefined);
    return http.upload<Popup>(ENDPOINTS.popups.create, fd);
  },
  update: (id: number, body: Partial<UpsertPopupBody>) => http.put<Popup>(ENDPOINTS.popups.update(id), body),
  /** Update popup with image upload (multipart/form-data). */
  updateWithImage: (id: number, body: Partial<UpsertPopupBody>, image?: File) => {
    const fd = buildMultipartFormData(body as unknown as Record<string, unknown>, image ? { media:image } : undefined);
    return http.uploadPut<Popup>(ENDPOINTS.popups.update(id), fd);
  },
  delete: (id: number) => http.delete<void>(ENDPOINTS.popups.delete(id)),
};

/* ───────── Users Admin ───────── */
export const usersAdminService = {
  list: (query?: AdminUserListQuery) => http.get<PaginatedData<User>>(ENDPOINTS.usersAdmin.list, query),
  byId: (id: number) => http.get<AdminUserDetail>(ENDPOINTS.usersAdmin.byId(id)),
  block: (id: number, body: { reason: string }) => http.put<User>(ENDPOINTS.usersAdmin.block(id), body),
  unblock: (id: number) => http.put<User>(ENDPOINTS.usersAdmin.unblock(id)),
  setRole: (id: number, body: { role: UserRole }) => http.put<User>(ENDPOINTS.usersAdmin.role(id), body),
  walletAdjust: (id: number, body: { amount: number; description?: string }) => http.put<User>(ENDPOINTS.usersAdmin.walletAdjust(id), body),
  sessions: (id: number) => http.get<UserSession[]>(ENDPOINTS.usersAdmin.sessions(id)),
  revokeSession: (id: number, sessionId: number) => http.delete<void>(ENDPOINTS.usersAdmin.session(id, sessionId)),
  revokeAllSessions: (id: number) => http.delete<void>(ENDPOINTS.usersAdmin.sessionsAll(id)),
};

/* ───────── Security ───────── */
export const securityService = {
  listBlockedIps: () => http.get<BlockedIp[]>(ENDPOINTS.security.blockedIps),
  blockIp: (body: BlockIpBody) => http.post<BlockedIp>(ENDPOINTS.security.blockedIps, body),
  unblockIp: (id: number) => http.delete<void>(ENDPOINTS.security.blockedIp(id)),
};

/* ───────── Analytics ───────── */
export interface DateRangeQuery { from?: string; to?: string; period?: AnalyticsPeriod; }

export const analyticsService = {
  overview: () => http.get<AnalyticsOverview>(ENDPOINTS.analytics.overview),
  salesOverTime: (query?: DateRangeQuery) => http.get<AnalyticsSalesPoint[]>(ENDPOINTS.analytics.salesOverTime, query),
  orderStatusBreakdown: () => http.get<AnalyticsOrderStatusBreakdown[]>(ENDPOINTS.analytics.orderStatusBreakdown),
  topProducts: (query?: { limit?: number; from?: string; to?: string }) => http.get<AnalyticsTopProduct[]>(ENDPOINTS.analytics.topProducts, query),
  newUsersOverTime: (query?: DateRangeQuery) => http.get<AnalyticsNewUsersPoint[]>(ENDPOINTS.analytics.newUsersOverTime, query),
};

/* ───────── Users Me ───────── */
export interface UpdateProfileBody { fullName: string; }
export interface ChangePasswordBody { currentPassword: string; newPassword: string; }

export const usersMeService = {
  get: () => http.get<User>(ENDPOINTS.usersMe.get),
  update: (body: UpdateProfileBody) => http.put<User>(ENDPOINTS.usersMe.update, body),
  changePassword: (body: ChangePasswordBody) => http.put<{ message: string }>(ENDPOINTS.usersMe.password, body),
  changeIdentifierRequest: (body: { newIdentifier: string }) =>
    http.post<{ identifier: string; channel: string; expiresAt: string }>(ENDPOINTS.usersMe.changeIdentifierRequest, body),
  changeIdentifierVerify: (body: { newIdentifier: string; code: string }) =>
    http.post<User>(ENDPOINTS.usersMe.changeIdentifierVerify, body),
};

/* ───────── Settings ───────── */
export const settingsService = {
  public: () => http.get<SettingsMap>(ENDPOINTS.settings.public),
  adminList: () => http.get<Setting[]>(ENDPOINTS.settings.admin),
  upsert: (key: string, body: { value: string; type?: Setting["type"] }) => http.put<Setting>(ENDPOINTS.settings.byKey(key), body),
  delete: (key: string) => http.delete<void>(ENDPOINTS.settings.byKey(key)),
};

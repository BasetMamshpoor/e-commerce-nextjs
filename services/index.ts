/**
 * Barrel export for all API services.
 * Import from "@/services" — never call axios directly inside pages.
 */

export { authService } from "./auth.service";
export type {
  RegisterBody,
  VerifyOtpBody,
  LoginBody,
  RefreshBody,
  ResetPasswordBody,
} from "./auth.service";

export { categoriesService } from "./categories.service";
export type { UpsertCategoryBody } from "./categories.service";

export { brandsService } from "./brands.service";
export type { UpsertBrandBody } from "./brands.service";

export { attributesService } from "./attributes.service";
export type {
  CreateAttributeBody,
  AddAttributeValueBody,
} from "./attributes.service";

export { productsService } from "./products.service";
export type {
  CreateProductBody,
  UpdateProductBody,
  UpdateVariantBody,
} from "./products.service";

export { cartService } from "./cart.service";

export { wishlistService } from "./wishlist.service";

export { comparisonService } from "./comparison.service";

export { discountCodesService } from "./discount-codes.service";
export type { CreateDiscountCodeBody } from "./discount-codes.service";

export { addressesService } from "./addresses.service";
export type { UpsertAddressBody } from "./addresses.service";

export { shippingCompaniesService } from "./shipping.service";
export type { UpsertShippingCompanyBody } from "./shipping.service";

export { paymentGatewaysService } from "./payments.service";
export type { UpsertPaymentGatewayBody } from "./payments.service";

export { walletService } from "./wallet.service";

export { ordersService } from "./orders.service";
export type {
  OrderListQuery,
  AdminOrderListQuery,
  AdminReturnsQuery,
  UpdateOrderStatusBody,
  ReviewReturnBody,
  RequestReturnBody,
} from "./orders.service";

export { mediaService } from "./media.service";

export { notificationsService } from "./notifications.service";
export type {
  NotificationListQuery,
  BroadcastBody,
} from "./notifications.service";

export { ticketsService } from "./tickets.service";
export type {
  CreateTicketBody,
  AddTicketMessageBody,
  TicketListQuery,
  UpsertDepartmentBody,
  AdminUpdateTicketBody,
} from "./tickets.service";

export { commentsService } from "./comments.service";
export type { CreateCommentBody } from "./comments.service";

export { bannersService } from "./banners.service";
export type { UpsertBannerBody } from "./banners.service";

export { popupsService } from "./popups.service";
export type { UpsertPopupBody } from "./popups.service";

export { usersAdminService } from "./users-admin.service";
export type {
  AdminUserListQuery,
  AdminUserDetail,
  UserSession,
} from "./users-admin.service";

export { securityService } from "./security.service";
export type { BlockIpBody } from "./security.service";

export { analyticsService } from "./analytics.service";
export type { DateRangeQuery } from "./analytics.service";

export { usersMeService } from "./users-me.service";
export type {
  UpdateProfileBody,
  ChangePasswordBody,
} from "./users-me.service";

export { settingsService } from "./settings.service";

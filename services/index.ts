/**
 * Barrel export for all API services — REWRITTEN for new API.
 * All IDs are now integers.
 */

export { authService } from "./auth.service";
export { categoriesService } from "./categories.service";
export { brandsService } from "./brands.service";
export { attributesService } from "./attributes.service";
export { productsService } from "./products.service";
export { cartService } from "./cart.service";
export { wishlistService } from "./wishlist.service";
export { comparisonService } from "./comparison.service";
export { mediaService } from "./media.service";
export { walletService } from "./wallet.service";

// Batch services
export {
  discountCodesService,
  addressesService,
  shippingCompaniesService,
  paymentGatewaysService,
  ordersService,
  notificationsService,
  ticketsService,
  commentsService,
  bannersService,
  popupsService,
  usersAdminService,
  securityService,
  analyticsService,
  usersMeService,
  settingsService,
} from "./remaining-services";

// NEW services
export {
  storiesService,
  newsletterService,
  searchService,
  landingService,
  adminNotificationsService,
  blogService,
} from "./new-services";

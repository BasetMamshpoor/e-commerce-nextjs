/**
 * Domain entity types — REWRITTEN to match updated API.md (July 2025).
 *
 * KEY CHANGES:
 *   - All IDs are now `number` (integer auto-increment), NOT string (cuid).
 *   - Products use `basePrice` + `priceAdjustment` model (not per-variant price).
 *   - Discount is at product level, not variant level.
 *   - View tracking is automatic (no POST /:id/view).
 *   - GET /by-id/:id added for frontend ID-based routes.
 *   - Image management via PUT /:id (multipart), no separate image endpoints.
 *   - Comparison: only GET /?productIds=1,2,3 — no add/remove/clear.
 *   - Media: inline uploads with entityType, usage tracking, download.
 *   - New: Stories, Newsletter, Search, Landing Page, Admin Notifications, Withdrawals.
 *   - Comments: authorId/authorName, isLiked, commentableType, blog post comments.
 *   - Orders: CUSTOMER-only checkout, trackingCode/packageNumber, detailed returns.
 *   - Attributes: isDisplay field added.
 */

import type { PaginationMeta } from "./api";

// Re-export for convenience
export type { PaginatedData, PaginationMeta } from "./api";

/* ──────────────────────────────────────────────────────────────────────────
   1. Auth
   ────────────────────────────────────────────────────────────────────────── */

export type UserRole = "CUSTOMER" | "EDITOR" | "SUPPORT" | "ADMIN";

export interface User {
  id: number;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  avatarUrl?: string | null;
  emailVerifiedAt?: string | null;
  phoneVerifiedAt?: string | null;
  isBlocked?: boolean;
  blockedReason?: string | null;
  blockedAt?: string | null;
  lastLoginAt?: string | null;
  lastLoginIp?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  sessionId: number;
}

export type OtpChannel = "SMS" | "EMAIL";

export interface OtpRequestResult {
  identifier: string;
  channel: OtpChannel;
  expiresAt: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   2. Media — centralized model
   ────────────────────────────────────────────────────────────────────────── */

export type MediaType = "IMAGE" | "VIDEO" | "DOCUMENT" | "OTHER";

export interface Media {
  id: number;
  fileName: string;
  originalName: string;
  /** Server-side relative path (e.g. "blog/2026/07/file.jpg"). */
  filePath?: string;
  url: string;
  mimeType: string;
  size: number;
  type: MediaType;
  entityType?: string | null;
  uploadedById?: number | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

/** A single usage entry returned by GET /media/:id/usage.
 *  Backend returns plain strings like "Product images (5)" — so we type
 *  the response as an array of strings. */
export type MediaUsageEntry = string;

/** Response shape for GET /media/:id/usage. */
export interface MediaUsageResponse {
  usage: MediaUsageEntry[];
}

/** A date-based folder entry returned by GET /media/folders. */
export interface MediaFolder {
  entityType: string;
  year: string;
  month: string;
  /** Relative path like "blog/2026/07". */
  path: string;
  fileCount: number;
  totalSize: number;
}

/** Query parameters for GET /media (list). */
export interface MediaListQuery {
  page?: number;
  limit?: number;
  type?: MediaType | string;
  entityType?: string;
  search?: string;
  year?: string;
  month?: string;
}

/** Body for PATCH /media/:id. */
export interface UpdateMediaBody {
  originalName?: string;
  entityType?: string;
  metadata?: Record<string, unknown>;
}

/* ──────────────────────────────────────────────────────────────────────────
   2b. Currencies & Exchange Rates (Dynamic Currency-Based Pricing)
   ────────────────────────────────────────────────────────────────────────── */

export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol?: string;
  isActive: boolean;
  /** Most recent exchange rate fetched from the provider. */
  currentRate?: number | null;
  /** When rates were last fetched. */
  lastFetchedAt?: string | null;
  /** Last rate that was applied to products (may differ from currentRate). */
  lastAppliedRate?: number | null;
  /** When the rate was last applied to products. */
  lastAppliedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Public currency (subset shown on storefront). */
export interface PublicCurrency {
  id: number;
  code: string;
  name: string;
  symbol?: string;
  currentRate?: number | null;
}

export interface ExchangeRateHistory {
  id: number;
  currencyId: number;
  rate: number;
  source: "brsapi" | "navasan" | "manual";
  wasApplied: boolean;
  /** Percent change from previous applied rate. */
  changePercent?: number | null;
  /** Timestamp of when the rate was fetched. */
  fetchedAt: string;
}

export interface CreateCurrencyBody {
  code: string;
  name: string;
  symbol?: string;
  isActive?: boolean;
}

export interface UpdateCurrencyBody {
  name?: string;
  symbol?: string;
  isActive?: boolean;
  /** When set, the currency's currentRate + lastAppliedRate are updated and
   *  all products using this currency are immediately recalculated.
   *  (Backend field name is `currentRate` — docs say `manualRate` but the
   *  actual Zod schema + service code uses `currentRate`.) */
  currentRate?: number;
}

/* ──────────────────────────────────────────────────────────────────────────
   3. Categories
   ────────────────────────────────────────────────────────────────────────── */

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  imageMediaId?: number | null;
  imageUrl?: string | null;
  parentId?: number | null;
  order: number;
  isActive: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  children?: Category[];
  createdAt: string;
  updatedAt?: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   4. Brands
   ────────────────────────────────────────────────────────────────────────── */

export interface Brand {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  logoMediaId?: number | null;
  logoUrl?: string | null;
  isActive: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  productCount?: number;
  createdAt: string;
  updatedAt?: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   5. Attributes
   ────────────────────────────────────────────────────────────────────────── */

export type AttributeInputType = "TEXT" | "COLOR" | "SELECT";

/** How an attribute value modifies the product price. */
export type AttributeModifierType =
  | "PERCENTAGE"
  | "FIXED_SOURCE_CURRENCY"
  | "FIXED_IRT";

export interface AttributeValue {
  id: number;
  attributeId: number;
  value: string;
  colorHex?: string | null;
  order: number;
}

export interface Attribute {
  id: number;
  name: string;
  slug: string;
  inputType: AttributeInputType;
  isFilterable: boolean;
  isVariant: boolean;
  isDisplay: boolean;
  values: AttributeValue[];
  createdAt: string;
  updatedAt?: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   6. Products — NEW STRUCTURE (basePrice + priceAdjustment)
   ────────────────────────────────────────────────────────────────────────── */

export type ProductStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type DiscountType = "PERCENT" | "FIXED";

/** How a product's price is determined. */
export type ProductPricingMode = "FIXED_IRT" | "CURRENCY_BASED";

export type ProductSortOption =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "popular"
  | "bestselling"
  | "most_viewed"
  | "most_popular";

export interface ProductImage {
  id: number;
  mediaId: number;
  url?: string;
  alt?: string | null;
  media?: Media;
  order: number;
  isMain: boolean;
}

/** A variant's attribute value with an optional price modifier.
 *  Modifiers are per-product-variant (not per-attribute-value) — the same
 *  attribute value "Silver" can have different modifiers for different products.
 *
 *  Note: When sending to backend (POST/PUT), use `attributeValueId`.
 *  When receiving from backend (GET), the field is `id` (AttributeValue.id).
 *  Both refer to the same AttributeValue record. */
export interface VariantAttributeValue {
  /** Used when sending to backend in create/update body. */
  attributeValueId?: number;
  /** Returned by backend in GET responses (AttributeValue.id). */
  id?: number;
  modifierType?: AttributeModifierType | null;
  modifierValue?: number | null;
  /** Nested attribute value info (returned by backend in product detail). */
  value?: string;
  colorHex?: string | null;
  order?: number;
  attribute?: {
    id: number;
    name: string;
    slug: string;
    inputType: string;
  };
}

export interface ProductVariant {
  id: number;
  sku: string;
  priceAdjustment: number;
  stock: number;
  weight?: number | null;
  isDefault: boolean;
  isActive: boolean;
  finalPrice?: number;
  /** Variant attribute values with optional per-variant price modifiers. */
  attributeValues: VariantAttributeValue[];
  /** Legacy field — kept for backward compat with older API responses. */
  attributeValueIds?: number[];
}

export interface DisplayAttribute {
  attributeId: number;
  value: string;
  attribute?: Pick<Attribute, "id" | "name" | "slug">;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  status: ProductStatus;
  isFeatured: boolean;
  brandId?: number | null;
  brand?: Brand | null;
  categories?: Category[] | Array<{ productId: number; categoryId: number; category: Category }>;
  images?: ProductImage[];
  variants?: ProductVariant[];
  displayAttributes?: DisplayAttribute[];
  displayAttributeValues?: DisplayAttribute[];
  basePrice: number;
  /** Pricing mode — FIXED_IRT (fixed tomans) or CURRENCY_BASED (auto from source currency). */
  pricingMode: ProductPricingMode;
  /** Source currency (required when pricingMode = CURRENCY_BASED). */
  currencyId?: number | null;
  currency?: Pick<Currency, "id" | "code" | "symbol" | "name"> | null;
  /** Price in source currency (e.g. 999.99 USD). */
  sourcePrice?: number | null;
  /** Buffer percentage for price fluctuation (0–100). */
  priceBufferPercent: number;
  /** Current price in IRT (auto-updated by cron for CURRENCY_BASED products). */
  currentPriceIRT?: number | null;
  priceUpdatedAt?: string | null;
  discountType?: DiscountType | null;
  discountValue?: number | null;
  minPrice: number;
  maxPrice: number;
  isInStock: boolean;
  hasActiveDiscount: boolean;
  avgRating?: number | null;
  reviewCount?: number;
  totalSold?: number;
  viewCount?: number;
  isWish?: boolean;
  relatedProducts?: Product[];
  alsoBoughtProducts?: Product[];
  relatedBlogPosts?: BlogPost[];
  createdAt: string;
  updatedAt?: string;
}

export interface ProductFilterMetadata {
  brands: Pick<Brand, "id" | "name" | "slug">[];
  priceRange: { min: number; max: number };
  attributes: Array<
    Pick<Attribute, "id" | "name" | "slug" | "inputType"> & {
      values: Pick<AttributeValue, "id" | "value" | "colorHex">[];
    }
  >;
}

export interface ProductListQuery {
  page?: number;
  limit?: number;
  categorySlug?: string;
  brandIds?: string;
  attributeValueIds?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  hasDiscount?: boolean;
  isFeatured?: boolean;
  search?: string;
  sort?: ProductSortOption;
  status?: ProductStatus;
}

/* ──────────────────────────────────────────────────────────────────────────
   7. Cart
   ────────────────────────────────────────────────────────────────────────── */

export interface CartItem {
  id: number;
  variantId: number;
  productName: string;
  productSlug: string;
  image?: string | null;
  attributesLabel: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  lineTotal: number;
  isAvailable: boolean;
  availableStock: number;
}

export interface Cart {
  id: number | null;
  itemCount: number;
  subtotal: number;
  totalDiscount: number;
  total: number;
  items: CartItem[];
}

export interface CartResponse {
  cart: Cart;
  wasAdjusted?: boolean;
  guestToken?: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   8. Wishlist
   ────────────────────────────────────────────────────────────────────────── */

export interface WishlistItem {
  id: number;
  productId: number;
  product: Pick<
    Product,
    "id" | "name" | "slug" | "minPrice" | "maxPrice" | "isInStock" | "hasActiveDiscount"
  > & { image?: string | null; brand?: Pick<Brand, "id" | "name"> | null };
  createdAt: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   9. Comparison — simplified (GET only)
   ────────────────────────────────────────────────────────────────────────── */

export interface ComparisonResponse {
  items: Array<{ product: Product }>;
}

/* ──────────────────────────────────────────────────────────────────────────
   10. Discount Codes
   ────────────────────────────────────────────────────────────────────────── */

export interface DiscountCode {
  id: number;
  code: string;
  type: DiscountType;
  value: number;
  maxDiscountAmount?: number | null;
  minCartAmount?: number | null;
  maxUsage?: number | null;
  maxUsagePerUser?: number | null;
  usedCount?: number;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive: boolean;
  productIds?: number[];
  categoryIds?: number[];
  userIds?: number[];
  createdAt: string;
  updatedAt?: string;
}

export interface DiscountApplyResult {
  discountCodeId: number;
  code: string;
  type: DiscountType;
  value: number;
  cartTotal: number;
  eligibleSubtotal: number;
  discountAmount: number;
  payableTotal: number;
  eligibleVariantIds: number[];
  guestToken?: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   11. Addresses
   ────────────────────────────────────────────────────────────────────────── */

export interface Address {
  id: number;
  title: string;
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  postalCode: string;
  fullAddress: string;
  lat: number;
  lng: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   12. Shipping Companies
   ────────────────────────────────────────────────────────────────────────── */

export type ShippingPricingType = "FIXED" | "WEIGHT_DISTANCE";

export interface ShippingCompany {
  id: number;
  name: string;
  logoUrl?: string | null;
  logoMediaId?: number | null;
  description?: string | null;
  /** Pricing model used to calculate shipping cost. */
  pricingType: ShippingPricingType;
  /** Flat rate cost in tomans — used when pricingType is FIXED. */
  baseCost: number;
  /** Cost per kilogram in tomans — required when pricingType is WEIGHT_DISTANCE. */
  pricePerKg?: number | null;
  /** Cost per kilometer in tomans — required when pricingType is WEIGHT_DISTANCE. */
  pricePerKm?: number | null;
  /** Whether the company accepts prepayment (GATEWAY / WALLET / MIXED). Defaults to true. */
  acceptsPrepay: boolean;
  /** Whether the company accepts payment on delivery (FREIGHT_COLLECT / COD). Defaults to false. */
  acceptsFreightCollect: boolean;
  estimatedDaysMin?: number | null;
  estimatedDaysMax?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   13. Payment Gateways
   ────────────────────────────────────────────────────────────────────────── */

export interface PaymentGateway {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  config?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   14. Wallet
   ────────────────────────────────────────────────────────────────────────── */

export type WalletTransactionType =
  | "DEPOSIT"
  | "WITHDRAW"
  | "PURCHASE"
  | "REFUND"
  | "ADMIN_ADJUST"
  | "WITHDRAWAL_REQUEST";

export interface WalletTransaction {
  id: number;
  type: WalletTransactionType;
  amount: number;
  description?: string | null;
  orderId?: number | null;
  createdAt: string;
}

export interface WalletData {
  balance: number;
  transactions: WalletTransaction[];
  meta: PaginationMeta;
}

export interface WithdrawalRequest {
  id: number;
  userId: number;
  user?: { id: number; fullName: string; email?: string | null; phone?: string | null };
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  description?: string | null;
  adminNote?: string | null;
  /** User bank IBAN (sheba) — captured at withdrawal request time. */
  bankSheba?: string | null;
  /** User bank card number. */
  bankCardNumber?: string | null;
  /** Account holder full name. */
  bankAccountOwnerName?: string | null;
  /** Admin-entered payment tracking code — shown to the user after approval. */
  trackingCode?: string | null;
  createdAt: string;
  updatedAt?: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   15. Orders
   ────────────────────────────────────────────────────────────────────────── */

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURNED"
  | "REFUNDED"
  | "FAILED";

export type PaymentMethod = "WALLET" | "GATEWAY" | "MIXED" | "FREIGHT_COLLECT";

export interface OrderItem {
  id: number;
  productName: string;
  variantAttributes: string;
  /** Final price in IRT (was previously called `price`). */
  price: number;
  /** Final price in IRT — same as `price`, explicit name from backend. */
  finalPriceIRT?: number;
  /** Pricing mode at the time of order placement. */
  pricingModeSnapshot?: ProductPricingMode | string;
  /** Source currency code (e.g. "USD") if CURRENCY_BASED. */
  sourceCurrencyCode?: string | null;
  /** Exchange rate applied at the time of order. */
  appliedRate?: number | null;
  quantity: number;
  discountAmount: number;
  image?: string | null;
}

export interface OrderStatusHistoryEntry {
  id?: number;
  status: OrderStatus;
  note?: string | null;
  createdAt: string;
}

export interface OrderCancellation {
  reason: string;
  createdAt: string;
}

export interface OrderReturn {
  id: number;
  orderItemId?: number | null;
  reason: string;
  status: "PENDING" | "APPROVED" | "RECEIVED" | "REFUNDED" | "REJECTED";
  refundAmount?: number | null;
  adminNote?: string | null;
  imageMediaIds?: number[];
  createdAt: string;
  updatedAt?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paidAt?: string | null;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  trackingCode?: string | null;
  packageNumber?: string | null;
  /** Total order weight in grams — captured at order creation for shipping cost calc. */
  shippingWeight?: number | null;
  /** Shipping distance in kilometers — captured at order creation for shipping cost calc. */
  shippingDistance?: number | null;
  shippingAddress?: Partial<Address>;
  address?: Address;
  items: OrderItem[];
  statusHistory: OrderStatusHistoryEntry[];
  shippingCompany?: Pick<ShippingCompany, "id" | "name">;
  discountCode?: { id: number; code: string } | null;
  transactions?: WalletTransaction[];
  cancellation?: OrderCancellation | null;
  returns?: OrderReturn[];
  user?: Pick<User, "id" | "fullName">;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOrderBody {
  addressId: number;
  shippingCompanyId: number;
  paymentMethod: PaymentMethod;
  gatewaySlug?: string;
  discountCode?: string;
  /** Total order weight in grams (used for WEIGHT_DISTANCE pricing). */
  shippingWeight?: number;
  /** Shipping distance in kilometers (used for WEIGHT_DISTANCE pricing). */
  shippingDistance?: number;
}

/* ──────────────────────────────────────────────────────────────────────────
   16. Notifications
   ────────────────────────────────────────────────────────────────────────── */

export type NotificationType =
  | "ORDER"
  | "SYSTEM"
  | "TICKET"
  | "PROMOTION"
  | "WALLET"
  | "COMMENT";

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   17. Admin Notifications (separate from user notifications)
   ────────────────────────────────────────────────────────────────────────── */

export interface AdminNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   18. Tickets
   ────────────────────────────────────────────────────────────────────────── */

export type TicketStatus = "OPEN" | "ANSWERED" | "CLOSED" | "PENDING_CUSTOMER";
export type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type TicketMessageSender = "USER" | "ADMIN";

export interface TicketDepartment {
  id: number;
  name: string;
}

export interface TicketMessage {
  id: number;
  senderType: TicketMessageSender;
  message: string;
  attachments?: Array<{ id: number; mediaId: number; media: Media }>;
  createdAt: string;
}

export interface Ticket {
  id: number;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  departmentId?: number | null;
  department?: TicketDepartment | null;
  orderId?: number | null;
  userId?: number;
  user?: Pick<User, "id" | "fullName">;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt?: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   19. Comments (nested) — updated with authorId/authorName/isLiked
   ────────────────────────────────────────────────────────────────────────── */

export type CommentStatus = "PENDING" | "APPROVED" | "REJECTED";
export type CommentableType = "PRODUCT" | "BLOG_POST";

export interface Comment {
  id: number;
  content: string;
  rating?: number | null;
  likeCount?: number;
  isLiked?: boolean;
  userId?: number;
  user?: { id: number; fullName: string; avatarUrl?: string | null };
  authorName?: string;
  status?: CommentStatus;
  commentableType?: string;
  commentableId?: number;
  entity?: { id: number; name: string; slug: string };
  media?: Media[];
  replies?: Comment[];
  createdAt: string;
  updatedAt?: string;
}

export interface CommentRatingSummary {
  average: number;
  count: number;
}

export interface ProductCommentsData {
  items: Comment[];
  meta: PaginationMeta;
  ratingSummary: CommentRatingSummary;
}

/* ──────────────────────────────────────────────────────────────────────────
   20. Banners
   ────────────────────────────────────────────────────────────────────────── */

export type BannerPosition = "HOME_MAIN" | "HOME_MIDDLE" | "CATEGORY_TOP" | "SIDEBAR";

export interface Banner {
  id: number;
  title: string;
  mediaId: number;
  imageUrl: string;
  media?: { id: number; url: string } | null;
  link?: string | null;
  position: BannerPosition;
  order: number;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

/* ──────────────────────────────────────────────────────────────────────────
   21. Popups
   ────────────────────────────────────────────────────────────────────────── */

export interface Popup {
  id: number;
  title: string;
  content: string;
  mediaId?: number | null;
  mediaUrl?: string | null;
  link?: string | null;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  showOncePerSession: boolean;
}

/* ──────────────────────────────────────────────────────────────────────────
   22. Stories — NEW
   ────────────────────────────────────────────────────────────────────────── */

export interface Story {
  id: number;
  title: string;
  coverImage?: { mediaId: number; url: string } | null;
  coverImageMediaId?: number | null;
  coverImageUrl?: string | null;
  video?: { mediaId: number; url: string } | null;
  videoMediaId?: number | null;
  videoUrl?: string | null;
  expiresAt?: string | null;
  order: number;
  isActive?: boolean;
  nextId?: number | null;
  prevId?: number | null;
  products?: Product[];
  createdAt: string;
  updatedAt?: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   23. Newsletter — NEW
   ────────────────────────────────────────────────────────────────────────── */

export interface NewsletterSubscriber {
  id: number;
  email: string;
  createdAt: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   24. Search — NEW (3 types)
   ────────────────────────────────────────────────────────────────────────── */

export interface GlobalSearchResult {
  products: Array<Pick<Product, "id" | "name" | "slug" | "minPrice" | "maxPrice">>;
  blogPosts: Array<{ id: number; title: string; slug: string; coverImageUrl?: string }>;
  categories: Array<Pick<Category, "id" | "name" | "slug">>;
  brands: Array<Pick<Brand, "id" | "name" | "slug">>;
}

export interface QuickSearchResult {
  type: "product" | "category" | "blog_post" | "brand";
  id: number;
  title: string;
  slug: string;
}

export interface MainSearchFilters {
  brands: Array<Pick<Brand, "id" | "name" | "slug" | "logoUrl">>;
  priceRange: { min: number; max: number };
  hasDiscount: boolean;
  inStock: boolean;
}

export interface MainSearchResult {
  items: Product[];
  filters: MainSearchFilters;
  meta: PaginationMeta;
}

/* ──────────────────────────────────────────────────────────────────────────
   25. Landing Page — NEW
   ────────────────────────────────────────────────────────────────────────── */

export type LandingSectionType =
  | "banners"
  | "popups"
  | "stories"
  | "categories"
  | "featured_products"
  | "latest_products"
  | "top_rated_products"
  | "flash_sales"
  | "latest_blog_posts"
  | "popular_brands";

export interface LandingSection {
  type: LandingSectionType;
  label?: string;
  data: unknown;
}

export interface LandingData {
  sections: LandingSection[];
  settings: Record<string, unknown>;
}

/* ──────────────────────────────────────────────────────────────────────────
   26. Blog — NEW (inferred from API mentions)
   ────────────────────────────────────────────────────────────────────────── */

export type BlogPostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: BlogPostStatus;
  coverImageMediaId?: number | null;
  coverImageUrl?: string | null;
  categoryId?: number | null;
  tags?: string[];
  metaTitle?: string | null;
  metaDescription?: string | null;
  publishedAt?: string | null;
  productIds?: number[];
  relatedProducts?: Product[];
  relatedPosts?: BlogPost[];
  createdAt: string;
  updatedAt?: string;
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
}

/* ──────────────────────────────────────────────────────────────────────────
   27. Settings
   ────────────────────────────────────────────────────────────────────────── */

export type SettingType = "string" | "number" | "boolean" | "json";

export interface Setting {
  key: string;
  value: string;
  type: SettingType;
}

export type SettingsMap = Record<string, string | number | boolean | object>;

/* ──────────────────────────────────────────────────────────────────────────
   28. Analytics
   ────────────────────────────────────────────────────────────────────────── */

export type AnalyticsPeriod = "day" | "week" | "month";

export interface AnalyticsOverview {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  pendingOrders: number;
  todayRevenue: number;
  todayOrders: number;
}

export interface AnalyticsSalesPoint {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface AnalyticsOrderStatusBreakdown {
  status: OrderStatus;
  count: number;
}

export interface AnalyticsTopProduct {
  product: Pick<Product, "id" | "name" | "slug">;
  quantitySold: number;
  revenue: number;
}

export interface AnalyticsNewUsersPoint {
  date: string;
  newUsers: number;
}

/* ──────────────────────────────────────────────────────────────────────────
   29. Security (IP blocking)
   ────────────────────────────────────────────────────────────────────────── */

export interface BlockedIp {
  id: number;
  ip: string;
  reason?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   30. Users Admin (extended)
   ────────────────────────────────────────────────────────────────────────── */

export interface AdminUserDetail extends User {
  activeSessionCount: number;
  orderCount: number;
  walletBalance: number;
  recentOrders?: Order[];
}

export interface UserSession {
  id: number;
  deviceName?: string | null;
  ip?: string | null;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string | null;
}

/* ──────────────────────────────────────────────────────────────────────────
   Helper: flatten product categories
   ────────────────────────────────────────────────────────────────────────── */

export interface ProductCategoryLink {
  productId: number;
  categoryId: number;
  category: Category;
}

export function getProductCategories(
  product: Pick<Product, "categories">,
): Category[] {
  if (!product.categories) return [];
  if (product.categories.length === 0) return [];
  const first = product.categories[0] as unknown;
  if (first && typeof first === "object" && "category" in first) {
    return (product.categories as ProductCategoryLink[]).map((c) => c.category);
  }
  return product.categories as Category[];
}

export function getProductImageUrl(img: ProductImage): string {
  return img.url ?? img.media?.url ?? "";
}

export function getProductImageAlt(img: ProductImage, fallback = ""): string {
  return img.alt ?? img.media?.originalName ?? fallback;
}

export function getVariantAttributeValues(
  variant: Pick<ProductVariant, "attributeValues">,
): VariantAttributeValue[] {
  return variant.attributeValues ?? [];
}

/* ──────────────────────────────────────────────────────────────────────────
   Query/Body types (used by services)
   ────────────────────────────────────────────────────────────────────────── */

export interface OrderListQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  search?: string;
}

export interface AdminOrderListQuery extends OrderListQuery {
  userId?: number;
}

export interface AdminReturnsQuery {
  page?: number;
  limit?: number;
  status?: OrderReturn["status"];
  orderId?: number;
  userId?: number;
}

export interface ReviewReturnBody {
  status: "RECEIVED" | "REFUNDED" | "REJECTED" | "APPROVED";
  refundAmount?: number;
  adminNote?: string;
}

export interface RequestReturnBody {
  orderItemId?: number;
  reason: string;
  imageMediaIds?: number[];
}

export interface NotificationListQuery {
  page?: number;
  limit?: number;
  isRead?: boolean;
}

export interface BroadcastBody {
  userIds?: number[];
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export interface TicketListQuery {
  page?: number;
  limit?: number;
  status?: TicketStatus;
  departmentId?: number;
  priority?: TicketPriority;
  search?: string;
  userId?: number;
}

export interface CreateTicketBody {
  subject: string;
  departmentId?: number;
  priority?: TicketPriority;
  orderId?: number;
  message: string;
  attachmentMediaIds?: number[];
}

export interface AddTicketMessageBody {
  message: string;
  attachmentMediaIds?: number[];
}

export interface UpsertDepartmentBody {
  name: string;
}

export interface AdminUpdateTicketBody {
  status?: TicketStatus;
  priority?: TicketPriority;
  departmentId?: number;
}

export interface CreateCommentBody {
  content: string;
  parentId?: number;
  rating?: number;
  attachmentMediaIds?: number[];
}

export interface AdminUserListQuery {
  page?: number;
  limit?: number;
  role?: UserRole;
  isBlocked?: boolean;
  search?: string;
}

export interface BlockIpBody {
  ip: string;
  reason?: string;
  expiresAt?: string | null;
}

export interface UpsertAddressBody {
  title: string;
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  postalCode: string;
  fullAddress: string;
  lat: number;
  lng: number;
  isDefault?: boolean;
}

export interface UpsertShippingCompanyBody {
  name: string;
  logoMediaId?: number | null;
  description?: string;
  /** Pricing model — FIXED (flat rate) or WEIGHT_DISTANCE (per kg + per km). */
  pricingType?: ShippingPricingType;
  /** Flat rate cost in tomans (required for FIXED). */
  baseCost?: number;
  /** Cost per kilogram in tomans (required for WEIGHT_DISTANCE). */
  pricePerKg?: number;
  /** Cost per kilometer in tomans (required for WEIGHT_DISTANCE). */
  pricePerKm?: number;
  /** Accepts prepayment (GATEWAY / WALLET / MIXED). Defaults to true. */
  acceptsPrepay?: boolean;
  /** Accepts payment on delivery (FREIGHT_COLLECT / COD). Defaults to false. */
  acceptsFreightCollect?: boolean;
  estimatedDaysMin?: number;
  estimatedDaysMax?: number;
  isActive?: boolean;
}

export interface UpsertPaymentGatewayBody {
  name: string;
  slug: string;
  isActive?: boolean;
  config?: Record<string, unknown>;
}

export interface UpdateOrderStatusBody {
  status: OrderStatus;
  note?: string;
  trackingCode?: string;
  packageNumber?: string;
}

export interface CreateDiscountCodeBody {
  code: string;
  type: DiscountType;
  value: number;
  maxDiscountAmount?: number | null;
  minCartAmount?: number | null;
  maxUsage?: number | null;
  maxUsagePerUser?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive?: boolean;
  productIds?: number[];
  categoryIds?: number[];
  userIds?: number[];
}

export interface UpsertBannerBody {
  title: string;
  mediaId: number;
  link?: string;
  position: BannerPosition;
  order?: number;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface UpsertPopupBody {
  title: string;
  content: string;
  mediaId?: number | null;
  link?: string;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  showOncePerSession?: boolean;
}

/* ──────────────────────────────────────────────────────────────────────────
   Price Preview (POST /admin/products/preview-price)
   ────────────────────────────────────────────────────────────────────────── */

export interface PricePreviewBreakdownItem {
  attributeValueId: number;
  modifierType: string | null;
  modifierValue: number | null;
  cost: number;
}

export interface PricePreviewBreakdown {
  basePrice: number;
  attributeCost: number;
  attributeCostBreakdown: PricePreviewBreakdownItem[];
  discountAmount: number;
  discountType: string | null;
  discountValue: number | null;
  finalPrice: number;
  pricingMode: ProductPricingMode;
  appliedRate?: number;
}

/** Response from POST /admin/products/preview-price (new simplified format). */
export interface PricePreviewResponse {
  finalPriceIRT: number;
  sourceAmount: number;
  rateUsed: number;
  bufferApplied: number | null;
  fixedIrtAdjustments: number;
  totalAdjustments: number;
}

/** Body for POST /admin/products/preview-price. */
export interface PricePreviewBody {
  pricingMode: ProductPricingMode;
  sourcePrice?: number;
  priceBufferPercent?: number;
  basePrice?: number;
  discountType?: DiscountType;
  discountValue?: number;
  /** Simplified modifiers — no attributeValueId needed. */
  modifiers: Array<{
    modifierType: AttributeModifierType;
    modifierValue: number;
  }>;
}

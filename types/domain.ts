/**
 * Domain entity types — generated from API.md
 * Each interface maps to a backend resource documented in api.md.
 */

import type { PaginationMeta } from "./api";

// Re-export for convenience so services can import both from "@/types/domain".
export type { PaginatedData, PaginationMeta } from "./api";

/* ──────────────────────────────────────────────────────────────────────────
   1. Auth
   ────────────────────────────────────────────────────────────────────────── */

export type UserRole = "CUSTOMER" | "EDITOR" | "SUPPORT" | "ADMIN";

export interface User {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  avatarUrl?: string | null;
  emailVerifiedAt?: string | null;
  phoneVerifiedAt?: string | null;
  isBlocked?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

export type OtpChannel = "SMS" | "EMAIL";

export interface OtpRequestResult {
  identifier: string;
  channel: OtpChannel;
  expiresAt: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   2. Categories (multi-level tree)
   ────────────────────────────────────────────────────────────────────────── */

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageId?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
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
   3. Brands
   ────────────────────────────────────────────────────────────────────────── */

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoId?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  productCount?: number;
  createdAt: string;
  updatedAt?: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   4. Attributes
   ────────────────────────────────────────────────────────────────────────── */

export type AttributeInputType = "TEXT" | "COLOR" | "SELECT";

export interface AttributeValue {
  id: string;
  attributeId: string;
  value: string;
  colorHex?: string | null;
  order: number;
  /** Nested attribute reference (returned by backend in variant context). */
  attribute?: Pick<Attribute, "id" | "name" | "slug">;
}

export interface Attribute {
  id: string;
  name: string;
  slug: string;
  inputType: AttributeInputType;
  isFilterable: boolean;
  isVariant: boolean;
  values: AttributeValue[];
  createdAt: string;
  updatedAt?: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   5. Products (variable products)
   ────────────────────────────────────────────────────────────────────────── */

export type ProductStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type ProductSortOption =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "popular";

/** Embedded media object returned by the backend inside ProductImage. */
export interface ProductImageMedia {
  id: string;
  url: string;
  type?: string;
  mimeType?: string;
  size?: number;
  alt?: string | null;
  createdAt?: string;
}

export interface ProductImage {
  id: string;
  mediaId: string;
  /** Backend nests the media under `media`. We expose both flat + nested for safety. */
  media?: ProductImageMedia;
  url?: string;
  alt?: string | null;
  order: number;
  isMain: boolean;
}

/** Helper to extract url+alt from either flat or nested shape. */
export function getProductImageUrl(img: ProductImage): string {
  return img.url ?? img.media?.url ?? "";
}

export function getProductImageAlt(img: ProductImage, fallback = ""): string {
  return img.alt ?? img.media?.alt ?? fallback;
}

export type DiscountType = "PERCENT" | "FIXED";

/** Junction-row form returned by backend in ProductVariant.attributeValues. */
export interface VariantAttributeValueLink {
  id: string;
  variantId: string;
  attributeValueId: string;
  attributeValue: AttributeValue;
}

export interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  discountType?: DiscountType | null;
  discountValue?: number | null;
  discountStartAt?: string | null;
  discountEndAt?: string | null;
  stock: number;
  isDefault: boolean;
  isActive: boolean;
  effectivePrice?: number;
  attributeValueIds: string[];
  /** Backend returns junction rows: [{ id, variantId, attributeValueId, attributeValue }]. */
  attributeValues?: VariantAttributeValueLink[] | AttributeValue[];
  images?: ProductImage[];
}

/** Junction-row form returned by backend in Product.categories. */
export interface ProductCategoryLink {
  productId: string;
  categoryId: string;
  category: Category;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  status: ProductStatus;
  isFeatured: boolean;
  brandId?: string | null;
  brand?: Brand | null;
  /** Backend returns junction rows: [{ productId, categoryId, category }]. */
  categories?: ProductCategoryLink[] | Category[];
  images?: ProductImage[];
  variants?: ProductVariant[];
  /** Denormalized from variants for fast filtering/sorting. */
  minPrice: number;
  maxPrice: number;
  isInStock: boolean;
  hasActiveDiscount: boolean;
  ratingAverage?: number | null;
  ratingCount?: number;
  viewCount?: number;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Normalize product.categories into a flat Category[] regardless of whether the
 * backend returned junction rows or a flat list.
 */
export function getProductCategories(
  product: Pick<Product, "categories">,
): Category[] {
  if (!product.categories) return [];
  if (product.categories.length === 0) return [];
  const first = product.categories[0] as any;
  if (first && "category" in first) {
    return (product.categories as ProductCategoryLink[]).map((c) => c.category);
  }
  return product.categories as Category[];
}

/**
 * Normalize variant.attributeValues into a flat AttributeValue[] regardless
 * of whether the backend returned junction rows or a flat list.
 */
export function getVariantAttributeValues(
  variant: Pick<ProductVariant, "attributeValues">,
): AttributeValue[] {
  if (!variant.attributeValues) return [];
  if (variant.attributeValues.length === 0) return [];
  const first = variant.attributeValues[0] as any;
  if (first && "attributeValue" in first) {
    return (variant.attributeValues as VariantAttributeValueLink[]).map(
      (av) => av.attributeValue,
    );
  }
  return variant.attributeValues as AttributeValue[];
}

/** Filter metadata returned by `GET /products/filters`. */
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
  brandIds?: string;          // comma-separated
  attributeValueIds?: string; // comma-separated
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  hasDiscount?: boolean;
  isFeatured?: boolean;
  search?: string;
  sort?: ProductSortOption;
  status?: ProductStatus;     // admin only
}

/* ──────────────────────────────────────────────────────────────────────────
   6. Cart
   ────────────────────────────────────────────────────────────────────────── */

export interface CartItem {
  id: string;
  variantId: string;
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
  id: string | null;
  itemCount: number;
  subtotal: number;
  totalDiscount: number;
  total: number;
  items: CartItem[];
}

export interface AddCartItemBody {
  variantId: string;
  quantity: number;
}

export interface CartResponse {
  cart: Cart;
  wasAdjusted?: boolean;
  guestToken?: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   7. Wishlist
   ────────────────────────────────────────────────────────────────────────── */

export interface WishlistItem {
  id: string;
  productId: string;
  product: Pick<
    Product,
    "id" | "name" | "slug" | "minPrice" | "maxPrice" | "isInStock" | "hasActiveDiscount"
  > & { image?: string | null; brand?: Pick<Brand, "id" | "name"> | null };
  createdAt: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   8. Comparison
   ────────────────────────────────────────────────────────────────────────── */

export interface ComparisonItem {
  id: string;
  productId: string;
  product: Product & { brand?: Pick<Brand, "id" | "name"> | null };
}

export interface Comparison {
  id: string | null;
  items: ComparisonItem[];
}

export interface ComparisonResponse {
  comparison: Comparison;
  guestToken?: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   9. Discount Codes
   ────────────────────────────────────────────────────────────────────────── */

export interface DiscountCode {
  id: string;
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
  productIds?: string[];
  categoryIds?: string[];
  userIds?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface DiscountApplyResult {
  discountCodeId: string;
  code: string;
  type: DiscountType;
  value: number;
  cartTotal: number;
  eligibleSubtotal: number;
  discountAmount: number;
  payableTotal: number;
  eligibleVariantIds: string[];
  guestToken?: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   10. Addresses
   ────────────────────────────────────────────────────────────────────────── */

export interface Address {
  id: string;
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
   11. Shipping Companies
   ────────────────────────────────────────────────────────────────────────── */

export interface ShippingCompany {
  id: string;
  name: string;
  logoUrl?: string | null;
  description?: string | null;
  baseCost: number;
  estimatedDaysMin?: number | null;
  estimatedDaysMax?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   12. Payment Gateways
   ────────────────────────────────────────────────────────────────────────── */

export interface PaymentGateway {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   13. Wallet
   ────────────────────────────────────────────────────────────────────────── */

export type WalletTransactionType =
  | "DEPOSIT"
  | "WITHDRAW"
  | "PURCHASE"
  | "REFUND"
  | "ADMIN_ADJUST";

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  amount: number;
  description?: string | null;
  orderId?: string | null;
  createdAt: string;
}

export interface WalletData {
  balance: number;
  transactions: WalletTransaction[];
  meta: PaginationMeta;
}

/* ──────────────────────────────────────────────────────────────────────────
   14. Orders
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

export type PaymentMethod = "WALLET" | "GATEWAY" | "MIXED";

export interface OrderItem {
  id: string;
  productName: string;
  variantAttributes: string;
  price: number;
  quantity: number;
  discountAmount: number;
  image?: string | null;
}

export interface OrderStatusHistoryEntry {
  id?: string;
  status: OrderStatus;
  note?: string | null;
  createdAt: string;
}

export interface OrderCancellation {
  reason: string;
  createdAt: string;
}

export interface OrderReturn {
  id: string;
  orderItemId?: string | null;
  reason: string;
  status: "PENDING" | "APPROVED" | "RECEIVED" | "REFUNDED" | "REJECTED";
  refundAmount?: number | null;
  adminNote?: string | null;
  imageMediaIds?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paidAt?: string | null;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  shippingAddress?: Address;
  address?: Address;
  items: OrderItem[];
  statusHistory: OrderStatusHistoryEntry[];
  shippingCompany?: Pick<ShippingCompany, "id" | "name">;
  discountCode?: { id: string; code: string } | null;
  transactions?: WalletTransaction[];
  cancellation?: OrderCancellation | null;
  returns?: OrderReturn[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOrderBody {
  addressId: string;
  shippingCompanyId: string;
  paymentMethod: PaymentMethod;
  gatewaySlug?: string;
  discountCode?: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   15. Media
   ────────────────────────────────────────────────────────────────────────── */

export type MediaType = "IMAGE" | "PDF" | "OTHER";

export interface Media {
  id: string;
  url: string;
  type: MediaType;
  mimeType: string;
  size: number;
  alt?: string | null;
  uploadedById: string;
  createdAt: string;
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
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   17. Tickets
   ────────────────────────────────────────────────────────────────────────── */

export type TicketStatus = "OPEN" | "ANSWERED" | "CLOSED";
export type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type TicketMessageSender = "USER" | "ADMIN";

export interface TicketDepartment {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface TicketMessage {
  id: string;
  senderType: TicketMessageSender;
  message: string;
  attachmentMediaIds?: string[];
  attachments?: Media[];
  createdAt: string;
}

export interface Ticket {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  departmentId?: string | null;
  department?: TicketDepartment | null;
  orderId?: string | null;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt?: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   18. Comments (nested)
   ────────────────────────────────────────────────────────────────────────── */

export type CommentStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Comment {
  id: string;
  /** User ID (returned by backend; useful for "is this my comment?" checks). */
  userId?: string;
  content: string;
  rating?: number | null;
  /** Approval status (returned by admin list endpoint). */
  status?: CommentStatus;
  likeCount: number;
  likedByMe?: boolean;
  attachments?: Media[];
  /** Nested user object (NOT currently returned by backend — see BACKEND-ISSUES.md). */
  user?: Pick<User, "id" | "fullName" | "avatarUrl">;
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
   19. Banners
   ────────────────────────────────────────────────────────────────────────── */

export type BannerPosition =
  | "HOME_MAIN"
  | "HOME_MIDDLE"
  | "CATEGORY_TOP"
  | "SIDEBAR";

export interface Banner {
  id: string;
  title: string;
  mediaId: string;
  imageUrl: string;
  link?: string | null;
  position: BannerPosition;
  order: number;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

/* ──────────────────────────────────────────────────────────────────────────
   20. Popups
   ────────────────────────────────────────────────────────────────────────── */

export interface Popup {
  id: string;
  title: string;
  content: string;
  mediaId?: string | null;
  imageUrl?: string | null;
  link?: string | null;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  showOncePerSession: boolean;
}

/* ──────────────────────────────────────────────────────────────────────────
   21. Settings
   ────────────────────────────────────────────────────────────────────────── */

export type SettingType = "string" | "number" | "boolean" | "json";

export interface Setting {
  key: string;
  value: string;
  type: SettingType;
}

export type SettingsMap = Record<string, string | number | boolean | object>;

/* ──────────────────────────────────────────────────────────────────────────
   23. Analytics
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
   22. Security (IP blocking)
   ────────────────────────────────────────────────────────────────────────── */

export interface BlockedIp {
  id: string;
  ip: string;
  reason?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

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
  url: string;
  mimeType: string;
  size: number;
  type: MediaType;
  entityType?: string;
  createdAt: string;
}

export interface MediaUsage {
  entityType: string;
  entityId: number;
  entityName: string;
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

export interface ProductVariant {
  id: number;
  sku: string;
  priceAdjustment: number;
  stock: number;
  isDefault: boolean;
  isActive: boolean;
  effectivePrice?: number;
  attributeValueIds: number[];
  attributeValues?: AttributeValue[];
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

export interface ShippingCompany {
  id: number;
  name: string;
  logoUrl?: string | null;
  logoMediaId?: number | null;
  description?: string | null;
  baseCost: number;
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
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  description?: string | null;
  adminNote?: string | null;
  createdAt: string;
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

export type PaymentMethod = "WALLET" | "GATEWAY" | "MIXED";

export interface OrderItem {
  id: number;
  productName: string;
  variantAttributes: string;
  price: number;
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

export type TicketStatus = "OPEN" | "ANSWERED" | "CLOSED";
export type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type TicketMessageSender = "USER" | "ADMIN";

export interface TicketDepartment {
  id: number;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface TicketMessage {
  id: number;
  senderType: TicketMessageSender;
  message: string;
  attachmentMediaIds?: number[];
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
  likeCount: number;
  isLiked?: boolean;
  authorId?: number;
  authorName?: string;
  attachments?: Media[];
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
  imageUrl?: string | null;
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
  video?: { mediaId: number; url: string } | null;
  expiresAt?: string | null;
  order: number;
  nextId?: number | null;
  prevId?: number | null;
  products?: Product[];
  createdAt: string;
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
  metaTitle?: string | null;
  metaDescription?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
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
): AttributeValue[] {
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
  description?: string;
  isActive?: boolean;
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
  logoMediaId?: number;
  description?: string;
  baseCost: number;
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

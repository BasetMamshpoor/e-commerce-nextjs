/**
 * Centralized API endpoint paths
 * Mirrors the routes documented in api.md.
 * Base URL is configured separately (see constants/app.ts → APP_CONFIG.apiBaseUrl).
 */

export const ENDPOINTS = {
  // Health (outside /api/v1)
  health: "/health",
  sitemapXml: "/sitemap.xml",
  robotsTxt: "/robots.txt",

  // 1. Auth
  auth: {
    register: "/auth/register",
    registerVerifyOtp: "/auth/register/verify-otp",
    login: "/auth/login",
    loginOtpRequest: "/auth/login/otp/request",
    loginOtpVerify: "/auth/login/otp/verify",
    refreshToken: "/auth/refresh-token",
    logout: "/auth/logout",
    logoutAll: "/auth/logout-all",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
  },

  // 2. Categories
  categories: {
    tree: "/categories/tree",
    list: "/categories",
    bySlug: (slug: string) => `/categories/slug/${slug}`,
    byId: (id: string) => `/categories/${id}`,
    attributes: (id: string) => `/categories/${id}/attributes`,
    attachAttribute: (id: string) => `/categories/${id}/attributes`,
    detachAttribute: (id: string, attributeId: string) =>
      `/categories/${id}/attributes/${attributeId}`,
  },

  // 3. Brands
  brands: {
    list: "/brands",
    bySlug: (slug: string) => `/brands/slug/${slug}`,
    byId: (id: string) => `/brands/${id}`,
    root: "/brands",
  },

  // 4. Attributes
  attributes: {
    list: "/attributes",
    byId: (id: string) => `/attributes/${id}`,
    root: "/attributes",
    addValue: (id: string) => `/attributes/${id}/values`,
    updateValue: (valueId: string) => `/attributes/values/${valueId}`,
    deleteValue: (valueId: string) => `/attributes/values/${valueId}`,
  },

  // 5. Products
  products: {
    list: "/products",
    adminList: "/products/admin",
    adminById: (id: string) => `/products/admin/${id}`,
    filters: "/products/filters",
    bySlug: (slug: string) => `/products/${slug}`,
    view: (id: string) => `/products/${id}/view`,
    root: "/products",
    byId: (id: string) => `/products/${id}`,
    variants: (id: string) => `/products/${id}/variants`,
    variant: (id: string, variantId: string) =>
      `/products/${id}/variants/${variantId}`,
    variantImages: (id: string, variantId: string) =>
      `/products/${id}/variants/${variantId}/images`,
    variantImage: (id: string, variantId: string, imageId: string) =>
      `/products/${id}/variants/${variantId}/images/${imageId}`,
    images: (id: string) => `/products/${id}/images`,
    image: (id: string, imageId: string) => `/products/${id}/images/${imageId}`,
  },

  // 6. Cart
  cart: {
    get: "/cart",
    addItem: "/cart/items",
    updateItem: (itemId: string) => `/cart/items/${itemId}`,
    deleteItem: (itemId: string) => `/cart/items/${itemId}`,
    clear: "/cart",
    merge: "/cart/merge",
  },

  // 7. Wishlist
  wishlist: {
    list: "/wishlist",
    add: "/wishlist",
    remove: (productId: string) => `/wishlist/${productId}`,
  },

  // 8. Comparison
  comparison: {
    get: "/comparison",
    add: "/comparison",
    remove: (productId: string) => `/comparison/${productId}`,
    clear: "/comparison",
  },

  // 9. Discount Codes
  discountCodes: {
    apply: "/discount-codes/apply",
    list: "/discount-codes",
    byId: (id: string) => `/discount-codes/${id}`,
    root: "/discount-codes",
  },

  // 10. Addresses
  addresses: {
    list: "/addresses",
    byId: (id: string) => `/addresses/${id}`,
    root: "/addresses",
  },

  // 11. Shipping Companies
  shippingCompanies: {
    list: "/shipping-companies",
    byId: (id: string) => `/shipping-companies/${id}`,
    root: "/shipping-companies",
  },

  // 12. Payment Gateways
  paymentGateways: {
    list: "/payment-gateways",
    root: "/payment-gateways",
    byId: (id: string) => `/payment-gateways/${id}`,
  },

  // 13. Wallet
  wallet: {
    get: "/wallet",
    chargeInitiate: "/wallet/charge/initiate",
    chargeVerify: (transactionId: string) =>
      `/wallet/charge/${transactionId}/verify`,
  },

  // 14. Orders
  orders: {
    list: "/orders",
    adminList: "/orders/admin",
    adminReturns: "/orders/admin/returns",
    adminReturn: (returnId: string) => `/orders/admin/returns/${returnId}`,
    adminById: (id: string) => `/orders/admin/${id}`,
    adminStatus: (id: string) => `/orders/admin/${id}/status`,
    create: "/orders",
    byId: (id: string) => `/orders/${id}`,
    cancel: (id: string) => `/orders/${id}/cancel`,
    return: (id: string) => `/orders/${id}/return`,
    paymentInitiate: (id: string) => `/orders/${id}/payment/initiate`,
    paymentVerify: (id: string) => `/orders/${id}/payment/verify`,
  },

  // 15. Media
  media: {
    upload: "/media",
    bulkUpload: "/media/bulk",
    list: "/media",
    byId: (id: string) => `/media/${id}`,
  },

  // 16. Notifications
  notifications: {
    list: "/notifications",
    unreadCount: "/notifications/unread-count",
    readAll: "/notifications/read-all",
    read: (id: string) => `/notifications/${id}/read`,
    byId: (id: string) => `/notifications/${id}`,
    broadcast: "/notifications/admin/broadcast",
  },

  // 17. Tickets
  tickets: {
    departments: "/tickets/departments",
    departmentById: (id: string) => `/tickets/departments/${id}`,
    list: "/tickets",
    create: "/tickets",
    byId: (id: string) => `/tickets/${id}`,
    addMessage: (id: string) => `/tickets/${id}/messages`,
    adminList: "/tickets/admin",
    adminById: (id: string) => `/tickets/admin/${id}`,
    adminUpdate: (id: string) => `/tickets/admin/${id}`,
    adminAddMessage: (id: string) => `/tickets/admin/${id}/messages`,
  },

  // 18. Comments
  comments: {
    byProduct: (productId: string) => `/comments/product/${productId}`,
    create: (productId: string) => `/comments/product/${productId}`,
    byId: (id: string) => `/comments/${id}`,
    like: (id: string) => `/comments/${id}/like`,
    adminList: "/comments/admin",
    adminUpdate: (id: string) => `/comments/admin/${id}`,
  },

  // 19. Banners
  banners: {
    list: "/banners",
    adminList: "/banners/admin",
    root: "/banners",
    byId: (id: string) => `/banners/${id}`,
  },

  // 20. Popups
  popups: {
    list: "/popups",
    adminList: "/popups/admin",
    root: "/popups",
    byId: (id: string) => `/popups/${id}`,
  },

  // 21. Users Admin
  usersAdmin: {
    list: "/users/admin",
    byId: (id: string) => `/users/admin/${id}`,
    block: (id: string) => `/users/admin/${id}/block`,
    unblock: (id: string) => `/users/admin/${id}/unblock`,
    role: (id: string) => `/users/admin/${id}/role`,
    sessions: (id: string) => `/users/admin/${id}/sessions`,
    session: (id: string, sessionId: string) =>
      `/users/admin/${id}/sessions/${sessionId}`,
    sessionsAll: (id: string) => `/users/admin/${id}/sessions`,
  },

  // 22. Security
  security: {
    blockedIps: "/security/blocked-ips",
    blockedIp: (id: string) => `/security/blocked-ips/${id}`,
  },

  // 23. Analytics
  analytics: {
    overview: "/analytics/overview",
    salesOverTime: "/analytics/sales-over-time",
    orderStatusBreakdown: "/analytics/order-status-breakdown",
    topProducts: "/analytics/top-products",
    newUsersOverTime: "/analytics/new-users-over-time",
  },

  // 24. Users Me
  usersMe: {
    get: "/users/me",
    update: "/users/me",
    avatar: "/users/me/avatar",
    password: "/users/me/password",
    changeIdentifierRequest: "/users/me/change-identifier/request",
    changeIdentifierVerify: "/users/me/change-identifier/verify",
  },

  // 25. Settings
  settings: {
    public: "/settings",
    admin: "/settings/admin",
    byKey: (key: string) => `/settings/admin/${key}`,
  },
} as const;

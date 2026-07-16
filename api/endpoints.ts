/**
 * Centralized API endpoint paths — REWRITTEN for updated API.md (July 2025).
 * All IDs are now integers.
 */

export const ENDPOINTS = {
  health: "/health",
  sitemapXml: "/sitemap.xml",
  robotsTxt: "/robots.txt",

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

  categories: {
    tree: "/categories/tree",
    list: "/categories",
    bySlug: (slug: string) => `/categories/slug/${slug}`,
    byId: (id: number) => `/categories/${id}`,
    attributes: (id: number) => `/categories/${id}/attributes`,
    attachAttribute: (id: number) => `/categories/${id}/attributes`,
    detachAttribute: (id: number, attributeId: number) => `/categories/${id}/attributes/${attributeId}`,
    create: "/categories",
    update: (id: number) => `/categories/${id}`,
    delete: (id: number) => `/categories/${id}`,
  },

  brands: {
    list: "/brands",
    bySlug: (slug: string) => `/brands/slug/${slug}`,
    byId: (id: number) => `/brands/${id}`,
    create: "/brands",
    update: (id: number) => `/brands/${id}`,
    delete: (id: number) => `/brands/${id}`,
  },

  attributes: {
    list: "/attributes",
    byId: (id: number) => `/attributes/${id}`,
    create: "/attributes",
    update: (id: number) => `/attributes/${id}`,
    delete: (id: number) => `/attributes/${id}`,
    addValue: (id: number) => `/attributes/${id}/values`,
    updateValue: (valueId: number) => `/attributes/values/${valueId}`,
    deleteValue: (valueId: number) => `/attributes/values/${valueId}`,
  },

  products: {
    list: "/products",
    adminList: "/products/admin",
    adminById: (id: number) => `/products/admin/${id}`,
    filters: "/products/filters",
    bySlug: (slug: string) => `/products/${slug}`,
    byId: (id: number) => `/products/by-id/${id}`,
    create: "/products",
    update: (id: number) => `/products/${id}`,
    delete: (id: number) => `/products/${id}`,
    addVariant: (id: number) => `/products/${id}/variants`,
    updateVariant: (id: number, variantId: number) => `/products/${id}/variants/${variantId}`,
    deleteVariant: (id: number, variantId: number) => `/products/${id}/variants/${variantId}`,
  },

  cart: {
    get: "/cart",
    addItem: "/cart/items",
    updateItem: (itemId: number) => `/cart/items/${itemId}`,
    deleteItem: (itemId: number) => `/cart/items/${itemId}`,
    clear: "/cart",
    merge: "/cart/merge",
  },

  wishlist: {
    list: "/wishlist",
    add: "/wishlist",
    remove: (productId: number) => `/wishlist/${productId}`,
  },

  comparison: {
    get: "/comparison",
  },

  discountCodes: {
    apply: "/discount-codes/apply",
    list: "/discount-codes",
    byId: (id: number) => `/discount-codes/${id}`,
    create: "/discount-codes",
    update: (id: number) => `/discount-codes/${id}`,
    delete: (id: number) => `/discount-codes/${id}`,
  },

  addresses: {
    list: "/addresses",
    byId: (id: number) => `/addresses/${id}`,
    create: "/addresses",
    update: (id: number) => `/addresses/${id}`,
    delete: (id: number) => `/addresses/${id}`,
  },

  shippingCompanies: {
    list: "/shipping-companies",
    byId: (id: number) => `/shipping-companies/${id}`,
    create: "/shipping-companies",
    update: (id: number) => `/shipping-companies/${id}`,
    delete: (id: number) => `/shipping-companies/${id}`,
  },

  paymentGateways: {
    list: "/payment-gateways",
    create: "/payment-gateways",
    update: (id: number) => `/payment-gateways/${id}`,
    delete: (id: number) => `/payment-gateways/${id}`,
  },

  wallet: {
    get: "/wallet",
    chargeInitiate: "/wallet/charge/initiate",
    chargeVerify: (transactionId: number) => `/wallet/charge/${transactionId}/verify`,
    withdrawals: "/wallet/withdrawals",
    adminWithdrawals: "/wallet/admin/withdrawals",
    adminReviewWithdrawal: (id: number) => `/wallet/admin/withdrawals/${id}`,
  },

  orders: {
    list: "/orders",
    adminList: "/orders/admin",
    adminReturns: "/orders/admin/returns",
    adminReturnDetail: (returnId: number) => `/orders/admin/returns/${returnId}`,
    adminById: (id: number) => `/orders/admin/${id}`,
    adminStatus: (id: number) => `/orders/admin/${id}/status`,
    create: "/orders",
    byId: (id: number) => `/orders/${id}`,
    cancel: (id: number) => `/orders/${id}/cancel`,
    return: (id: number) => `/orders/${id}/return`,
    paymentInitiate: (id: number) => `/orders/${id}/payment/initiate`,
    paymentVerify: (id: number) => `/orders/${id}/payment/verify`,
  },

  media: {
    upload: "/media",
    bulkUpload: "/media/bulk",
    list: "/media",
    folders: "/media/folders",
    foldersByEntity: (entityType: string) => `/media/folders/${entityType}`,
    folder: (entityType: string, year: string, month: string) =>
      `/media/folders/${entityType}/${year}/${month}`,
    byId: (id: number) => `/media/${id}`,
    usage: (id: number) => `/media/${id}/usage`,
    download: (id: number) => `/media/${id}/download`,
    update: (id: number) => `/media/${id}`,
    delete: (id: number) => `/media/${id}`,
  },

  notifications: {
    list: "/notifications",
    unreadCount: "/notifications/unread-count",
    readAll: "/notifications/read-all",
    read: (id: number) => `/notifications/${id}/read`,
    delete: (id: number) => `/notifications/${id}`,
    broadcast: "/notifications/admin/broadcast",
  },

  adminNotifications: {
    list: "/admin/notifications",
    unreadCount: "/admin/notifications/unread-count",
    read: (id: number) => `/admin/notifications/${id}/read`,
    readAll: "/admin/notifications/read-all",
  },

  tickets: {
    departments: "/tickets/departments",
    departmentById: (id: number) => `/tickets/departments/${id}`,
    list: "/tickets",
    create: "/tickets",
    byId: (id: number) => `/tickets/${id}`,
    addMessage: (id: number) => `/tickets/${id}/messages`,
    adminList: "/tickets/admin",
    adminById: (id: number) => `/tickets/admin/${id}`,
    adminUpdate: (id: number) => `/tickets/admin/${id}`,
    adminAddMessage: (id: number) => `/tickets/admin/${id}/messages`,
    createDepartment: "/tickets/departments",
    updateDepartment: (id: number) => `/tickets/departments/${id}`,
    deleteDepartment: (id: number) => `/tickets/departments/${id}`,
  },

  comments: {
    byProduct: (productId: number) => `/comments/product/${productId}`,
    create: (productId: number) => `/comments/product/${productId}`,
    byBlogPost: (postId: number) => `/comments/blog/${postId}`,
    createBlog: (postId: number) => `/comments/blog/${postId}`,
    byId: (id: number) => `/comments/${id}`,
    like: (id: number) => `/comments/${id}/like`,
    adminList: "/comments/admin",
    adminUpdate: (id: number) => `/comments/admin/${id}`,
  },

  banners: {
    list: "/banners",
    adminList: "/banners/admin",
    create: "/banners",
    update: (id: number) => `/banners/${id}`,
    delete: (id: number) => `/banners/${id}`,
  },

  popups: {
    list: "/popups",
    adminList: "/popups/admin",
    create: "/popups",
    update: (id: number) => `/popups/${id}`,
    delete: (id: number) => `/popups/${id}`,
  },

  stories: {
    list: "/stories",
    adminList: "/stories/admin",
    create: "/stories",
    update: (id: number) => `/stories/${id}`,
    delete: (id: number) => `/stories/${id}`,
  },

  newsletter: {
    subscribe: "/newsletter/subscribe",
    unsubscribe: "/newsletter/unsubscribe",
    adminSubscribers: "/newsletter/admin/subscribers",
  },

  search: {
    global: "/search",
    quick: "/search/quick",
    main: "/search/main",
  },

  landing: {
    get: "/landing",
  },

  usersAdmin: {
    list: "/users/admin",
    byId: (id: number) => `/users/admin/${id}`,
    block: (id: number) => `/users/admin/${id}/block`,
    unblock: (id: number) => `/users/admin/${id}/unblock`,
    role: (id: number) => `/users/admin/${id}/role`,
    walletAdjust: (id: number) => `/users/admin/${id}/wallet/adjust`,
    sessions: (id: number) => `/users/admin/${id}/sessions`,
    session: (id: number, sessionId: number) => `/users/admin/${id}/sessions/${sessionId}`,
    sessionsAll: (id: number) => `/users/admin/${id}/sessions`,
  },

  security: {
    blockedIps: "/security/blocked-ips",
    blockedIp: (id: number) => `/security/blocked-ips/${id}`,
  },

  analytics: {
    overview: "/analytics/overview",
    salesOverTime: "/analytics/sales-over-time",
    orderStatusBreakdown: "/analytics/order-status-breakdown",
    topProducts: "/analytics/top-products",
    newUsersOverTime: "/analytics/new-users-over-time",
  },

  usersMe: {
    get: "/users/me",
    update: "/users/me",
    password: "/users/me/password",
    changeIdentifierRequest: "/users/me/change-identifier/request",
    changeIdentifierVerify: "/users/me/change-identifier/verify",
  },

  settings: {
    public: "/settings",
    admin: "/settings/admin",
    byKey: (key: string) => `/settings/admin/${key}`,
  },

  blog: {
    list: "/blog",
    bySlug: (slug: string) => `/blog/${slug}`,
    adminList: "/blog/admin",
    create: "/blog",
    update: (id: number) => `/blog/${id}`,
    delete: (id: number) => `/blog/${id}`,
    categories: "/blog/categories",
    createCategory: "/blog/categories",
    updateCategory: (id: number) => `/blog/categories/${id}`,
    deleteCategory: (id: number) => `/blog/categories/${id}`,
  },
} as const;

# Worklog — Persian RTL E-Commerce Frontend

---
Task ID: phase-1
Agent: main (Super Z)
Task: Build Phase 1 — Foundation & Infrastructure for Persian RTL Next.js 16 e-commerce frontend based on api.md and README.md backend docs.

Work Log:
- Read /home/z/my-project/upload/API.md (1122 lines) and README.md fully
- Captured user requirements:
  - Backend URL: http://localhost:4000/api/v1 (live)
  - Rich text editor: TipTap
  - Color palette: Digikala-inspired red (#ef3a4b)
  - Font: Vazirmatn (self-hosted variable woff2)
  - Admin: same Next.js app under /admin/* with separate layout (no site chrome)
  - NO src/ folder — flat root structure
  - app/(site) for storefront, app/admin for admin panel
- Initialized fullstack-dev project (Next.js 16 + Tailwind v4 + shadcn/ui)
- Restructured project: moved src/{app,components,hooks,lib} to root level
- Updated tsconfig.json paths (@/* → ./*), components.json (root paths), next.config.ts (rewrites for sitemap/robots/uploads proxy)
- Installed: axios, leaflet, react-leaflet, @tiptap/react, @tiptap/starter-kit, @tiptap/extension-image, @tiptap/extension-link, @tiptap/extension-text-align, @tiptap/extension-placeholder, @tiptap/pm, @types/leaflet
- Downloaded Vazirmatn v33.003 and placed variable woff2 at app/fonts/
- Built app/globals.css: Tailwind v4 + centralized CSS variables (Digikala red palette), light + dark themes, custom scrollbar, container utilities, shimmer animation
- Built app/layout.tsx: RTL html, Vazirmatn localFont, ThemeProvider → QueryProvider → AuthProvider → CartProvider → Toaster + SonnerToaster
- Built app/(site)/layout.tsx: Header + main + Footer (sticky footer pattern)
- Built app/(site)/page.tsx: home page with hero, feature strip, skeleton placeholders
- Built app/(site)/loading.tsx, error.tsx, not-found.tsx
- Built app/admin/layout.tsx: full-screen admin shell (no site header/footer)
- Built app/admin/page.tsx: dashboard placeholder
- Built constants/app.ts: APP_CONFIG with apiBaseUrl, storageKeys, etc.
- Built types/api.ts: ApiSuccessResponse, ApiErrorResponse, PaginatedData, ApiError class with helpers (isUnauthorized, isRateLimited, isBlocked, etc.)
- Built types/domain.ts: ~700 lines covering ALL entities from api.md (User, Category, Brand, Attribute, Product, Variant, Cart, WishlistItem, Comparison, DiscountCode, Address, ShippingCompany, PaymentGateway, Wallet, Order, Media, Notification, Ticket, Comment, Banner, Popup, Setting, Analytics, BlockedIp)
- Built api/endpoints.ts: every endpoint path from api.md organized by module
- Built lib/api-client.ts: axios instance + request interceptor (auth+guest headers) + response interceptor (unwrap envelope + 401 auto-refresh with token rotation + ApiError mapping) + token storage helpers + hydrateSession + persistSession + getCachedUser + subscribeTokens
- Built lib/query-client.ts: QueryClient factory with retry rules, staleTime, gcTime
- Built providers/auth-context.tsx: useAuth() with user, isLoading, isAuthenticated, applySession, clearLocalSession; auto-fetches /users/me on mount if token exists; listens for auth:session-expired events
- Built providers/cart-context.tsx: useCart() with itemCount synced to React Query cache; auto-merges guest cart on login
- Built 24 service files (one per API module) + index.ts barrel export
- Built utils/format.ts: toPersianDigits, toEnglishDigits, formatPrice, formatToman, formatTomanShort, discountPercent, formatDateFa, formatDateTimeFa, formatRelativeFa, normalizePhone, formatPhone, isValidIranMobile, isValidEmail, pluralizeFa, withCountFa
- Built components/providers/theme-provider.tsx, query-provider.tsx
- Built components/site/header.tsx (logo, search, nav, cart badge, theme toggle, mobile sheet), footer.tsx, theme-toggle.tsx, cart-badge.tsx
- Built components/common/empty-state.tsx, error-state.tsx, loading-skeleton.tsx (Skeleton, LoadingSkeleton, ProductGridSkeleton), persian-number.tsx
- Updated .env with NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_BACKEND_ROOT_URL, NEXT_PUBLIC_PUBLIC_SITE_URL
- Ran `bun run lint` — 0 errors, fixed 1 unused eslint-disable warning
- Verified dev server running on port 3000 (Next.js 16.1.3 Turbopack)
- Verified with agent-browser: home page renders correctly with RTL, Persian text, header/footer; theme toggle works; mobile viewport 375x812 responsive; /admin route renders without site chrome; no console errors
- Wrote comprehensive README.md with stack, structure, setup, phase 1 features, and roadmap

Stage Summary:
- Phase 1 complete. Project is a fully-functional Next.js 16 RTL Persian foundation with:
  - Centralized color system (Digikala red), light/dark theme
  - Vazirmatn font self-hosted
  - Complete typed API layer (axios + interceptors + refresh-token rotation)
  - React Query setup with devtools
  - Auth + Cart context providers
  - 24 service modules + types for all 26 API sections
  - Site shell (header + footer) with mobile menu, search, theme toggle, cart badge
  - Admin shell (full-screen, separate layout)
  - Home page placeholder with hero + skeleton sections
  - Loading/error/empty/not-found states
  - Persian formatting utilities (digits, currency, dates, phone)
- Dev server running cleanly. Lint passes. Browser-verified at / and /admin.
- Ready for Phase 2 (Auth) on user approval.
- ZIP will be generated at /home/z/my-project/download/storefront-phase-1.zip

---
Task ID: phase-2
Agent: main (Super Z)
Task: Phase 2 (Auth) + cleanup unused packages + remove backend code + migrate to unified radix-ui + Tailwind v4 CSS-first + enrich home page + complete SEO infrastructure.

Work Log:
- Cleanup:
  - Removed prisma/, db/, lib/db.ts (backend-only)
  - Removed tailwind.config.ts (Tailwind v4 = CSS-first)
  - Removed unused packages: @dnd-kit/*, @mdxeditor/editor, next-auth, next-intl, @prisma/client, prisma, react-markdown, react-syntax-highlighter, react-resizable-panels, @reactuses/core, uuid, sharp, tailwindcss-animate
  - Removed all 30+ individual @radix-ui/react-* packages
  - Installed radix-ui@1.6.0 (unified) + shadcn@4.11.1 (CLI as devDep)
  - Regenerated all 45 shadcn components via `bunx shadcn@latest add ...` (now using unified radix-ui imports)
  - Removed deprecated Toaster/useToast, switched to Sonner
  - Updated components.json (root paths, new CLI)
  - Replaced Instagram/Send/Telegram lucide icons (lucide v1 dropped brand icons) with inline SVGs

- SEO Infrastructure:
  - Created lib/seo.tsx with builders: organizationJsonLd, websiteJsonLd, breadcrumbJsonLd, productJsonLd, collectionPageJsonLd, itemListJsonLd, articleJsonLd, faqJsonLd, JsonLd component, paginationAlternates, buildOgImages
  - Added Organization + WebSite JSON-LD to root layout
  - Created components/common/breadcrumb.tsx (UI + BreadcrumbList JSON-LD in one)
  - Created app/robots.ts (Next.js native; disallow /admin, /account, /cart, etc.)
  - Updated next.config.ts: /robots.txt removed from proxy (uses native), kept /sitemap.xml + /uploads/* proxies
  - All auth pages have robots: { index: false, follow: false }

- Home Page Enrichment:
  - Created features/catalog/hooks/ (use-categories-tree, use-brands, use-products, use-banners, use-popups)
  - Created components/site/home-hero-slider.tsx (Carousel with banners HOME_MAIN, fallback gradient slide, dots)
  - Created components/site/home-categories-grid.tsx (categories from API + SectionHeader with ReactNode title)
  - Created components/site/home-products.tsx (HomeFeaturedProducts + HomeDiscountProducts with Flame icon)
  - Created components/site/home-top-brands.tsx (horizontal scroll)
  - Created components/site/home-middle-banners.tsx (HOME_MIDDLE banners)
  - Created components/site/home-blog-section.tsx (3 sample posts, placeholder until blog API added — no blog API in api.md)
  - Created components/site/home-newsletter.tsx (with Sonner toast on submit)
  - Created components/site/popup-display.tsx (active popups, showOncePerSession via sessionStorage)
  - Created components/site/product-card.tsx (rich card with quick actions, discount badge, price formatting, rating)
  - Rewrote app/(site)/page.tsx with all sections + ItemList JSON-LD

- Phase 2 — Auth:
  - Created features/auth/schemas/auth.schema.ts (Zod: identifier, password, otp, forgotPassword, resetPassword — all matching api.md rules)
  - Created features/auth/hooks/:
    - use-login.ts (password login + redirect-back)
    - use-register.ts (register + redirect to /verify-otp?mode=register)
    - use-verify-otp.ts (handles both register + login modes; includes useLoginOtpRequest)
    - use-forgot-password.ts (always redirects to /reset-password to avoid account enumeration)
    - use-logout.ts + useLogoutAll
  - Created features/auth/hooks/index.ts barrel
  - Created components/auth/auth-form-card.tsx (shared card with logo)
  - Created components/auth/form-fields.tsx (IdentifierField with auto-channel detection, PasswordField with show/hide)
  - Created components/auth/login-form.tsx (Tabs: password / OTP)
  - Created components/auth/register-form.tsx (fullName + identifier + password + terms checkbox)
  - Created components/auth/verify-otp-form.tsx (InputOTP, countdown timer, resend)
  - Created components/auth/forgot-password-form.tsx
  - Created components/auth/reset-password-form.tsx (OTP + new password)
  - Created components/common/auth-guard.tsx (AuthGuard + GuestOnly with redirect-back)
  - Created components/common/countdown-timer.tsx (for OTP expiry display)
  - Created 5 routes:
    - app/(site)/login/page.tsx
    - app/(site)/register/page.tsx
    - app/(site)/verify-otp/page.tsx
    - app/(site)/forgot-password/page.tsx
    - app/(site)/reset-password/page.tsx

- Validation:
  - bun run lint: 0 errors, 0 warnings (after fixing 4 lint issues: missing FormItem/FormLabel imports, window.location.href replaced with router.push, form.watch replaced with useWatch)
  - Dev server tested: all 7 routes (/, /login, /register, /forgot-password, /reset-password, /verify-otp, /admin) returned 200
  - Browser verified login page UI: tabs work, fields render with proper RTL, theme toggle works

Stage Summary:
- Phase 2 + cleanup + SEO infrastructure complete. Project size significantly reduced (removed 42+ packages).
- All shadcn components now use unified radix-ui package (single import).
- Home page is now rich: hero slider, categories, featured products, discount products, banners, brands, blog, newsletter, popups.
- Full SEO: Organization, WebSite, BreadcrumbList, ItemList JSON-LD; native robots.ts; per-page metadata with proper robots directives; canonical URLs.
- Complete auth flow: login (password+OTP), register, verify-otp, forgot-password, reset-password with Zod validation matching api.md, redirect-back, rate-limit UX, session persistence.
- Ready for Phase 3 (Catalog: real product listing + filters + product detail with variants) on user approval.

# فروشگاه اینترنتی Persian RTL — Frontend

> یک پروژه‌ی Next.js 16 (App Router) برای یک فروشگاه اینترنتی فارسی کاملاً RTL،
> مبتنی بر مستندات API در `api.md` و `README.md`.

این شاخه شامل **فاز ۱ (Foundation) + فاز ۲ (Auth)** + پاکسازی و تقویت سئو است.

---

## پشته‌ی فناوری

| لایه | فناوری |
|------|--------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 (CSS-first, بدون tailwind.config) |
| UI Components | shadcn/ui 4.x (new-york) + **radix-ui یکپارچه** (نه پکیج‌های جدا) |
| State (server) | TanStack Query v5 |
| State (client) | React Context (auth, cart) |
| HTTP | Axios (interceptors + refresh-token rotation) |
| Forms | React Hook Form + Zod |
| Animation | Framer Motion |
| Map | React Leaflet |
| Rich Text | TipTap |
| Theme | next-themes (light/dark) |
| Icons | Lucide + SVG های inline برای برندها |
| Font | Vazirmatn (variable, self-hosted) |
| OTP Input | input-otp |
| Toast | Sonner (به‌جای deprecated toast) |

---

## تغییرات مهم در این فاز

### پاکسازی

- ❌ حذف **پریزما و db.ts** — این‌ها سمت بک‌اند بودند.
- ❌ حذف **tailwind.config.ts** — در Tailwind v4 همه‌چیز داخل `app/globals.css` است.
- ❌ حذف پکیج‌های اضافی: `@dnd-kit/*`، `@mdxeditor/editor`، `next-auth`، `next-intl`،
  `react-markdown`، `react-syntax-highlighter`، `react-resizable-panels`،
  `@reactuses/core`، `uuid`، `sharp`، `tailwindcss-animate`،
  **و ۳۰ پکیج `@radix-ui/react-*` جدا**.
- ✅ جایگزینی با **`radix-ui` تک‌پکیجی (v1.6.0)** و **`shadcn` CLI (v4.11.1)**.
- ✅ بازتولید ۴۵ کامپوننت shadcn با CLI جدید (`bunx shadcn@latest add ...`).
- ✅ حذف `useToast` قدیمی و جایگزینی با **Sonner** (با icons اختصاصی).

### تقویت صفحه‌ی خانه

- ✅ **اسلایدر اصلی** (Carousel) با بنرهای `HOME_MAIN` از API + fallback gradient
- ✅ **شبکه دسته‌بندی‌ها** با تصاویر دسته از API
- ✅ **محصولات منتخب** + **تخفیف‌های ویژه** (با ProductCard غنی)
- ✅ **بنرهای وسط صفحه** (`HOME_MIDDLE`)
- ✅ **برندهای محبوب** (scroll horizontal)
- ✅ **بخش وبلاگ** (placeholder — API بلاگ در api.md نیست)
- ✅ **خبرنامه** (با toast موفقیت)
- ✅ **پاپ‌آپ تبلیغاتی** (یک‌بار در هر session، با احترام به `showOncePerSession`)
- ✅ **ProductCard** کامل با quick actions (wishlist/comparison)، badge تخفیف،
  نمایش قیمت با discount strikethrough، rating

### زیرساخت سئو

- ✅ `lib/seo.tsx` با builders برای:
  - `Organization` + `WebSite` (در root layout)
  - `BreadcrumbList` (per-page)
  - `Product` (با AggregateRating + Offers)
  - `CollectionPage` (category/brand pages)
  - `ItemList` (listing pages)
  - `Article` (blog posts — آماده برای فاز آینده)
  - `FAQPage`
- ✅ کامپوننت `Breadcrumb` که هم UI و هم JSON-LD را در همان مکان render می‌کند
- ✅ `app/robots.ts` بومی Next.js (با disallow پنل‌ها)
- ✅ proxy `/sitemap.xml` و `/uploads/*` به بک‌اند در `next.config.ts`
- ✅ متادیتای کامل در root layout (OG, Twitter, robots, canonical)
- ✅ متادیتای per-page با `robots: { index: false }` برای صفحات auth

### فاز ۲ — احراز هویت

۵ صفحه با فرم‌های کامل:

- ✅ **`/login`** — تب‌های ورود با رمز + ورود با OTP
- ✅ **`/register`** — فرم ثبت‌نام با اعتبارسنجی قوانین، checkbox قوانین
- ✅ **`/verify-otp`** — ورود کد ۵ رقمی با `InputOTP`، countdown timer، resend
- ✅ **`/forgot-password`** — درخواست OTP بازیابی
- ✅ **`/reset-password`** — OTP + رمز جدید

زیرساخت:

- ✅ **`features/auth/schemas/auth.schema.ts`** — Zod schemas مطابق قوانین api.md:
  - identifier (email یا موبایل ایرانی)
  - password (min 8، حداقل یک حرف + یک عدد)
  - code (۵ رقم فارسی→انگلیسی)
- ✅ **Hooks**: useLogin، useRegister، useVerifyOtp، useLoginOtpRequest،
  useForgotPassword، useResetPassword، useLogout، useLogoutAll
- ✅ **`AuthGuard`** + **`GuestOnly`** با redirect-back به مسیر قبلی
- ✅ **`CountdownTimer`** برای OTP expiry + resend
- ✅ **`IdentifierField`** با تشخیص خودکار کانال (SMS/Email)
- ✅ **`PasswordField`** با toggle show/hide
- ✅ **اعلان‌های Sonner** برای موفقیت/خطا با پیام‌های فارسی + توضیحات
- ✅ **مدیریت rate-limit** (429) و account-block (403) با UX مناسب
- ✅ **session persistence** + auto-fetch `/users/me` بعد از refresh
- ✅ **redirect-back**: کاربر پس از ورود به مسیری که قبل از auth بود برمی‌گردد

---

## ساختار پوشه‌ها

```
.
├── app/
│   ├── (site)/                 ← Storefront (با Header/Footer)
│   │   ├── page.tsx            ← خانه غنی
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── verify-otp/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   ├── loading.tsx, error.tsx, not-found.tsx
│   │   └── layout.tsx
│   ├── admin/                  ← پنل ادمین (full-screen)
│   ├── fonts/                  ← Vazirmatn woff2
│   ├── globals.css             ← Tailwind v4 + CSS variables (تنها منبع رنگ)
│   ├── layout.tsx              ← Root: RTL, providers, font, theme, JSON-LD
│   └── robots.ts               ← بومی Next.js
├── api/endpoints.ts
├── components/
│   ├── ui/                     ← 45 shadcn component (CLI-added, radix-ui unified)
│   ├── providers/              ← ThemeProvider, QueryProvider
│   ├── site/                   ← Header, Footer, HomeHeroSlider, ProductCard, ...
│   ├── auth/                   ← AuthFormCard, LoginForm, RegisterForm, ...
│   └── common/                 ← EmptyState, ErrorState, Skeleton, PersianNumber,
│                                 Breadcrumb, AuthGuard, CountdownTimer
├── constants/app.ts
├── features/
│   ├── auth/
│   │   ├── hooks/              ← use-login, use-register, use-verify-otp, ...
│   │   └── schemas/            ← auth.schema.ts (Zod)
│   └── catalog/hooks/          ← use-categories-tree, use-brands, use-products,
│                                 use-banners, use-popups
├── hooks/use-mobile.ts
├── lib/
│   ├── api-client.ts           ← Axios + interceptors + refresh-token rotation
│   ├── query-client.ts
│   ├── utils.ts                ← cn()
│   └── seo.tsx                 ← JSON-LD builders + <JsonLd> component
├── providers/
│   ├── auth-context.tsx
│   └── cart-context.tsx
├── services/                   ← 24 service files + index.ts barrel
├── types/
│   ├── api.ts                  ← ApiResponse, PaginatedData, ApiError
│   └── domain.ts               ← همه‌ی entity types (~700 خط)
├── utils/format.ts             ← Persian digits, currency, dates, phone
├── public/
├── .env                        ← NEXT_PUBLIC_API_BASE_URL etc.
├── components.json             ← shadcn config (root paths, new CLI)
├── next.config.ts              ← rewrites: /sitemap.xml, /uploads/*
├── package.json                ← بدون پکیج‌های اضافی
└── README.md                   ← This file
```

---

## راه‌اندازی

### ۱. نصب وابستگی‌ها

```bash
bun install
```

### ۲. پیکربندی `.env`

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_BACKEND_ROOT_URL=http://localhost:4000
NEXT_PUBLIC_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_PAGE_SIZE=20
```

### ۳. اجرای dev server

```bash
bun run dev
```

سپس به `http://localhost:3000` بروید.

### ۴. اتصال به بک‌اند

بک‌اند باید روی `http://localhost:4000` در حال اجرا باشد.

---

## اضافه کردن کامپوننت‌های shadcn جدید

از این پس برای اضافه کردن کامپوننت جدید، فقط کافیست:

```bash
bunx shadcn@latest add <component-name>
```

این دستور خودش فایل را در `components/ui/` می‌سازد و پکیج‌های لازم را اضافه می‌کند.

---

## نقشه‌ی فازهای بعدی

| فاز | محتوا |
|-----|-------|
| 3 | Catalog (page products real, categories tree page, product detail with variants) |
| 4 | Cart, Wishlist, Comparison |
| 5 | Checkout + Orders |
| 6 | User account (profile, wallet, addresses, tickets, notifications) |
| 7 | Comments & Reviews |
| 8 | Admin panel (full) |
| 9 | SEO completion + performance optimization |
| 10 | Polish, animations, a11y audit |

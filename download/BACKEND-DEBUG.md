# Backend Debug Notes

> تنها مواردی که فرانت‌اند از بک‌اند نیاز دارد یا مشکلات کشف‌شده حین توسعه.

---

## نیازمندی‌های فرانت‌اند از بک‌اند

### ۱. حداقل عمر توکن
- `accessToken`: **۱۵ دقیقه** — فرانت باید `refresh-token` را خودکار صدا بزند.
- `refreshToken`: **۳ روز** (چرخشی — هر استفاده، قبلی را باطل می‌کند).

### ۲. Rate Limiting روی Auth
- مسیرهای `/auth/*`: حداکثر **۱۰ درخواست در دقیقه** برای هر IP.
- هدر `X-RateLimit-Reset` (epoch seconds) در پاسخ `429`.

### ۳. آپلود فایل (Media)
- تکی: `POST /media` با field name `file`.
- گروهی: `POST /media/bulk` با field name `files` (حداکثر ۲۰ فایل).
- **نکته:** تیکت‌ها و کامنت‌ها از multipart با field name `attachments` پشتیبانی می‌کنند.

### ۴. مدیریت تصاویر محصول
- `PUT /products/:id` مدیریت تصاویر را انجام می‌دهد:
  - `deletedImages`: آرایه‌ای از `ProductImage.id`.
  - فایل‌های جدید: `multipart/form-data` با field name `images` + field `body` (JSON string).
- endpoint‌های قدیمی `POST /:id/images` و `DELETE /:id/images/:imageId` حذف شده‌اند.

### ۵. ساختار قیمت محصول
- `basePrice` (الزامی) + `variants[].priceAdjustment`.
- تخفیف per-product است (`discountType` + `discountValue`).
- `minPrice` / `maxPrice` / `isInStock` / `avgRating` / `reviewCount` / `totalSold` کش می‌شوند.

### ۶. بازدید خودکار
- `POST /:id/view` حذف شده — بازدید در `GET /:slug` و `GET /by-id/:id` ثبت می‌شود.

### ۷. Cart مهمان
- هدر `X-Guest-Token` — اگر نفرستید، بک‌اند می‌سازد و در `data.guestToken` برمی‌گرداند.
- بعد از لاگین: `POST /cart/merge` با `{ guestToken }`.

### ۸. سفارش
- فقط `CUSTOMER` می‌تواند سفارش ثبت کند (`403` برای سایر نقش‌ها).
- `trackingCode` و `packageNumber` در `PUT /admin/:id/status` ست می‌شوند.

### ۹. مرجوعی
- `POST /:id/return` با `{ orderItemId?, reason, imageMediaIds? }`.
- `imageMediaIds` = شناسه‌های Media (قبلاً آپلود شده).
- وضعیت‌ها: `PENDING` → `APPROVED` → `RECEIVED` → `REFUNDED` (یا `REJECTED`).

### ۱۰. تیکت
- multipart upload با field name `attachments` پشتیبانی می‌شود.
- پیام‌ها شامل `attachments` با `media.url`, `media.mimeType`, `media.originalName`, `media.size`.
- بستن خودکار: ۵ روز بعد از آخرین پاسخ پشتیبانی.

### ۱۱. کامنت
- ساختار درختی (`replies`).
- `authorId` و `authorName` در تمام پاسخ‌ها.
- `isLiked` بر اساس توکن (optionalAuthenticate).
- `rating` فقط روی کامنت اصلی.

### ۱۲. استوری
- `nextId` و `prevId` برای ناوبری.
- `coverImage` + `video` (اختیاری) با Media.
- استوری‌های منقضی در `/stories` عمومی نیستند ولی در `/stories/admin` هست.

### ۱۳. Landing
- `GET /landing` آرایه `sections` + `settings` برمی‌گرداند.
- section types: `banners`, `popups`, `stories`, `categories`, `featured_products`, `latest_products`, `top_rated_products`, `flash_sales`, `latest_blog_posts`, `popular_brands`.

### ۱۴. Analytics
- مسیرها ممکن است `429` برگردانند — فرانت نباید retry کند.
- `period`: `day` | `week` | `month`.
- `from` / `to` به فرمت ISO 8601.

---

## مشکلات کشف‌شده

### مشکل: لوپ بی‌نهایت در `/admin/analytics`
- **علت:** `new Date()` در هر رندر query key جدید → refetch → رندر → لوپ.
- **راه‌حل فرانت:** تاریخ را با `useState` ثابت نگه دار.

### مشکل: خطای Suspense در `useSearchParams`
- **علت:** `useSearchParams()` بدون Suspense boundary در build-time.
- **راه‌حل فرانت:** `export const dynamic = "force-dynamic"` به صفحات اضافه شود.

### مشکل: ۴۲۹ در Analytics
- **علت:** Rate limiting روی درخواست‌های مکرر.
- **راه‌حل فرانت:** React Query را طوری پیکربندی کن که ۴xx (شامل ۴۲۹) را retry نکند.

---

## اعتبارنامه‌های تست

- **مدیر:** `admin@mrkafshdoz.com` / `Admin@1234`
- **مشتری:** `ali@example.com` / `Customer@1234`
- **بک‌اند:** `http://mrkafshdoz.com:4000`

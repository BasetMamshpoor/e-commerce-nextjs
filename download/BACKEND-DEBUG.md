# Backend Debug Notes — فروشگاه

> نکات و مشکلات کشف‌شده در بک‌اند هنگام توسعه فرانت‌اند.
> این فایل صرفاً برای دیباگ و رفع اشکال است، نه مرجع API.

---

## ۱. احراز هویت و توکن‌ها

### عمر توکن کوتاه
- `accessToken` عمر پیش‌فرض **۱۵ دقیقه** دارد.
- `refreshToken` عمر پیش‌فرض **۳ روز** دارد (چرخشی — هر بار استفاده، قبلی باطل می‌شود).
- فرانت باید به‌صورت خودکار توکن را تازه کند (interceptor در `lib/api-client.ts`).

### Rate Limiting روی Auth
- مسیرهای `/auth/*` زیر rate-limiter سخت‌گیرانه: **۱۰ درخواست در دقیقه** برای هر IP.
- در صورت عبور، پاسخ `429` با هدر `X-RateLimit-Reset` (epoch seconds).
- **نکته:** تست‌های مکرر لاگین در محیط توسعه ممکن است به این محدودیت برخورد کند.

---

## ۲. مدیریت رسانه (Media)

### آپلود
- `POST /media` — `multipart/form-data`, field name: `file`
- `POST /media/bulk` — `multipart/form-data`, field name: `files` (حداکثر ۲۰ فایل)
- **نکته:** فایل‌ها بر اساس `entityType` در پوشه‌های جداگانه ذخیره می‌شوند:
  `uploads/products/`, `uploads/categories/`, `uploads/brands/`, `uploads/tickets/`, etc.

### حذف
- `DELETE /media/:id` — اگر فایل در جایی استفاده شده باشد (محصول، دسته، بنر، استوری، تیکت، کامنت، مرجوعی، شرکت ارسال)، پاسخ `409` برمی‌گردد.
- **راه‌حل:** ابتدا فایل را از تمام موجودیت‌ها جدا کنید، سپس حذف کنید.

### محل استفاده (Usage)
- `GET /media/:id/usage` — لیست موجودیت‌هایی که از این رسانه استفاده می‌کنند.
- ساختار: `{ usage: [{ entityType, entityId, entityName }] }`

---

## ۳. محصولات

### ساختار قیمت‌گذاری
- `basePrice` = حداقل قیمت محصول (تومان، عدد صحیح).
- `variants[].priceAdjustment` = افزایش قیمت نسبت به basePrice (می‌تواند ۰ یا منفی باشد).
- **قیمت نهایی هر تنوع** = `basePrice + priceAdjustment`.
- تخفیف **کل محصول** است (`discountType` + `discountValue`)، نه per-variant.
- `minPrice` / `maxPrice` روی محصول کش می‌شوند.

### مدیریت تصاویر
- تصاویر از طریق `PUT /products/:id` مدیریت می‌شوند:
  - `deletedImages`: آرایه‌ای از `ProductImage.id` برای حذف.
  - فایل‌های جدید: `multipart/form-data` با field name `images`.
  - فیلد `body` (JSON string) شامل سایر فیلدها.
- **نکته:** endpoint‌های قدیمی `POST /:id/images` و `DELETE /:id/images/:imageId` حذف شده‌اند.

### بازدید خودکار
- `POST /:id/view` حذف شده — بازدید به‌صورت خودکار در `GET /:slug` و `GET /by-id/:id` ثبت می‌شود.
- `viewCount` در پاسخ محصول موجود است.

### فیلدهای کش‌شده روی محصول
- `avgRating`, `reviewCount` — هنگام تایید/رد کامنت به‌صورت خودکار بازمحاسبه می‌شوند.
- `totalSold` — از سفارش‌های `DELIVERED` محاسبه می‌شود.
- `isInStock` — بر اساس مجموع موجودی تنوع‌ها.
- `hasActiveDiscount` — بر اساس `discountType`/`discountValue` و بازه زمانی.

---

## ۴. سبد خرید (Cart)

### هدر مهمان
- `X-Guest-Token: <مقدار دلخواه>` — برای سبد مهمان.
- اگر نفرستید، بک‌اند یک مقدار تازه می‌سازد و در `data.guestToken` برمی‌گرداند.
- **نکته:** توکن مهمان را در `localStorage` ذخیره کنید و در درخواست‌های بعدی بفرستید.
- بعد از لاگین، `POST /cart/merge` را با `guestToken` بزنید.

### wasAdjusted
- وقتی تعداد درخواستی بیشتر از موجودی باشد، `wasAdjusted: true` در پاسخ می‌آید و تعداد خودکار به سقف موجودی کاهش می‌یابد.

---

## ۵. سفارش‌ها

### ثبت سفارش
- فقط کاربران با نقش `CUSTOMER` می‌توانند سفارش ثبت کنند (`403` برای سایر نقش‌ها).
- `paymentMethod`: `WALLET` | `GATEWAY` | `MIXED`.
- اگر `WALLET` و موجودی کافی نباشد → `400`.
- پس از ثبت موفق، نوتیفیکیشن برای کاربر و ادمین ارسال می‌شود.

### trackingCode و packageNumber
- این فیلدها توسط ادمین از طریق `PUT /admin/:id/status` با body `{ status, note, trackingCode, packageNumber }` ست می‌شوند.
- معمولاً هنگام تغییر وضعیت به `SHIPPED` ست می‌شوند.

### مرجوعی
- `POST /:id/return` — فقط روی سفارش `DELIVERED`.
- body: `{ orderItemId?, reason, imageMediaIds? }`.
- `imageMediaIds` آرایه‌ای از شناسه‌های Media است (قبلاً آپلود شده).
- ادمین از طریق `PUT /admin/returns/:returnId` بررسی و تایید/رد می‌کند.
- وضعیت‌ها: `PENDING` → `APPROVED` → `RECEIVED` → `REFUNDED` (یا `REJECTED`).

---

## ۶. تیکت‌ها

### بستن خودکار
- تیکت‌هایی که ۵ روز از آخرین پاسخ پشتیبانی آن‌ها گذشته باشد، به‌صورت خودکار بسته می‌شوند.

### آپلود فایل پیوست
- دو روش:
  1. **از قبل آپلود کنید:** فایل را به `POST /media` بفرستید، سپس `mediaId` را در `attachmentMediaIds` قرار دهید.
  2. **Multipart هم‌زمان:** `multipart/form-data` با field `body` (JSON string) و `attachments` (فایل‌ها).
- بک‌اند فایل‌ها را خودکار به Media آپلود و به `attachmentMediaIds` اضافه می‌کند.

### پاسخ `GET /:id` و `GET /admin/:id`
- پیام‌ها شامل فیلد `attachments` با جزئیات کامل فایل (شامل `media.url`, `media.mimeType`, `media.originalName`, `media.size`) هستند.

---

## ۷. کامنت‌ها

### ساختار درختی
- کامنت‌ها به‌صورت درختی برگردانده می‌شوند (`replies` آرایه‌ای از کامنت‌ها).
- `rating` فقط روی کامنت‌های اصلی (سطح اول) معنا دارد.
- پاسخ‌ها `rating: null` دارند.

### فیلدهای Author
- `authorId` و `authorName` در تمام پاسخ‌ها موجودند.
- `isLiked` بر اساس توکن کاربر (optionalAuthenticate) برگردانده می‌شود.

### moderateComment
- `PUT /admin/:id` با body `{ status: "APPROVED" | "REJECTED" }`.
- هنگام تایید/رد، `avgRating` و `reviewCount` محصول به‌صورت خودکار بازمحاسبه می‌شوند.

---

## ۸. استوری‌ها

### ساختار
- هر Story شامل: `title`, `coverImage` (با Media), `video` (با Media, اختیاری), `expiresAt`, `order`, `productIds`.
- `nextId` و `prevId` برای ناوبری بین استوری‌ها.
- `products` = محصولات مرتبط با استوری.

### انقضا
- استوری‌های منقضی‌شده (`expiresAt` در گذشته) در لیست عمومی `/stories` برگردانده نمی‌شوند.
- در پنل ادمین `/stories/admin` همه (شامل منقضی) برگردانده می‌شوند.

---

## ۹. صفحه اصلی (Landing)

### ساختار sections
- `GET /landing` آرایه‌ای از sections برمی‌گرداند:
  ```json
  { "sections": [{ "type": "banners", "data": [...] }, ...], "settings": { ... } }
  ```
- نوع‌های section: `banners`, `popups`, `stories`, `categories`, `featured_products`, `latest_products`, `top_rated_products`, `flash_sales`, `latest_blog_posts`, `popular_brands`.
- هر section محصول ممکن است فیلد `label` داشته باشد (عنوان نمایشی).
- `settings` شامل تنظیمات سایت است (`store_name`, `instagram_url`, `telegram_url`, `phone`, ...).

---

## ۱۰. آنالیز (Analytics)

### محدودیت نرخ (Rate Limit)
- مسیرهای `/analytics/*` ممکن است `429` برگردانند اگر درخواست‌ها بیش از حد مکرر باشند.
- **نکته مهم:** فرانت‌اند نباید ۴۲۹ را retry کند — این باعث لوپ بی‌نهایت می‌شود.
- راه‌حل: در `lib/query-client.ts` تمام خطاهای ۴xx (شامل ۴۲۹) non-retryable هستند.

### پارامترهای تاریخ
- `from` و `to` به فرمت ISO 8601 (مثلاً `2026-06-05T18:09:37.579Z`).
- `period`: `day` (پیش‌فرض) | `week` | `month`.

---

## ۱۱. مشکلات شناخته‌شده و راه‌حل‌ها

### مشکل: لوپ بی‌نهایت درخواست در صفحه آنالیز
- **علت:** `new Date()` در هر رندر مقدار جدیدی تولید می‌کرد → query key جدید → refetch → رندر مجدد → لوپ.
- **راه‌حل:** تاریخ‌ها را با `useState` ( initializer) یک بار محاسبه و ثابت نگه دار.

### مشکل: خطای Suspense در useSearchParams
- **علت:** استفاده از `useSearchParams()` در صفحات client بدون Suspense boundary باعث خطای prerender می‌شود.
- **راه‌حل:** `export const dynamic = "force-dynamic"` به صفحاتی که از `useSearchParams` استفاده می‌کنند اضافه شود.

### مشکل: تیکت‌ها فایل پیوست نمی‌پذیرفتند
- **علت:** سرویس تیکت فقط `attachmentMediaIds` را پشتیبانی می‌کرد، نه multipart upload.
- **راه‌حل:** متدهای `createWithAttachments` و `addMessageWithAttachments` به سرویس اضافه شد.

---

## ۱۲. نکات تست

### اعتبارنامه‌های تست
- **مدیر:** `admin@mrkafshdoz.com` / `Admin@1234`
- **مشتری:** `ali@example.com` / `Customer@1234`

### بک‌اند زنده
- URL: `http://mrkafshdoz.com:4000`
- Health: `GET /health` (بیرون `/api/v1`)
- Sitemap: `GET /sitemap.xml` (بیرون `/api/v1`)
- Robots: `GET /robots.txt` (بیرون `/api/v1`)

### مسیرهای proxy در Next.js
- `/sitemap.xml` → `${BACKEND_ROOT}/sitemap.xml`
- `/uploads/:path*` → `${BACKEND_ROOT}/uploads/:path*`
- `/robots.txt` → سرو native توسط `app/robots.ts`

# اشکالات بک‌اند — گزارش کامل

> این فایل حاصل تست کامل فرانت‌اند با بک‌اند زنده روی `http://mrkafshdoz.com:4000` در طول ۱۰ فاز توسعه است.
> هر مورد با شماره، اولویت، توضیح، و راه‌حل پیشنهادی ثبت شده است.

---

## 🔴 اولویت بالا — تأثیر مستقیم روی UX

### ۱. Brand و Category بدون URL تصویر
**فایل تأثیرگذار:** `src/services/brands.service.ts`, `src/services/categories.service.ts`
**مسیرهای تأثیرگذار:** `GET /brands`, `GET /brands/:id`, `GET /categories/tree`, `GET /categories/:id`

**مشکل:** بک‌اند فقط `logoId` (برای Brand) و `imageId` (برای Category) برمی‌گرداند، نه URL آماده. فرانت نمی‌تواند تصویر را نمایش دهد.

**وضعیت فعلی فرانت:** fallback نمایش حرف اول نام برند/دسته.

**راه‌حل پیشنهادی:** در service بک‌اند، هنگام serialization، `logoUrl` و `imageUrl` را از روی `logoId`/`imageId` و جدول Media پر کنید (مثل کاری که برای `ProductImage.media` می‌کنید).

```typescript
// مثال در brand.service.ts
const brands = await prisma.brand.findMany({
  include: { logo: true }, // اضافه کنید
});
return brands.map(b => ({
  ...b,
  logoUrl: b.logo?.url ?? null, // اضافه کنید
}));
```

---

### ۲. WishlistItem.product ساختار ناقص
**مسیر تأثیرگذار:** `GET /wishlist`

**مشکل:** `product` در آیتم‌های wishlist فیلدهای محدود دارد (`image` خالی، `variants` وجود ندارد، `brand` ناقص).

**تأثیر:** در صفحه wishlist نمی‌توان دکمه «افزودن به سبد» مستقیم گذاشت — کاربر باید به صفحه محصول برود.

**راه‌حل پیشنهادی:** `WishlistItem.product` را مثل `GET /products/:slug` کامل برگردانید (حداقل `variants` و `images`).

---

### ۳. Comment بدون user object
**مسیر تأثیرگذار:** `GET /comments/product/:productId`

**مشکل:** نظرات شامل object کاربر (`fullName`, `avatarUrl`) نیستند — فقط `userId` برمی‌گردد.

**تأثیر:** فرانت نمی‌تواند نام و آواتار کاربر را در نظرات نمایش دهد — fallback «کاربر» نشان می‌دهد.

**راه‌حل پیشنهادی:** در `comment.service.ts`، هنگام fetch نظرات، `user` را include کنید:

```typescript
const comments = await prisma.comment.findMany({
  where: { productId, status: "APPROVED", parentId: null },
  include: {
    user: { select: { id: true, fullName: true, avatarUrl: true } },
    replies: {
      include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
    },
  },
});
```

---

### ۴. sitemap.xml فقط URL خانه را برمی‌گرداند
**مسیر تأثیرگذار:** `GET /sitemap.xml`

**مشکل:** با وجود وجود محصول/دسته/برند، sitemap فقط URL خانه (`http://localhost:3000/`) را برمی‌گرداند.

**تأثیر:** سئو ضعیف — موتورهای جستجو صفحات محصول را پیدا نمی‌کنند.

**راه‌حل پیشنهادی:** بررسی کنید که `buildUrl` در `src/services/seo/sitemap.service.ts` درست کار می‌کند و محصولات/دسته‌ها/برندهای فعال را اضافه می‌کند.

**نکته:** فرانت‌اند یک `app/sitemap.ts` بومی Next.js هم دارد که این مشکل را پوشش می‌دهد، اما بهتر است sitemap بک‌اند هم درست کار کند.

---

## 🟡 اولویت متوسط — Workaround وجود دارد اما کثیف است

### ۵. ProductImage ساختار تودرتو
**مسیر تأثیرگذار:** `GET /products`, `GET /products/:slug`

**مشکل:** تصاویر محصول به این شکل برمی‌گردند:
```json
{ "mediaId": "...", "media": { "url": "...", "alt": "..." } }
```
نه flat:
```json
{ "mediaId": "...", "url": "...", "alt": "..." }
```

**تأثیر:** بدون workaround، تصاویر در فرانت خالی نمایش داده می‌شدند.

**وضعیت فعلی فرانت:** helperهای `getProductImageUrl` و `getProductImageAlt` در `types/domain.ts`.

**راه‌حل پیشنهادی:** فیلدهای `url` و `alt` را flat هم روی خود `ProductImage` قرار دهید (در کنار `media` تودرتو).

---

### ۶. ProductVariant.attributeValues ساختار junction
**مسیر تأثیرگذار:** `GET /products/:slug`

**مشکل:** به‌جای آرایه ساده `AttributeValue[]`، junction rows برمی‌گردد:
```json
[{ "attributeValueId": "...", "attributeValue": { "value": "سفید", "attribute": { "name": "رنگ" } } }]
```

**تأثیر:** لیبل variantها خالی بود.

**وضعیت فعلی فرانت:** helper `getVariantAttributeValues`.

**راه‌حل پیشنهادی:** یا flat `AttributeValue[]` برگردانید (با فیلد `attribute` تودرتو)، یا حداقل در api.md مستند کنید.

---

### ۷. Product.categories ساختار junction
**مسیر تأثیرگذار:** `GET /products`, `GET /products/:slug`

**مشکل:** به‌جای `Category[]`، junction rows برمی‌گردد:
```json
[{ "productId": "...", "categoryId": "...", "category": {...} }]
```

**وضعیت فعلی فرانت:** helper `getProductCategories`.

**راه‌حل پیشنهادی:** flat `Category[]` برگردانید یا در api.md مستند کنید.

---

### ۸. `GET /cart` شکل پاسخ
**مسیر تأثیرگذار:** `GET /cart`

**مشکل:** api.md می‌گوید پاسخ `GET /cart` هم `{ cart, guestToken? }` است، اما در عمل فقط `Cart` برمی‌گرداند.

**تأثیر:** برای کاربر مهمان تازه، guest token روی اولین `GET /cart` گرفته نمی‌شود — فقط روی `POST /cart/items` گرفته می‌شود.

**راه‌حل پیشنهادی:** `GET /cart` را هم `CartResponse` برگردانید (مثل سایر مسیرهای cart).

---

## 🟢 اولویت پایین — Optimization / مستندسازی

### ۹. عدم وجود endpoint برای دریافت چندگانه Media
**مشکل:** برای resolve کردن `logoUrl` برندها و `imageUrl` دسته‌ها (مشکل #۱)، فرانت باید برای هر کدام `GET /media/:id` بزند که N+1 query می‌شود.

**راه‌حل پیشنهادی:** یا در همان endpoint برند/دسته، `media` تودرتو برگردانید (مثل ProductImage)، یا یک `GET /media?ids=id1,id2,...` اضافه کنید.

---

### ۱۰. مستندسازی دسترسی payment-gateways
**مشکل:** `POST/PUT/DELETE /payment-gateways` فقط `ADMIN` است، اما `GET` عمومی است. این درست است، فقط در api.md مستندسازی شود.

---

### ۱۱. تنظیمات (Settings) فیلد `type` برمی‌گردد اما در `GET /` (عمومی) برنمی‌گردد
**مشکل:** `GET /settings` (عمومی) مقادیر را parse شده برمی‌گرداند (number/boolean/json)، اما `type` هر فیلد را برنمی‌گرداند. `GET /settings/admin` هم `type` برمی‌گرداند.

**تأثیر:** فرانت نمی‌تواند در نمایش عمومی، نوع هر فیلد را تشخیص دهد (مثلاً آیا `free_shipping_threshold` عدد است یا متن).

**راه‌حل پیشنهادی:** یا در `GET /` هم `type` برگردانید، یا اطمینان حاصل کنید که مقادیر همیشه با نوع درست parse می‌شوند (که الان درست است).

---

## خلاصه اولویت‌بندی

| # | اولویت | توضیح | وضعیت فرانت |
|---|--------|-------|-------------|
| ۱ | 🔴 بالا | Brand/Category بدون URL تصویر | fallback حرف اول |
| ۲ | 🔴 بالا | WishlistItem.product ناقص | لینک به صفحه محصول |
| ۳ | 🔴 بالا | Comment بدون user object | fallback «کاربر» |
| ۴ | 🔴 بالا | sitemap فقط URL خانه | sitemap.ts بومی Next.js |
| ۵ | 🟡 متوسط | ProductImage تودرتو | helper |
| ۶ | 🟡 متوسط | attributeValues junction | helper |
| ۷ | 🟡 متوسط | categories junction | helper |
| ۸ | 🟡 متوسط | GET /cart شکل پاسخ | فقط روی POST |
| ۹ | 🟢 پایین | endpoint batch برای Media | — |
| ۱۰ | 🟢 پایین | مستندسازی payment-gateways | — |
| ۱۱ | 🟢 پایین | type در settings عمومی | — |

---

## نحوه گزارش به فرانت پس از اصلاح

پس از اصلاح هر مورد، به من بگویید تا:
1. Workaround مربوطه را از فرانت حذف کنم (helperها در `types/domain.ts`)
2. تست کنم که داده واقعی به‌درستی نمایش داده می‌شود
3. در صورت نیاز، کد را ساده‌سازی کنم

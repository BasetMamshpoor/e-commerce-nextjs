# اشکالات بک‌اند + پرامپت Claude

## پرامپت برای ارسال به Claude

کد زیر را کپی کرده و به Claude بفرستید:

---

```
من یک پروژه بک‌اند Express + Prisma دارم که API یک فروشگاه اینترنتی فارسی را ارائه می‌دهد. فرانت‌اند Next.js من با این بک‌اند کار می‌کند اما چند مشکل در پاسخ‌های API وجود دارد که باید اصلاح شود. لطفاً هر مورد را بررسی و اصلاح کنید.

## ۱. Brand و Category بدون URL تصویر
**مسیرهای تأثیرگذار:** `GET /brands`, `GET /brands/:id`, `GET /categories/tree`, `GET /categories/:id`

**مشکل:** بک‌اند فقط `logoId` (برای Brand) و `imageId` (برای Category) برمی‌گرداند، نه URL آماده. فرانت نمی‌تواند تصویر را نمایش دهد.

**راه‌حل:** در service بک‌اند، هنگام serialization، `logoUrl` و `imageUrl` را از روی `logoId`/`imageId` و جدول Media پر کنید:

```typescript
// در brand.service.ts
const brands = await prisma.brand.findMany({
  include: { logo: true },
});
return brands.map(b => ({
  ...b,
  logoUrl: b.logo?.url ?? null,
}));
```

همین کار را برای Category با `imageId` و فیلد `image` انجام دهید.

## ۲. WishlistItem.product ساختار ناقص
**مسیر تأثیرگذار:** `GET /wishlist`

**مشکل:** `product` در آیتم‌های wishlist فیلدهای محدود دارد (`image` خالی، `variants` وجود ندارد، `brand` ناقص).

**راه‌حل:** `WishlistItem.product` را مثل `GET /products/:slug` کامل برگردانید (حداقل `variants` و `images` را include کنید):

```typescript
const wishlist = await prisma.wishlistItem.findMany({
  where: { userId },
  include: {
    product: {
      include: {
        brand: true,
        images: { include: { media: true }, orderBy: { order: 'asc' } },
        variants: true,
      },
    },
  },
});
```

## ۳. Comment بدون user object
**مسیر تأثیرگذار:** `GET /comments/product/:productId`

**مشکل:** نظرات شامل object کاربر (`fullName`, `avatarUrl`) نیستند — فقط `userId` برمی‌گردد.

**راه‌حل:** در `comment.service.ts`، هنگام fetch نظرات، `user` را include کنید:

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

## ۴. sitemap.xml فقط URL خانه را برمی‌گرداند
**مسیر تأثیرگذار:** `GET /sitemap.xml`

**مشکل:** با وجود وجود محصول/دسته/برند، sitemap فقط URL خانه را برمی‌گرداند.

**راه‌حل:** در `src/services/seo/sitemap.service.ts`، تابع `buildUrl` و تابع اصلی sitemap را بررسی کنید که محصولات منتشرشده + دسته‌های فعال + برندهای فعال را اضافه می‌کند.

## ۵. ProductImage ساختار تودرتو
**مسیر تأثیرگذار:** `GET /products`, `GET /products/:slug`

**مشکل:** تصاویر محصول به این شکل برمی‌گردند:
```json
{ "mediaId": "...", "media": { "url": "...", "alt": "..." } }
```
نه flat:
```json
{ "mediaId": "...", "url": "...", "alt": "..." }
```

**راه‌حل:** فیلدهای `url` و `alt` را flat هم روی خود `ProductImage` قرار دهید:

```typescript
// در serialization
const images = product.images.map(img => ({
  ...img,
  url: img.media?.url ?? null,
  alt: img.media?.alt ?? null,
}));
```

## ۶. ProductVariant.attributeValues ساختار junction
**مسیر تأثیرگذار:** `GET /products/:slug`

**مشکل:** به‌جای آرایه ساده `AttributeValue[]`، junction rows برمی‌گردد.

**راه‌حل:** attributeValues را flat کنید:

```typescript
const variants = product.variants.map(v => ({
  ...v,
  attributeValues: v.attributeValues.map(av => ({
    id: av.attributeValue.id,
    attributeId: av.attributeValue.attributeId,
    value: av.attributeValue.value,
    colorHex: av.attributeValue.colorHex,
    order: av.attributeValue.order,
    attribute: av.attributeValue.attribute,
  })),
}));
```

## ۷. Product.categories ساختار junction
**مسیر تأثیرگذار:** `GET /products`, `GET /products/:slug`

**مشکل:** به‌جای `Category[]`، junction rows برمی‌گردد.

**راه‌حل:** categories را flat کنید:

```typescript
const categories = product.categories.map(pc => pc.category);
```

## ۸. `GET /cart` شکل پاسخ
**مسیر تأثیرگذار:** `GET /cart`

**مشکل:** api.md می‌گوید پاسخ `GET /cart` هم `{ cart, guestToken? }` است، اما در عمل فقط `Cart` برمی‌گرداند.

**راه‌حل:** در `cart.controller.ts`، پاسخ `GET /cart` را هم مثل سایر مسیرها به `{ cart, guestToken? }` تغییر دهید:

```typescript
// GET /
res.json({
  success: true,
  message: 'موفقیت‌آمیز بود',
  data: { cart, guestToken: guestToken ?? undefined },
});
```

## ۹. عدم وجود endpoint برای دریافت چندگانه Media
**مشکل:** برای resolve کردن `logoUrl` برندها و `imageUrl` دسته‌ها، فرانت باید برای هر کدام `GET /media/:id` بزند (N+1 query).

**راه‌حل:** اگر مورد ۱ اصلاح شود (تودرتو کردن media در برند/دسته)، این مشکل خودکار حل می‌شود. در غیر این صورت، یک `GET /media?ids=id1,id2,...` اضافه کنید.

## ۱۰. ADMIN ایجاد کاربر (add admin)
**مشکل:** فرانت‌اند نیاز دارد که ادمین بتواند کاربر جدید (با نقش مدیر/پشتیبانی/ویرایشگر) ایجاد کند. فعلاً فقط `POST /auth/register` وجود دارد که فقط CUSTOMER می‌سازد.

**راه‌حل:** یک endpoint جدید اضافه کنید:

```
POST /api/v1/users/admin
Auth: ADMIN
Body: { fullName, identifier, password, role: "EDITOR" | "SUPPORT" | "ADMIN" }
```

این endpoint باید:
- کاربر را با نقش مشخص‌شده ایجاد کند (بدون نیاز به OTP)
- رمز عبور را hash کند
- ایمیل/موبایل را تاییدشده علامت بزند
- در `users.admin.controller.ts` و `users.admin.routes.ts` اضافه شود

---

لطفاً هر مورد را در فایل مربوطه اصلاح کنید و تغییرات را به‌صورت git diff ارائه دهید. فایل‌های احتمالی که باید تغییر کنند:
- `src/services/catalog/brand.service.ts`
- `src/services/catalog/category.service.ts`
- `src/services/shopping/wishlist.service.ts`
- `src/services/comments.service.ts` (یا `src/services/comments/`)
- `src/services/seo/sitemap.service.ts`
- `src/services/catalog/product.service.ts`
- `src/services/shopping/cart.service.ts` (یا controller مربوطه)
- `src/controllers/users.admin.controller.ts`
- `src/routes/users.admin.routes.ts`
- `src/validations/user.validation.ts`
```

---

## خلاصه اشکالات (برای مرجع)

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
| ۱۰ | 🔴 بالا | ADMIN ایجاد کاربر جدید | — |

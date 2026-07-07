# توضیح ساختار Variants و Attributes

## 🏷️ **Attributes (ویژگی‌ها)**

ویژگی‌ها سه نوع دارند:

| نوع | مثال | استفاده |
|-----|-----|--------|
| **Variant Attributes** | رنگ، سایز، حافظه | برای ایجاد تنوع‌های مختلف محصول |
| **Filterable Attributes** | برند، قیمت | برای فیلتر در فروشگاه |
| **Display Attributes** | کشور سازنده | فقط برای نمایش در صفحه‌ی جزئیات |

- هر Attribute می‌تواند چند مقدار داشته باشد (مثل: رنگ → قرمز، آبی، سبز)
- Input Types: `TEXT`, `COLOR`, `SELECT`

## 📦 **Variants (تنوع‌ها)**

هر محصول **باید حداقل یک Variant داشته باشد**. ساختار Variant:

```json
{
  "sku": "TSHIRT-RED-L",           // کد یکتا
  "priceAdjustment": 5000,         // افزایش قیمت نسبت به basePrice
  "stock": 20,                     // موجودی
  "weight": 0.5,                   // وزن (اختیاری)
  "isDefault": true,               // آیا پیش‌فرض است
  "isActive": true,                // فعال یا غیرفعال
  "attributeValueIds": [1, 5]      // شناسه‌های مقادیر ویژگی
}
```

**قانون مهم:** هیچ دو Variant نمی‌توانند ترکیب یکسانی از `attributeValueIds` داشته باشند.

---

## 📝 **ساختار ارسال محصول در Create و Update**

### **1️⃣ Create Product** `POST /api/v1/products`

```json
{
  "name": "تیشرت مردانه",
  "brandId": 1,
  "shortDescription": "توضیح کوتاه",
  "description": "<p>HTML</p>",
  "basePrice": 250000,                          // قیمت پایه
  "discountType": "PERCENT",                    // PERCENT یا FIXED
  "discountValue": 10,
  "status": "DRAFT",                            // DRAFT, PUBLISHED, ARCHIVED
  "isFeatured": false,
  "categoryIds": [1, 2],                        // دسته‌بندی‌ها (الزامی)
  
  // ✅ تصاویر (دو روش):
  "images": [
    { "mediaId": 1, "order": 0, "isMain": true }
  ],
  
  // ✅ تنوع‌ها (الزامی، حداقل 1):
  "variants": [
    {
      "sku": "TSHIRT-RED-L",
      "priceAdjustment": 0,
      "stock": 20,
      "isDefault": true,
      "attributeValueIds": [1, 5]  // ID رنگ قرمز و سایز L
    },
    {
      "sku": "TSHIRT-BLUE-L",
      "priceAdjustment": 0,
      "stock": 15,
      "isDefault": false,
      "attributeValueIds": [2, 5]  // ID رنگ آبی و سایز L
    }
  ],
  
  // ✅ ویژگی‌های نمایشی (اختیاری):
  "displayAttributes": [
    { "attributeId": 3, "value": "کشور سازنده: ایران" }
  ]
}
```

### **2️⃣ Update Product** `PUT /api/v1/products/:id`

```json
{
  "name": "تیشرت مردانه ویرایش‌شده",
  "categoryIds": [1, 2],
  "basePrice": 260000,
  
  // حذف تصاویر:
  "deletedImages": [3, 5],
  
  // تصاویر جدید (multipart یا JSON با mediaId)
  // برای تنوع‌ها endpoint های مخصوص استفاده کنید
}
```

---

## ➕ **مدیریت تنوع‌ها (Add/Edit/Delete)**

### **افزودن Variant جدید**
```bash
POST /api/v1/products/:productId/variants
```
```json
{
  "sku": "TSHIRT-GREEN-M",
  "priceAdjustment": 3000,
  "stock": 10,
  "isDefault": false,
  "attributeValueIds": [3, 6]
}
```

### **ویرایش Variant**
```bash
PUT /api/v1/products/:productId/variants/:variantId
```
```json
{
  "stock": 25,
  "priceAdjustment": 5000
}
```

### **حذف Variant**
```bash
DELETE /api/v1/products/:productId/variants/:variantId
```

**توجه:** باید حداقل یک Variant باقی بماند.

---

## 📊 **مثال عملی (T-Shirt با رنگ‌های مختلف)**

```json
{
  "name": "تیشرت مردانه",
  "basePrice": 200000,
  "categoryIds": [5],
  
  "variants": [
    {
      "sku": "TS-RED-S",
      "priceAdjustment": 0,
      "stock": 50,
      "isDefault": true,
      "attributeValueIds": [10, 21]    // رنگ قرمز، سایز S
    },
    {
      "sku": "TS-RED-M",
      "priceAdjustment": 0,
      "stock": 60,
      "isDefault": false,
      "attributeValueIds": [10, 22]    // رنگ قرمز، سایز M
    },
    {
      "sku": "TS-BLUE-S",
      "priceAdjustment": 2000,          // ۲۰۰ هزار + ۲ هزار = ۲۰۲ هزار
      "stock": 40,
      "isDefault": false,
      "attributeValueIds": [11, 21]    // رنگ آبی، سایز S
    }
  ]
}
```

---

## 🔑 **نکات مهم**

1. **قیمت نهایی** = `basePrice + priceAdjustment`
2. **SKU باید یکتا باشد** (در کل سیستم)
3. **حداقل یک Variant** الزامی است
4. **isDefault = true برای یک Variant**: اگر بیشتر از یک Variant `isDefault=true` باشد، اولی انتخاب می‌شود
5. **displayAttributes** فقط برای اطلاعات نمایشی (مثل «کشور سازنده»)
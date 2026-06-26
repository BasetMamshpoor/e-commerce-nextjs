/**
 * Persian-specific formatting utilities
 *   - Number → Persian digits
 *   - Currency → grouped with thousands separator + "تومان"
 *   - Dates → relative + absolute (Jalali approximation via Intl)
 */

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const EN_DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/** Convert any English digits in a string to Persian. */
export function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

/** Convert any Persian digits in a string to English (useful before Number()). */
export function toEnglishDigits(input: string): string {
  return input.replace(/[۰-۹]/g, (d) => String(EN_DIGITS.indexOf(d)));
}

/** Group an integer with thousands separators (Persian-style). */
export function groupDigits(n: number): string {
  return new Intl.NumberFormat("fa-IR", { useGrouping: true }).format(n);
}

/** Format an integer price (toman) → "۱٬۲۵۰٬۰۰۰". */
export function formatPrice(n: number): string {
  return toPersianDigits(groupDigits(n));
}

/** Format with currency label → "۱٬۲۵۰٬۰۰۰ تومان". */
export function formatToman(n: number): string {
  return `${formatPrice(n)} تومان`;
}

/** Short-formatted price for tight UI (e.g. badges). */
export function formatTomanShort(n: number): string {
  if (n >= 1_000_000_000) return `${toPersianDigits((n / 1_000_000_000).toFixed(1))} میلیارد`;
  if (n >= 1_000_000) return `${toPersianDigits((n / 1_000_000).toFixed(1))} میلیون`;
  if (n >= 1_000) return `${toPersianDigits((n / 1_000).toFixed(0))}٬۰۰۰`;
  return toPersianDigits(n);
}

/** Compute discount percentage from original & current price. */
export function discountPercent(originalPrice: number, currentPrice: number): number {
  if (originalPrice <= 0 || currentPrice >= originalPrice) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

/* ───────── Dates ───────── */

/** Format an ISO date as "۱۴۰۵/۰۴/۰۱" (Persian calendar) using Intl. */
export function formatDateFa(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

/** Format an ISO date as "۱۴۰۵/۰۴/۰۱ - ۱۴:۳۰". */
export function formatDateTimeFa(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** "۵ دقیقه پیش" / "۲ ساعت پیش" / "دیروز" / absolute fallback. */
export function formatRelativeFa(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "لحظاتی پیش";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${toPersianDigits(min)} دقیقه پیش`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${toPersianDigits(hr)} ساعت پیش`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "دیروز";
  if (day < 7) return `${toPersianDigits(day)} روز پیش`;
  return formatDateFa(d);
}

/* ───────── Phone ───────── */

/** Normalize Iranian phone: "+98 912 345 6789" → "09123456789". */
export function normalizePhone(input: string): string {
  let s = toEnglishDigits(input).replace(/[\s\-()]/g, "");
  if (s.startsWith("+98")) s = "0" + s.slice(3);
  else if (s.startsWith("0098")) s = "0" + s.slice(4);
  else if (s.startsWith("98") && s.length === 12) s = "0" + s.slice(2);
  return s;
}

/** Pretty-print: "0912 345 6789". */
export function formatPhone(input: string): string {
  const n = normalizePhone(input);
  if (n.length === 11) {
    return `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}`;
  }
  return n;
}

/** True if string is a valid Iranian mobile (09xxxxxxxxx). */
export function isValidIranMobile(input: string): boolean {
  return /^09\d{9}$/.test(normalizePhone(input));
}

/** True if string looks like an email. */
export function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

/* ───────── Pluralization (Persian) ───────── */

/** Pick a Persian noun form based on count. */
export function pluralizeFa(
  count: number,
  singular: string,
  plural: string = singular,
): string {
  return count === 1 ? singular : plural;
}

/** "۳ سفارش" → with proper plural noun. */
export function withCountFa(
  count: number,
  singular: string,
  plural: string = singular,
): string {
  return `${toPersianDigits(count)} ${pluralizeFa(count, singular, plural)}`;
}

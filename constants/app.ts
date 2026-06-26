/**
 * App-wide constants
 * Single source of truth for runtime configuration values.
 */

export const APP_CONFIG = {
  /** Backend API base URL (no trailing slash). Always /api/v1. */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1",

  /** Backend root URL — used for sitemap.xml / robots.txt proxy and /uploads/* media paths. */
  backendRootUrl: process.env.NEXT_PUBLIC_BACKEND_ROOT_URL ?? "http://localhost:4000",

  /** Public site URL — used in metadata, OpenGraph, canonical URLs. */
  publicSiteUrl: process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? "http://localhost:3000",

  /** Default page size for product listing. */
  defaultPageSize: Number(process.env.NEXT_PUBLIC_DEFAULT_PAGE_SIZE ?? 20),

  /** Max items allowed in comparison list (per backend). */
  comparisonMaxItems: 4,

  /** Storage keys (localStorage). Namespaced to avoid collisions. */
  storageKeys: {
    accessToken: "sf_at",
    refreshToken: "sf_rt",
    user: "sf_user",
    guestToken: "sf_guest",
    theme: "sf_theme",
    dismissedPopups: "sf_dismissed_popups",
  } as const,

  /** OTP code length (used by OTP input UI). */
  otpLength: 5,

  /** Currency label (shown next to formatted prices). */
  currencyLabel: "تومان",
} as const;

export type AppConfig = typeof APP_CONFIG;

/** App name (overridable via /settings endpoint later). */
export const APP_NAME = "فروشگاه من";

/** App description for default metadata. */
export const APP_DESCRIPTION = "فروشگاه اینترنتی آنلاین — خرید آسان، با تحویل سریع و پرداخت امن";

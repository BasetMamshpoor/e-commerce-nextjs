/**
 * Shared API contract types
 * Mirror the conventions documented in api.md ("قراردادهای کلی").
 */

/** Standard success envelope returned by every endpoint. */
export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

/** Standard error envelope. `errors` only present on 400 (zod validation). */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: unknown;
}

/** Union type for type-narrowing in interceptors. */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/** Pagination meta returned by every paginated list endpoint. */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Standard paginated payload (data.items + data.meta). */
export interface PaginatedData<T> {
  items: T[];
  meta: PaginationMeta;
}

/** Standard paginated success response wrapper. */
export type PaginatedResponse<T> = ApiSuccessResponse<PaginatedData<T>>;

/** Query params shared by all paginated endpoints. */
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

/** Error thrown by axios interceptor after extracting backend message. */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly errors?: unknown;
  public readonly raw: unknown;

  constructor(
    message: string,
    options: {
      status: number;
      code?: string;
      errors?: unknown;
      raw?: unknown;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.errors = options.errors;
    this.raw = options.raw;
  }

  /** True if this is a network failure (no response from server). */
  get isNetworkError(): boolean {
    return this.status === 0;
  }

  /** True if user needs to authenticate. */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** True if user is authenticated but lacks permission. */
  get isForbidden(): boolean {
    return this.status === 403;
  }

  /** True if rate-limited. */
  get isRateLimited(): boolean {
    return this.status === 429;
  }

  /** True if user account is blocked (typically 403 with a specific message). */
  get isBlocked(): boolean {
    return this.status === 403 && /مسدود|blocked/i.test(this.message);
  }

  /** True if the resource was not found. */
  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** True if there's a conflict (duplicate, in-use, etc.). */
  get isConflict(): boolean {
    return this.status === 409;
  }
}

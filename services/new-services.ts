/**
 * NEW services for updated API: Stories, Newsletter, Search, Landing, Admin Notifications, Blog.
 */

import { http } from "@/lib/api-client";
import { buildMultipartFormData } from "@/lib/form-data-helper";
import { ENDPOINTS } from "@/api/endpoints";
import type {
  Story,
  NewsletterSubscriber,
  GlobalSearchResult,
  QuickSearchResult,
  MainSearchResult,
  LandingData,
  AdminNotification,
  PaginatedData,
  BlogPost,
  BlogCategory,
} from "@/types/domain";

/* ───────── Stories ───────── */
export const storiesService = {
  list: () => http.get<Story[]>(ENDPOINTS.stories.list),
  adminList: (params?: { page?: number; limit?: number }) =>
    http.get<PaginatedData<Story>>(ENDPOINTS.stories.adminList, params),
  create: (body: {
    title: string; coverImageMediaId?: number; videoMediaId?: number;
    expiresAt?: string; order?: number; productIds?: number[];
  }) => http.post<Story>(ENDPOINTS.stories.create, body),
  /** Create story with cover image + video upload (multipart/form-data). */
  createWithMedia: (body: {
    title: string; expiresAt?: string; order?: number; productIds?: number[];
  }, coverImage?: File, video?: File) => {
    const fd = buildMultipartFormData(body as unknown as Record<string, unknown>, {
      ...(coverImage ? { coverImage } : {}),
      ...(video ? { video } : {}),
    });
    return http.upload<Story>(ENDPOINTS.stories.create, fd);
  },
  update: (id: number, body: Partial<{
    title: string; coverImageMediaId: number; videoMediaId: number;
    expiresAt?: string; order?: number; productIds?: number[];
  }>) => http.put<Story>(ENDPOINTS.stories.update(id), body),
  /** Update story with cover image + video upload (multipart/form-data). */
  updateWithMedia: (id: number, body: {
    title: string; expiresAt?: string; order?: number; productIds?: number[];
  }, coverImage?: File, video?: File) => {
    const fd = buildMultipartFormData(body as unknown as Record<string, unknown>, {
      ...(coverImage ? { coverImage } : {}),
      ...(video ? { video } : {}),
    });
    return http.uploadPut<Story>(ENDPOINTS.stories.update(id), fd);
  },
  delete: (id: number) => http.delete<void>(ENDPOINTS.stories.delete(id)),
};

/* ───────── Newsletter ───────── */
export const newsletterService = {
  subscribe: (email: string) => http.post(ENDPOINTS.newsletter.subscribe, { email }),
  unsubscribe: (email: string) => http.post(ENDPOINTS.newsletter.unsubscribe, { email }),
  adminSubscribers: (params?: { page?: number; limit?: number }) =>
    http.get<PaginatedData<NewsletterSubscriber>>(ENDPOINTS.newsletter.adminSubscribers, params),
};

/* ───────── Search ───────── */
export const searchService = {
  global: (q: string) => http.get<GlobalSearchResult>(ENDPOINTS.search.global, { q }),
  quick: (q: string) => http.get<QuickSearchResult[]>(ENDPOINTS.search.quick, { q }),
  main: (params: {
    q: string; page?: number; limit?: number; sort?: string;
    minPrice?: number; maxPrice?: number; brandIds?: string;
    categoryIds?: string; inStock?: boolean; hasDiscount?: boolean;
  }) => http.get<MainSearchResult>(ENDPOINTS.search.main, params),
};

/* ───────── Landing Page ───────── */
export const landingService = {
  get: () => http.get<LandingData>(ENDPOINTS.landing.get),
};

/* ───────── Admin Notifications ───────── */
export const adminNotificationsService = {
  list: (params?: { page?: number; limit?: number; isRead?: boolean }) =>
    http.get<PaginatedData<AdminNotification>>(ENDPOINTS.adminNotifications.list, params),
  unreadCount: () => http.get<{ count: number }>(ENDPOINTS.adminNotifications.unreadCount),
  read: (id: number) => http.put<void>(ENDPOINTS.adminNotifications.read(id)),
  readAll: () => http.put<void>(ENDPOINTS.adminNotifications.readAll),
};

/* ───────── Blog ───────── */
export const blogService = {
  list: (params?: { page?: number; limit?: number; category?: string; search?: string }) =>
    http.get<PaginatedData<BlogPost>>(ENDPOINTS.blog.list, params),
  bySlug: (slug: string) => http.get<BlogPost>(ENDPOINTS.blog.bySlug(slug)),
  adminList: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    http.get<PaginatedData<BlogPost>>(ENDPOINTS.blog.adminList, params),
  create: (body: Partial<BlogPost> & { productIds?: number[] }) =>
    http.post<BlogPost>(ENDPOINTS.blog.create, body),
  /** Create blog post with cover image (multipart/form-data).
   * Fields sent flat with bracket notation for arrays + coverImage as file.
   */
  createWithCover: (body: Partial<BlogPost> & { productIds?: number[] }, coverImage: File) => {
    const fd = buildMultipartFormData(body as unknown as Record<string, unknown>, { coverImage });
    return http.upload<BlogPost>(ENDPOINTS.blog.create, fd);
  },
  update: (id: number, body: Partial<BlogPost> & { productIds?: number[] }) =>
    http.put<BlogPost>(ENDPOINTS.blog.update(id), body),
  /** Update blog post with cover image (multipart/form-data). */
  updateWithCover: (id: number, body: Partial<BlogPost> & { productIds?: number[] }, coverImage: File) => {
    const fd = buildMultipartFormData(body as unknown as Record<string, unknown>, { coverImage });
    return http.uploadPut<BlogPost>(ENDPOINTS.blog.update(id), fd);
  },
  delete: (id: number) => http.delete<void>(ENDPOINTS.blog.delete(id)),
  categories: () => http.get<BlogCategory[]>(ENDPOINTS.blog.categories),
  createCategory: (body: { name: string; slug?: string; description?: string }) =>
    http.post<BlogCategory>(ENDPOINTS.blog.createCategory, body),
  updateCategory: (id: number, body: Partial<{ name: string; slug: string; description: string }>) =>
    http.put<BlogCategory>(ENDPOINTS.blog.updateCategory(id), body),
  deleteCategory: (id: number) => http.delete<void>(ENDPOINTS.blog.deleteCategory(id)),
};

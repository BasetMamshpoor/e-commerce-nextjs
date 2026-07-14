/**
 * Comments API service (section 18 of api.md)
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type {
  Comment,
  CommentStatus,
  PaginatedData,
  ProductCommentsData,
} from "@/types/domain";

export interface CreateCommentBody {
  content: string;
  parentId?: string;
  rating?: number;
  attachmentMediaIds?: string[];
}

export const commentsService = {
  byProduct: (productId: string, params?: { page?: number; limit?: number }) =>
    http.get<ProductCommentsData>(ENDPOINTS.comments.byProduct(productId), params),

  create: (productId: string, body: CreateCommentBody) =>
    http.post<Comment>(ENDPOINTS.comments.create(productId), body),

  update: (id: string, body: { content: string }) =>
    http.put<Comment>(ENDPOINTS.comments.byId(id), body),

  delete: (id: string) => http.delete<void>(ENDPOINTS.comments.byId(id)),

  like: (id: string) =>
    http.post<{ liked: boolean; likeCount: number }>(ENDPOINTS.comments.like(id)),

  adminList: (params?: { page?: number; limit?: number; status?: CommentStatus }) =>
    http.get<PaginatedData<Comment>>(ENDPOINTS.comments.adminList, params),

  adminUpdate: (id: string, body: { status: CommentStatus }) =>
    http.put<Comment>(ENDPOINTS.comments.adminUpdate(id), body),
};

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { storiesService } from "@/services";
import { ApiError } from "@/types/api";
import type { Story } from "@/types/domain";

export const STORIES_QUERY_KEY = ["stories"] as const;

export function useStories() {
  return useQuery<Story[]>({
    queryKey: STORIES_QUERY_KEY,
    queryFn: () => storiesService.list(),
  });
}

export function useAdminStories() {
  return useQuery<Story[]>({
    queryKey: [...STORIES_QUERY_KEY, "admin"],
    queryFn: () => storiesService.adminList(),
  });
}

export function useCreateStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: storiesService.create,
    onSuccess: () => {
      toast.success("استوری ایجاد شد");
      qc.invalidateQueries({ queryKey: STORIES_QUERY_KEY });
    },
    onError: (e) => toast.error((e as ApiError).message || "ایجاد استوری ناموفق بود"),
  });
}

export function useUpdateStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof storiesService.update>[1] }) =>
      storiesService.update(id, body),
    onSuccess: () => {
      toast.success("استوری ویرایش شد");
      qc.invalidateQueries({ queryKey: STORIES_QUERY_KEY });
    },
    onError: (e) => toast.error((e as ApiError).message || "ویرایش استوری ناموفق بود"),
  });
}

export function useDeleteStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: storiesService.delete,
    onSuccess: () => {
      toast.success("استوری حذف شد");
      qc.invalidateQueries({ queryKey: STORIES_QUERY_KEY });
    },
    onError: (e) => toast.error((e as ApiError).message || "حذف استوری ناموفق بود"),
  });
}

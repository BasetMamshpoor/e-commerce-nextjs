"use client";

import { useQuery } from "@tanstack/react-query";

import { popupsService } from "@/services";
import type { Popup } from "@/types/domain";

/** Active popups (for display on home page load). */
export function usePopups() {
  return useQuery<Popup[]>({
    queryKey: ["popups", "active"],
    queryFn: () => popupsService.list(),
    staleTime: 5 * 60 * 1000,
  });
}

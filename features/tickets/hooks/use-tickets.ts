"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ticketsService } from "@/services";
import { ApiError } from "@/types/api";
import type {
  AddTicketMessageBody,
  CreateTicketBody,
  Ticket,
  TicketDepartment,
  TicketListQuery,
  PaginatedData,
} from "@/types/domain";
import { APP_CONFIG } from "@/constants/app";

export const TICKETS_QUERY_KEY = ["tickets"] as const;

/** List of support departments. */
export function useDepartments() {
  return useQuery<TicketDepartment[]>({
    queryKey: [...TICKETS_QUERY_KEY, "departments"],
    queryFn: () => ticketsService.departments(),
    staleTime: 10 * 60 * 1000,
  });
}

/** User's tickets (paginated, filterable by status). */
export function useTickets(query?: TicketListQuery) {
  return useQuery<PaginatedData<Ticket>>({
    queryKey: [...TICKETS_QUERY_KEY, "list", query ?? {}],
    queryFn: () => ticketsService.list({ limit: APP_CONFIG.defaultPageSize, ...query }),
    staleTime: 30 * 1000,
  });
}

/** Single ticket detail with messages. */
export function useTicketDetail(id: number | undefined) {
  return useQuery<Ticket>({
    queryKey: [...TICKETS_QUERY_KEY, "detail", id],
    queryFn: () => ticketsService.byId(id!),
    enabled: !!id,
    staleTime: 15 * 1000,
  });
}

/** Create a new ticket with first message and optional file attachments. */
export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ body, files }: { body: CreateTicketBody; files?: File[] }) =>
      files && files.length > 0
        ? ticketsService.createWithAttachments(body, files)
        : ticketsService.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...TICKETS_QUERY_KEY, "list"] });
      toast.success("تیکت شما ثبت شد", {
        description: "پشتیبانی در اسرع وقت پاسخ خواهد داد",
      });
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "ثبت تیکت ناموفق بود");
    },
  });
}

/** Add a message to a ticket (user side) with optional file attachments. */
export function useAddTicketMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      body,
      files,
    }: {
      id: number;
      body: AddTicketMessageBody;
      files?: File[];
    }) =>
      files && files.length > 0
        ? ticketsService.addMessageWithAttachments(id, body, files)
        : ticketsService.addMessage(id, body),
    onSuccess: (ticket) => {
      queryClient.setQueryData(
        [...TICKETS_QUERY_KEY, "detail", ticket.id],
        ticket,
      );
      queryClient.invalidateQueries({ queryKey: [...TICKETS_QUERY_KEY, "list"] });
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "ارسال پیام ناموفق بود");
    },
  });
}

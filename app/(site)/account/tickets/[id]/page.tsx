"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TicketChat } from "@/components/common/ticket-chat";
import { useTicketDetail, useAddTicketMessage } from "@/features/tickets/hooks";
import { ticketsService } from "@/services";
import type { Ticket } from "@/types/domain";

export default function UserTicketDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const numericId = Number(id);
  const { data: ticket, isLoading, refetch } = useTicketDetail(numericId);
  const addMessage = useAddTicketMessage();

  const handleSend = async (message: string, files?: File[]): Promise<Ticket> => {
    // Send message — if files, use multipart; else JSON
    if (files && files.length > 0) {
      const updated = await ticketsService.addMessageWithAttachments(numericId, { message }, files);
      // Backend returns empty messages array — must refetch
      await refetch();
      return updated;
    }
    const updated = await ticketsService.addMessage(numericId, { message });
    await refetch();
    return updated;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">تیکت پیدا نشد.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>بازگشت</Button>
      </div>
    );
  }

  const isClosed = ticket.status === "CLOSED";

  return (
    <TicketChat
      ticket={ticket}
      mode="user"
      onSendMessage={handleSend}
      sending={addMessage.isPending}
      isClosed={isClosed}
      headerActions={
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowRight className="size-5" />
        </Button>
      }
    />
  );
}

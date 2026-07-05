/**
 * Wallet API service — added withdrawals endpoints.
 */

import { http } from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { WalletData, WithdrawalRequest, PaginatedData } from "@/types/domain";

export const walletService = {
  get: (params?: { page?: number; limit?: number }) =>
    http.get<WalletData>(ENDPOINTS.wallet.get, params),

  chargeInitiate: (body: { amount: number; gatewaySlug: string }) =>
    http.post<{ transactionId: number; redirectUrl: string }>(ENDPOINTS.wallet.chargeInitiate, body),

  chargeVerify: (transactionId: number, body: { providerParams: Record<string, string> }) =>
    http.post<{ alreadyProcessed: boolean; balance: number }>(ENDPOINTS.wallet.chargeVerify(transactionId), body),

  requestWithdrawal: (body: { amount: number; description?: string }) =>
    http.post<WithdrawalRequest>(ENDPOINTS.wallet.withdrawals, body),

  myWithdrawals: (params?: { page?: number; limit?: number }) =>
    http.get<PaginatedData<WithdrawalRequest>>(ENDPOINTS.wallet.withdrawals, params),

  adminWithdrawals: (params?: { page?: number; limit?: number; status?: string }) =>
    http.get<PaginatedData<WithdrawalRequest>>(ENDPOINTS.wallet.adminWithdrawals, params),

  adminReviewWithdrawal: (id: number, body: { status: "APPROVED" | "REJECTED"; adminNote?: string }) =>
    http.put<WithdrawalRequest>(ENDPOINTS.wallet.adminReviewWithdrawal(id), body),
};

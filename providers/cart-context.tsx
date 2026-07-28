"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import {
  getGuestToken,
  setGuestToken,
  http,
} from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import type { Cart } from "@/types/domain";

/* ──────────────────────────────────────────────────────────────────────────
   Cart context
   ────────────────────────────────────────────────────────────────────────── */

interface CartContextValue {
  itemCount: number;
  /** Sync the X-Guest-Token header for anonymous users after first cart response. */
  syncGuestToken: (token?: string) => void;
}

const CartContext = React.createContext<CartContextValue | null>(null);

export const CART_QUERY_KEY = ["cart"] as const;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { status, data: session } = useSession();
  const isAuthenticated = status === "authenticated" && !!session?.user;
  const queryClient = useQueryClient();
  const [itemCount, setItemCount] = React.useState(0);

  // Subscribe to cart query cache to keep badge count in sync.
  React.useEffect(() => {
    const unsub = queryClient.getQueryCache().subscribe((event) => {
      if (event.query.queryKey[0] === "cart") {
        const data = queryClient.getQueryData<Cart>(CART_QUERY_KEY);
        setItemCount(data?.itemCount ?? 0);
      }
    });
    return unsub;
  }, [queryClient]);

  // After login, merge guest cart into user cart.
  React.useEffect(() => {
    if (!isAuthenticated) return;
    const guestToken = getGuestToken();
    if (!guestToken) return;
    http
      .post<{ cart: Cart }>(ENDPOINTS.cart.merge, { guestToken })
      .then((response) => {
        queryClient.setQueryData(CART_QUERY_KEY, response.cart);
        // Clear guest token after merge.
        setGuestToken("");
      })
      .catch(() => {
        // Silent fail.
      });
  }, [isAuthenticated, queryClient]);

  const syncGuestToken = React.useCallback((token?: string) => {
    if (token && !getGuestToken()) setGuestToken(token);
  }, []);

  const value = React.useMemo<CartContextValue>(
    () => ({ itemCount, syncGuestToken }),
    [itemCount, syncGuestToken],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

/** Helper: optimistically update cart in cache. */
export function setCartCache(
  queryClient: ReturnType<typeof useQueryClient>,
  cart: Cart,
) {
  queryClient.setQueryData(CART_QUERY_KEY, cart);
}

/** Helper: extract guest token from a CartResponse and persist if new. */
export function captureGuestTokenFromCartResponse(res: {
  cart: Cart;
  wasAdjusted?: boolean;
  guestToken?: string;
}) {
  if (res.guestToken && !getGuestToken()) setGuestToken(res.guestToken);
}

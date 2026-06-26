"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  getGuestToken,
  setGuestToken,
} from "@/lib/api-client";
import { ENDPOINTS } from "@/api/endpoints";
import { http } from "@/lib/api-client";
import type { Cart, CartResponse } from "@/types/domain";
import { useAuth } from "./auth-context";

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
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [itemCount, setItemCount] = React.useState(0);

  // Bootstrap guest token if missing (so first /cart request can be associated).
  React.useEffect(() => {
    if (!getGuestToken()) {
      // We don't generate one locally — backend will create one on first request
      // and return it in `data.guestToken`. We'll capture it from responses below.
    }
  }, []);

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
      .post<Cart>(ENDPOINTS.cart.merge, { guestToken })
      .then((cart) => {
        queryClient.setQueryData(CART_QUERY_KEY, cart);
        setGuestToken(""); // clear after successful merge
        if (typeof window !== "undefined") {
          localStorage.removeItem("sf_guest");
        }
      })
      .catch(() => {
        // Silently fail — user can still browse; cart will refresh on next /cart GET.
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

/** Helper: optimistically update cart in cache (used by add/update/delete mutations). */
export function setCartCache(
  queryClient: ReturnType<typeof useQueryClient>,
  cart: Cart,
) {
  queryClient.setQueryData(CART_QUERY_KEY, cart);
}

/** Helper: extract guest token from a CartResponse and persist if new. */
export function captureGuestTokenFromCartResponse(res: CartResponse) {
  if (res.guestToken && !getGuestToken()) {
    setGuestToken(res.guestToken);
  }
}

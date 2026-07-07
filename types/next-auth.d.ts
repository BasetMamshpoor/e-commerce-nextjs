import type { DefaultSession } from "next-auth";
import type { User as DomainUser } from "@/types/domain";

/**
 * NextAuth type augmentations.
 * Adds accessToken, error, and custom user fields to the Session.
 */

declare module "next-auth" {
  interface Session {
    user: DomainUser & DefaultSession["user"];
    accessToken?: string;
    error?: "RefreshAccessTokenError";
  }

  interface User {
    accessToken?: string;
    refreshToken?: string;
    sessionId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user?: DomainUser;
    accessToken?: string;
    refreshToken?: string;
    sessionId?: string;
    expiresAt?: number;
    error?: "RefreshAccessTokenError";
  }
}

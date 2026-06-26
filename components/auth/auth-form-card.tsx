"use client";

import * as React from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { APP_NAME } from "@/constants/app";
import { cn } from "@/lib/utils";

interface AuthFormCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Optional link to go back to home. */
  showHomeLink?: boolean;
  className?: string;
}

/** Shared layout for all auth pages (login, register, verify-otp, ...). */
export function AuthFormCard({
  title,
  description,
  children,
  footer,
  showHomeLink = true,
  className,
}: AuthFormCardProps) {
  return (
    <div className={cn("mx-auto w-full max-w-md", className)}>
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-3 text-center">
          {showHomeLink && (
            <Link
              href="/"
              className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform hover:scale-105"
              aria-label={APP_NAME}
            >
              <ShoppingBag className="size-6" />
            </Link>
          )}
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
        {footer && <CardFooter className="justify-center">{footer}</CardFooter>}
      </Card>
    </div>
  );
}

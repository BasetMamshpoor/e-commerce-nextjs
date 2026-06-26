/**
 * Zod validation schemas for Auth forms.
 * Mirrors backend rules documented in api.md section 1.
 *
 * Key rules from API.md:
 *   - Password: min 8 chars, at least 1 letter + 1 digit
 *   - Identifier: email OR Iranian mobile (09xxxxxxxxx / +98 / 0098 prefixes)
 */

import { z } from "zod";

import {
  isValidEmail,
  isValidIranMobile,
  toEnglishDigits,
} from "@/utils/format";

/**
 * Identifier can be either an email or an Iranian mobile.
 * Backend auto-detects the channel (SMS vs Email) from the format.
 */
export const identifierSchema = z
  .string()
  .min(1, "این فیلد الزامی است")
  .transform((v) => v.trim())
  .refine((v) => isValidEmail(v) || isValidIranMobile(v), {
    message: "ایمیل یا شماره موبایل معتبر وارد کنید",
  });

/**
 * Password: backend requires min 8 chars with at least 1 letter + 1 digit.
 */
export const passwordSchema = z
  .string()
  .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد")
  .refine((v) => /[a-zA-Z]/.test(v) && /\d/.test(v), {
    message: "رمز عبور باید شامل حداقل یک حرف و یک عدد باشد",
  });

export const loginSchema = z.object({
  identifier: identifierSchema,
  password: passwordSchema,
  deviceName: z.string().optional(),
});

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(3, "نام و نام خانوادگی باید حداقل ۳ کاراکتر باشد")
    .max(100, "نام و نام خانوادگی نباید بیش از ۱۰۰ کاراکتر باشد"),
  identifier: identifierSchema,
  password: passwordSchema,
  /** User must accept terms to register. */
  terms: z.literal(true, {
    message: "برای ادامه باید قوانین و مقررات را بپذیرید",
  }),
});

export const otpSchema = z.object({
  identifier: z.string().min(1),
  code: z
    .string()
    .min(5, "کد تایید باید ۵ رقم باشد")
    .max(5, "کد تایید باید ۵ رقم باشد")
    .transform((v) => toEnglishDigits(v))
    .refine((v) => /^\d{5}$/.test(v), {
      message: "کد تایید باید فقط عدد باشد",
    }),
  deviceName: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  identifier: identifierSchema,
});

export const resetPasswordSchema = z.object({
  identifier: identifierSchema,
  code: z
    .string()
    .min(5, "کد تایید باید ۵ رقم باشد")
    .max(5, "کد تایید باید ۵ رقم باشد")
    .transform((v) => toEnglishDigits(v))
    .refine((v) => /^\d{5}$/.test(v), {
      message: "کد تایید باید فقط عدد باشد",
    }),
  newPassword: passwordSchema,
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type OtpValues = z.infer<typeof otpSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

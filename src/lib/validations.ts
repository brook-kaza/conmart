// =============================================================================
// ConMart — Zod Validation Schemas
// =============================================================================
// Centralized validation schemas used across forms and server actions.
// Localized for Ethiopian market (phone format, currency, etc.)
// =============================================================================

import { z } from "zod";

// =============================================================================
// AUTH SCHEMAS
// =============================================================================

/** Login form validation */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});
export type LoginFormData = z.infer<typeof loginSchema>;

/** Registration form validation */
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /[A-Z]/,
      "Password must contain at least one uppercase letter"
    )
    .regex(
      /[a-z]/,
      "Password must contain at least one lowercase letter"
    )
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^\+251\s?\d{2}\s?\d{3}\s?\d{4}$/,
      "Enter a valid Ethiopian phone number (e.g., +251 91 234 5678)"
    ),
  companyName: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(200, "Company name must be less than 200 characters"),
  role: z.enum(["BUYER", "SELLER", "ADMIN"], {
    error: "Please select a role",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
export type RegisterFormData = z.infer<typeof registerSchema>;

// =============================================================================
// PRICE TIER SCHEMAS
// =============================================================================

/** Price tier form validation (Seller dashboard) */
export const priceTierSchema = z.object({
  minQty: z
    .number()
    .int("Minimum quantity must be a whole number")
    .positive("Minimum quantity must be positive"),
  maxQty: z
    .number()
    .int("Maximum quantity must be a whole number")
    .positive("Maximum quantity must be positive"),
  unitPrice: z
    .number()
    .positive("Unit price must be positive")
    .multipleOf(0.01, "Unit price can have at most 2 decimal places"),
  validUntil: z
    .string()
    .min(1, "Expiry date is required")
    .refine(
      (dateStr) => new Date(dateStr) > new Date(),
      "Expiry date must be in the future"
    ),
}).refine((data) => data.maxQty >= data.minQty, {
  message: "Maximum quantity must be greater than or equal to minimum quantity",
  path: ["maxQty"],
});
export type PriceTierFormData = z.infer<typeof priceTierSchema>;

// =============================================================================
// PROFORMA / ORDER SCHEMAS
// =============================================================================

/** Proforma generation request validation */
export const generateProformaSchema = z.object({
  listingId: z.string().min(1, "Listing ID is required"),
  qty: z
    .number()
    .int("Quantity must be a whole number")
    .positive("Quantity must be positive"),
});
export type GenerateProformaData = z.infer<typeof generateProformaSchema>;

/** Order status update validation (Admin only) */
export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  newStatus: z.enum([
    "GENERATED",
    "CALL_RECEIVED",
    "PROCURED",
    "IN_TRANSIT",
    "DELIVERED",
    "CANCELLED",
  ]),
});
export type UpdateOrderStatusData = z.infer<typeof updateOrderStatusSchema>;

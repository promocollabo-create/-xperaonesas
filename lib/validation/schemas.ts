import { z } from "zod";

export const checkoutSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  email: z.string().email("Enter a valid email address."),
  phone: z.string().min(5, "Enter a valid phone number."),
  country: z.string().min(2, "Select your country."),
  billingAddress: z.string().optional(),
  notes: z.string().optional()
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const paymentProofSchema = z.object({
  orderNumber: z.string().min(1),
  transactionId: z.string().min(1, "Transaction ID is required."),
  paymentReference: z.string().optional(),
  paymentMethod: z.string().min(1, "Select the payment method you used."),
  paymentDate: z.string().min(1, "Payment date is required."),
  amount: z.coerce.number().positive("Enter the amount you paid.")
});
export type PaymentProofInput = z.infer<typeof paymentProofSchema>;

export const ALLOWED_PROOF_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const MAX_PROOF_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const trackOrderSchema = z.object({
  orderNumber: z.string().min(1, "Enter your order number."),
  email: z.string().email("Enter the email used at checkout.")
});

export const rejectPaymentSchema = z.object({
  orderNumber: z.string().min(1),
  reason: z.string().min(5, "Provide a reason for the customer.")
});

export const productSchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only."),
  short_description: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().nonnegative(),
  sale_price: z.coerce.number().nonnegative().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  license: z.string().optional(),
  is_new: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  tags: z.array(z.string()).optional()
});

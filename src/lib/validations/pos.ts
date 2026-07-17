import { z } from "zod";

export const cartItemSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().nullable().optional(),
  name: z.string(),
  unit_price: z.coerce.number().nonnegative(),
  quantity: z.coerce.number().int().positive(),
  tax_rate: z.coerce.number().nonnegative().default(0),
  discount_amount: z.coerce.number().nonnegative().default(0),
  notes: z.string().optional().default(""),
  addons: z
    .array(z.object({ id: z.string(), name: z.string(), price: z.coerce.number() }))
    .default([]),
});

export const checkoutSchema = z.object({
  branch_id: z.string().uuid(),
  order_type: z.enum(["dine_in", "take_away", "delivery"]),
  table_number: z.string().optional(),
  customer_id: z.string().uuid().nullable().optional(),
  payment_method: z.enum(["cash", "card", "wallet", "bank_transfer", "split"]),
  amount_paid: z.coerce.number().nonnegative(),
  discount_amount: z.coerce.number().nonnegative().default(0),
  notes: z.string().optional().default(""),
  items: z.array(cartItemSchema).min(1, "Cart is empty"),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export type UserRole = "owner" | "admin" | "manager" | "cashier" | "kitchen";

export type OrderType = "dine_in" | "take_away" | "delivery";
export type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";
export type PaymentMethod = "cash" | "card" | "wallet" | "bank_transfer" | "split";
export type PaymentStatus = "unpaid" | "partial" | "paid" | "refunded" | "partial_refund";

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  currency: string;
  tax_rate: number;
  service_charge_rate: number;
  is_active: boolean;
}

export interface AppUser {
  id: string;
  branch_id: string | null;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
}

export interface Category {
  id: string;
  branch_id: string | null;
  name: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  branch_id: string | null;
  category_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  base_price: number;
  cost_price: number;
  tax_rate: number;
  is_active: boolean;
  track_inventory: boolean;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price_delta: number;
  is_default: boolean;
}

export interface CartLineAddon {
  id: string;
  name: string;
  price: number;
}

export interface CartLine {
  key: string;
  product_id: string;
  variant_id: string | null;
  name: string;
  unit_price: number;
  quantity: number;
  addons: CartLineAddon[];
  notes: string;
}

export interface Sale {
  id: string;
  branch_id: string;
  order_number: string;
  customer_id: string | null;
  cashier_id: string | null;
  order_type: OrderType;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  service_charge_amount: number;
  total_amount: number;
  created_at: string;
}

export interface DashboardMetrics {
  todaySales: number;
  weekSales: number;
  monthSales: number;
  yearSales: number;
  ordersToday: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  lowStockCount: number;
  inventoryWorth: number;
}

/**
 * Placeholder for `supabase gen types typescript --project-id <id>` output.
 * Replace this with the generated Database type once the project is linked;
 * every query in this codebase is written against that shape.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;

"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Search, Plus, Minus, Trash2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { cn, formatCurrency } from "@/lib/utils";
import { checkoutAction } from "@/lib/actions/pos";
import type { CartLine } from "@/lib/types/database";

interface Category {
  id: string;
  name: string;
}
interface Product {
  id: string;
  category_id: string | null;
  name: string;
  base_price: number;
  tax_rate: number;
}

const ORDER_TYPES = [
  { value: "dine_in", label: "Dine In" },
  { value: "take_away", label: "Take Away" },
  { value: "delivery", label: "Delivery" },
] as const;

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "wallet", label: "Wallet" },
] as const;

export function PosTerminal({
  branchId,
  categories,
  products,
}: {
  branchId: string;
  categories: Category[];
  products: Product[];
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orderType, setOrderType] = useState<(typeof ORDER_TYPES)[number]["value"]>("dine_in");
  const [tableNumber, setTableNumber] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] =
    useState<(typeof PAYMENT_METHODS)[number]["value"]>("cash");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = activeCategory === "all" || p.category_id === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, search]);

  const productTaxRateById = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p.tax_rate])),
    [products]
  );

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.product_id === product.id && !l.variant_id);
      if (existing) {
        return prev.map((l) =>
          l.key === existing.key ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...prev,
        {
          key: `${product.id}-${Date.now()}`,
          product_id: product.id,
          variant_id: null,
          name: product.name,
          unit_price: product.base_price,
          quantity: 1,
          addons: [],
          notes: "",
        },
      ];
    });
  }

  function updateQuantity(key: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    );
  }

  function removeLine(key: string) {
    setCart((prev) => prev.filter((l) => l.key !== key));
  }

  const subtotal = cart.reduce((sum, l) => sum + l.unit_price * l.quantity, 0);
  const taxAmount = cart.reduce(
    (sum, l) => sum + l.unit_price * l.quantity * ((productTaxRateById[l.product_id] ?? 0) / 100),
    0
  );
  const total = Math.max(0, subtotal + taxAmount - discount);
  const change = Math.max(0, Number(amountPaid || 0) - total);

  function handleCheckout() {
    if (cart.length === 0) {
      toast.error("Add at least one item to the cart");
      return;
    }
    if (orderType === "dine_in" && !tableNumber) {
      toast.error("Enter a table number for dine-in orders");
      return;
    }
    const paid = Number(amountPaid || 0);
    if (paid < total) {
      toast.error("Amount paid is less than the order total");
      return;
    }

    startTransition(async () => {
      const result = await checkoutAction({
        branch_id: branchId,
        order_type: orderType,
        table_number: orderType === "dine_in" ? tableNumber : undefined,
        customer_id: null,
        payment_method: paymentMethod,
        amount_paid: paid,
        discount_amount: discount,
        notes: "",
        items: cart.map((l) => ({
          product_id: l.product_id,
          variant_id: l.variant_id,
          name: l.name,
          unit_price: l.unit_price,
          quantity: l.quantity,
          tax_rate: productTaxRateById[l.product_id] ?? 0,
          discount_amount: 0,
          notes: l.notes,
          addons: l.addons,
        })),
      });

      if (!result.success) {
        toast.error(result.error ?? "Checkout failed");
        return;
      }

      toast.success(`Order ${result.data?.orderNumber} completed`);
      setCart([]);
      setDiscount(0);
      setAmountPaid("");
      setTableNumber("");
    });
  }

  return (
    <div className="grid h-[calc(100vh-8.5rem)] grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
      {/* Product grid */}
      <div className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-card">
        <div className="border-b border-border p-4">
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory("all")}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                activeCategory === "all" ? "bg-primary text-white" : "bg-muted-bg text-muted"
              )}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  activeCategory === c.id ? "bg-primary text-white" : "bg-muted-bg text-muted"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3 xl:grid-cols-4 auto-rows-min">
          {filteredProducts.length === 0 && (
            <p className="col-span-full py-10 text-center text-muted">No products match.</p>
          )}
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="flex flex-col items-start rounded-[var(--radius-card)] border border-border bg-background p-3 text-left transition-transform hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-2 flex h-16 w-full items-center justify-center rounded-lg bg-muted-bg text-2xl">
                🍽️
              </div>
              <span className="line-clamp-2 text-sm font-medium">{product.name}</span>
              <span className="mt-1 text-sm font-semibold text-primary">
                {formatCurrency(product.base_price)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-card">
        <div className="border-b border-border p-4">
          <div className="mb-3 flex gap-2">
            {ORDER_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setOrderType(t.value)}
                className={cn(
                  "flex-1 rounded-[var(--radius-card)] border px-2 py-1.5 text-xs font-medium transition-colors",
                  orderType === t.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          {orderType === "dine_in" && (
            <Input
              placeholder="Table number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
            />
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">Cart is empty — tap a product to add it.</p>
          ) : (
            <ul className="space-y-3">
              {cart.map((line) => (
                <li key={line.key} className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{line.name}</p>
                    <p className="text-xs text-muted">{formatCurrency(line.unit_price)} each</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(line.key, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-muted-bg"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-5 text-center text-sm font-medium">{line.quantity}</span>
                    <button
                      onClick={() => updateQuantity(line.key, 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-muted-bg"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      onClick={() => removeLine(line.key)}
                      className="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-danger hover:bg-danger/10"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2 border-t border-border p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Tax</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Discount</span>
            <Input
              type="number"
              min={0}
              value={discount || ""}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              className="h-7 w-24 text-right"
            />
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>

          <div className="flex gap-2 pt-1">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setPaymentMethod(m.value)}
                className={cn(
                  "flex-1 rounded-[var(--radius-card)] border px-2 py-1.5 text-xs font-medium",
                  paymentMethod === m.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          <Input
            type="number"
            placeholder="Amount received"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
          />
          {Number(amountPaid || 0) > 0 && (
            <div className="flex justify-between text-xs text-muted">
              <span>Change due</span>
              <Badge variant={change > 0 ? "success" : "neutral"}>{formatCurrency(change)}</Badge>
            </div>
          )}

          <Button className="w-full" size="lg" onClick={handleCheckout} disabled={isPending}>
            {isPending && <Loader2 size={16} className="animate-spin" />}
            Charge {formatCurrency(total)}
          </Button>
        </div>
      </div>
    </div>
  );
}

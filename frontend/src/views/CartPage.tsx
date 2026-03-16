import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { api, ApiError } from "../lib/api";
import { formatCurrency } from "../lib/format";
import { useCartStore } from "../stores/cartStore";
import { useToastStore } from "../stores/toastStore";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

type Order = { id: number };

export function CartPage() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const setQty = useCartStore((s) => s.setQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);
  const pushToast = useToastStore((s) => s.push);

  const total = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  const createOrderMutation = useMutation({
    mutationFn: () =>
      api<Order>("/orders", {
        method: "POST",
        body: { items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })) },
      }),
    onSuccess: (order) => {
      pushToast({ kind: "success", title: "Order created", message: `Order #${order.id}` });
      clear();
      navigate(`/checkout?orderId=${order.id}`);
    },
    onError: (e) => {
      const message = e instanceof ApiError ? e.message : "Order creation failed";
      pushToast({ kind: "error", title: "Could not create order", message });
    },
  });

  return (
    <div className="mx-auto max-w-6xl page-stack">
      <div className="page-header">
        <div>
          <div className="eyebrow">Cart</div>
          <h1 className="section-title mt-5 text-4xl md:text-5xl">A cleaner review step before checkout.</h1>
          <p className="section-copy mt-4">Pricing, quantity controls, and the checkout action are now separated clearly so the next click is obvious.</p>
        </div>
        <div className="rounded-[20px] border border-[#E2E8F0] bg-white px-5 py-4 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
          <div className="metric-label">Cart total</div>
          <div className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#0F172A]">{formatCurrency(total)}</div>
          <div className="mt-2 text-sm text-[#64748B]">{itemCount} items ready for checkout</div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {items.length === 0 ? (
          <Card className="p-10 xl:col-span-2">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-3xl bg-[#EFF6FF] p-4 text-[#0B5FFF]">
                <ShoppingBag size={24} />
              </div>
              <div className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-[#0F172A]">Your cart is empty</div>
              <div className="mt-2 max-w-md text-sm leading-6 text-[#64748B]">Start from the products page and the order summary will stay visible as you build the basket.</div>
              <Link to="/products" className="mt-6">
                <Button>Browse products</Button>
              </Link>
            </div>
          </Card>
        ) : null}

        {items.length ? (
          <>
            <div className="grid gap-4">
              {items.map((item) => (
                <Card key={item.productId} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-5">
                    <div>
                      <div className="text-lg font-semibold text-[#0F172A]">{item.name}</div>
                      <div className="mt-2 text-sm text-[#64748B]">{formatCurrency(item.price)} each</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setQty(item.productId, Math.max(1, item.quantity - 1))}
                        >
                          <Minus size={16} />
                        </Button>
                        <div className="w-10 text-center text-sm font-semibold text-[#0F172A]">{item.quantity}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setQty(item.productId, Math.min(99, item.quantity + 1))}
                        >
                          <Plus size={16} />
                        </Button>
                      </div>
                      <div className="min-w-28 text-right">
                        <div className="text-sm text-[#64748B]">Line total</div>
                        <div className="mt-1 text-lg font-semibold text-[#0F172A]">{formatCurrency(item.price * item.quantity)}</div>
                      </div>
                      <Button variant="secondary" onClick={() => removeItem(item.productId)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="h-fit p-6 xl:sticky xl:top-28">
              <div className="metric-label">Order summary</div>
              <div className="mt-4 rounded-[20px] bg-[#F8FAFC] p-5">
                <div className="flex items-center justify-between text-sm text-[#64748B]">
                  <span>Items</span>
                  <span>{itemCount}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-[#64748B]">
                  <span>Subtotal</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="mt-4 border-t border-[#E2E8F0] pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#0F172A]">Total</span>
                    <span className="text-3xl font-semibold tracking-[-0.03em] text-[#0F172A]">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                <Button
                  size="lg"
                  loading={createOrderMutation.isPending}
                  disabled={!items.length || createOrderMutation.isPending}
                  onClick={() => {
                    createOrderMutation.mutate();
                  }}
                >
                  {createOrderMutation.isPending ? "Creating order" : "Checkout"}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  disabled={!items.length}
                  onClick={() => {
                    clear();
                    pushToast({ kind: "info", title: "Cart cleared" });
                  }}
                >
                  Clear cart
                </Button>
                <Link to="/products">
                  <Button variant="ghost" className="w-full">
                    Continue shopping
                  </Button>
                </Link>
              </div>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}

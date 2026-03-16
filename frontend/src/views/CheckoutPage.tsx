import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, ApiError } from "../lib/api";
import { getEnv, isTruthyEnv } from "../lib/env";
import { loadRazorpayCheckout } from "../lib/razorpay";
import { useAuthStore } from "../stores/authStore";
import { useToastStore } from "../stores/toastStore";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

type Order = {
  id: number;
  total_amount: number;
  status: string;
  items: { id: number; product_id: number; quantity: number; unit_price: number }[];
};

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayPrefill = {
  name: string;
  email: string;
};

type RazorpayOptions = {
  key: string;
  name: string;
  description: string;
  order_id: string;
  amount: number;
  currency: string;
  prefill?: RazorpayPrefill;
  theme: { color: string };
  handler: (response: RazorpayResponse) => Promise<void>;
  modal: { ondismiss: () => void };
};

export function CheckoutPage() {
  const [params] = useSearchParams();
  const orderId = Number(params.get("orderId"));
  const user = useAuthStore((s) => s.user);
  const pushToast = useToastStore((s) => s.push);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const orderQuery = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => api<Order>(`/orders/${orderId}`),
    enabled: Number.isFinite(orderId) && orderId > 0,
  });

  const createPaymentOrderMutation = useMutation({
    mutationFn: () =>
      api<{ razorpay_order_id: string; amount: number; currency: string }>(`/payments/create-order`, {
        method: "POST",
        body: { order_id: orderId },
      }),
  });

  const verifyMutation = useMutation({
    mutationFn: (payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
      api<void>(`/payments/verify-checkout`, { method: "POST", body: payload }),
  });

  const canPay = useMemo(() => orderQuery.data?.status === "pending", [orderQuery.data?.status]);
  const isDemoMode =
    isTruthyEnv("VITE_DEMO_PAYMENT_MODE", true) ||
    !getEnv("VITE_RAZORPAY_KEY_ID") ||
    getEnv("VITE_RAZORPAY_KEY_ID", "")!.includes("xxxxxxxx");

  async function onPay() {
    try {
      if (!orderQuery.data) throw new Error("Order not loaded");

      const rp = await createPaymentOrderMutation.mutateAsync();

      if (isDemoMode) {
        await verifyMutation.mutateAsync({
          razorpay_order_id: rp.razorpay_order_id,
          razorpay_payment_id: `demo_payment_${orderId}`,
          razorpay_signature: "demo_signature",
        });
        await queryClient.invalidateQueries({ queryKey: ["order", orderId] });
        await queryClient.invalidateQueries({ queryKey: ["orders"] });
        pushToast({
          kind: "success",
          title: "Demo payment completed",
          message: "Order marked as paid in local demo mode.",
        });
        navigate("/orders");
        return;
      }

      const keyId = getEnv("VITE_RAZORPAY_KEY_ID");
      if (!keyId) throw new Error("Missing VITE_RAZORPAY_KEY_ID");

      await loadRazorpayCheckout();

      const Razorpay = window.Razorpay;
      if (!Razorpay) throw new Error("Razorpay checkout is unavailable");

      const options: RazorpayOptions = {
        key: keyId,
        name: "Target Commerce",
        description: `Order #${orderId}`,
        order_id: rp.razorpay_order_id,
        amount: rp.amount,
        currency: rp.currency,
        prefill: user ? { name: user.name, email: user.email } : undefined,
        theme: { color: "#0B5FFF" },
        handler: async (response: RazorpayResponse) => {
          await verifyMutation.mutateAsync({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          await queryClient.invalidateQueries({ queryKey: ["order", orderId] });
          await queryClient.invalidateQueries({ queryKey: ["orders"] });
          pushToast({ kind: "success", title: "Payment verified", message: "Order marked as paid." });
          navigate("/orders");
        },
        modal: {
          ondismiss: () => pushToast({ kind: "info", title: "Checkout closed" }),
        },
      };
      const rzp = new Razorpay(options);
      rzp.open();
    } catch (e) {
      const message = e instanceof ApiError ? e.message : (e as Error).message;
      pushToast({ kind: "error", title: "Payment failed", message });
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="font-display text-3xl leading-tight">Checkout</div>
          <div className="mt-2 text-sm text-paper-200/70">
            {isDemoMode
              ? "Complete your order instantly in local demo mode."
              : "Complete your order with Razorpay test mode and instant payment confirmation."}
          </div>
        </div>
        {orderQuery.data ? (
          <div className="rounded-2xl bg-ink-800/40 p-4 ring-1 ring-paper-200/12">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-paper-200/55">Order</div>
            <div className="mt-1 font-display text-2xl">#{orderQuery.data.id}</div>
          </div>
        ) : null}
      </div>

      <div className="mt-7 grid gap-4">
        {orderQuery.isLoading ? <div className="text-sm text-paper-200/70">Loading…</div> : null}
        {orderQuery.isError ? <div className="text-sm text-red-300">Could not load order.</div> : null}

        {orderQuery.data ? (
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-paper-200/55">Status</div>
                <div className="mt-2 font-display text-2xl">{orderQuery.data.status}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-paper-200/55">Total</div>
                <div className="mt-2 font-display text-4xl">₹{orderQuery.data.total_amount}</div>
              </div>
            </div>

            <div className="mt-6 border-t border-paper-200/10 pt-5">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-paper-200/55">Items</div>
              <div className="mt-3 grid gap-2">
                {orderQuery.data.items.map((i) => (
                  <div
                    key={i.id}
                    className="flex items-center justify-between rounded-xl bg-ink-900/30 px-4 py-3 ring-1 ring-paper-200/10"
                  >
                    <div className="text-sm text-paper-200/80">Product #{i.product_id}</div>
                    <div className="text-sm text-paper-200/70">
                      ₹{i.unit_price} × {i.quantity}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Button variant="ghost" onClick={() => navigate("/orders")}>
                View orders
              </Button>
              <Button
                disabled={!canPay || createPaymentOrderMutation.isPending || verifyMutation.isPending}
                onClick={onPay}
              >
                {orderQuery.data.status !== "pending"
                  ? "Already paid"
                  : createPaymentOrderMutation.isPending
                    ? "Preparing Razorpay…"
                    : verifyMutation.isPending
                      ? "Verifying…"
                      : "Pay with Razorpay"}
              </Button>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";

import { api } from "../lib/api";
import { formatCurrency, formatDateTime } from "../lib/format";
import { Card } from "../ui/Card";

type Order = {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  items: { id: number; product_id: number; quantity: number; unit_price: number }[];
};

export function OrdersPage() {
  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: () => api<Order[]>(`/orders`),
  });

  const orders = ordersQuery.data ?? [];
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const paidCount = orders.filter((order) => order.status === "paid").length;
  const pendingCount = orders.filter((order) => order.status === "pending").length;

  return (
    <div className="mx-auto max-w-6xl page-stack">
      <div>
        <div className="eyebrow">Orders</div>
        <h1 className="section-title mt-5 text-4xl md:text-5xl">Readable order tracking with clear status states.</h1>
        <p className="section-copy mt-4">Each order is now grouped into a scannable card with a dedicated status badge, timestamp, total, and line-item breakdown.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="metric-card">
          <div className="metric-label">Revenue</div>
          <div className="metric-value">{formatCurrency(totalRevenue)}</div>
          <div className="metric-note">sum of visible orders</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Paid orders</div>
          <div className="metric-value">{paidCount}</div>
          <div className="metric-note">already captured successfully</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Pending orders</div>
          <div className="metric-value">{pendingCount}</div>
          <div className="metric-note">awaiting payment or confirmation</div>
        </div>
      </section>

      <div className="grid gap-4">
        {ordersQuery.isLoading ? <div className="text-sm text-[#64748B]">Loading orders...</div> : null}
        {ordersQuery.isError ? <div className="text-sm text-[#DC2626]">Could not load orders.</div> : null}
        {orders.map((order) => (
          <Card key={order.id} className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <div className="metric-label">Order</div>
                <div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#0F172A]">#{order.id}</div>
                <div className="mt-2 text-sm text-[#64748B]">{formatDateTime(order.created_at)}</div>
              </div>
              <div className="text-right">
                <div className="metric-label">Total</div>
                <div className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#0F172A]">{formatCurrency(order.total_amount)}</div>
                <div className="mt-3">
                  <span
                    className="status-badge"
                    data-status={order.status === "paid" ? "paid" : order.status === "pending" ? "pending" : "default"}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-[#E2E8F0] pt-5">
              <div className="grid gap-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-[18px] bg-[#F8FAFC] px-4 py-4">
                    <div>
                      <div className="text-sm font-semibold text-[#0F172A]">Product #{item.product_id}</div>
                      <div className="mt-1 text-sm text-[#64748B]">{item.quantity} quantity</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-[#0F172A]">{formatCurrency(item.unit_price * item.quantity)}</div>
                      <div className="mt-1 text-sm text-[#64748B]">{formatCurrency(item.unit_price)} each</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}

        {ordersQuery.data && !orders.length ? (
          <Card className="p-8">
            <div className="text-sm text-[#64748B]">No orders yet. Create one from your cart to start the payment flow.</div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

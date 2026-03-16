import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Boxes, CircleDollarSign, PackagePlus, Plus, ReceiptText, Sparkles } from "lucide-react";

import { api, ApiError } from "../lib/api";
import { formatCompactNumber, formatCurrency, formatDateTime } from "../lib/format";
import { useAuthStore } from "../stores/authStore";
import { useToastStore } from "../stores/toastStore";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  created_by: number;
  created_at: string;
};

type Order = {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  items: { id: number; product_id: number; quantity: number; unit_price: number }[];
};

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z
    .string()
    .min(1)
    .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, "Enter a valid price"),
  stock: z
    .string()
    .min(1)
    .refine(
      (v) => Number.isFinite(Number(v)) && Number(v) >= 0 && Number.isInteger(Number(v)),
      "Enter a valid stock count",
    ),
});

type CreateForm = z.infer<typeof createSchema>;

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const pushToast = useToastStore((s) => s.push);
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: () => api<Product[]>("/products", { auth: false }),
  });

  const ordersQuery = useQuery({
    queryKey: ["orders", "dashboard-summary"],
    queryFn: () => api<Order[]>("/orders"),
    enabled: !!token,
    retry: false,
  });

  const createForm = useForm<CreateForm>({ resolver: zodResolver(createSchema) });

  const createMutation = useMutation({
    mutationFn: (values: CreateForm) =>
      api<Product>("/products", {
        method: "POST",
        body: { ...values, price: Number(values.price), stock: Number(values.stock) },
      }),
    onSuccess: async () => {
      createForm.reset();
      setShowCreate(false);
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      pushToast({ kind: "success", title: "Product created" });
    },
    onError: (e) => {
      const message = e instanceof ApiError ? e.message : "Create failed";
      pushToast({ kind: "error", title: "Could not create product", message });
    },
  });

  const products = productsQuery.data ?? [];
  const orders = ordersQuery.data ?? [];

  const featured = products.slice(0, 4);
  const lowStockCount = products.filter((product) => product.stock > 0 && product.stock <= 5).length;
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const pendingOrders = orders.filter((order) => order.status === "pending").length;
  const topProduct = [...products].sort((a, b) => b.price - a.price)[0];

  return (
    <div className="page-stack">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <Card className="subtle-grid p-8 md:p-10">
          <div className="eyebrow">
            <Sparkles size={14} />
            Dashboard
          </div>
          <h1 className="section-title mt-6">A control center with clear next actions and real hierarchy.</h1>
          <p className="section-copy mt-5">
            Products, order flow, and revenue now sit in a single operational overview instead of competing for attention. The dashboard surfaces what matters first and pushes browsing into the dedicated products page.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/products">
              <Button size="lg">
                Browse products
                <ArrowRight size={16} />
              </Button>
            </Link>
            {user ? (
              <Button variant="secondary" size="lg" onClick={() => setShowCreate(true)}>
                <Plus size={16} />
                Add product
              </Button>
            ) : (
              <Link to="/login">
                <Button variant="secondary" size="lg">Sign in to manage catalog</Button>
              </Link>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#EFF6FF] p-3 text-[#0B5FFF]">
              <PackagePlus size={18} />
            </div>
            <div>
              <div className="text-lg font-semibold text-[#0F172A]">Store focus</div>
              <div className="mt-1 text-sm text-[#64748B]">The most useful signals at a glance.</div>
            </div>
          </div>
          <div className="mt-6 grid gap-4">
            <div className="metric-card p-4">
              <div className="metric-label">Top priced product</div>
              <div className="metric-value text-[2rem]">{topProduct ? topProduct.name : "No catalog yet"}</div>
              <div className="metric-note">
                {topProduct ? formatCurrency(topProduct.price) : "Create a product to start selling."}
              </div>
            </div>
            <div className="metric-card p-4">
              <div className="metric-label">Inventory alert</div>
              <div className="metric-value">{lowStockCount}</div>
              <div className="metric-note">products with five units or fewer remaining</div>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="metric-card">
          <div className="flex items-center justify-between gap-3">
            <div className="metric-label">Products</div>
            <Boxes size={18} className="text-[#0B5FFF]" />
          </div>
          <div className="metric-value">{products.length}</div>
          <div className="metric-note">{formatCompactNumber(totalStock)} units currently listed</div>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between gap-3">
            <div className="metric-label">Orders</div>
            <ReceiptText size={18} className="text-[#0B5FFF]" />
          </div>
          <div className="metric-value">{token ? orders.length : 0}</div>
          <div className="metric-note">{token ? `${pendingOrders} pending fulfillment` : "Sign in to view order volume"}</div>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between gap-3">
            <div className="metric-label">Revenue</div>
            <CircleDollarSign size={18} className="text-[#0B5FFF]" />
          </div>
          <div className="metric-value">{token ? formatCurrency(totalRevenue) : "Sign in"}</div>
          <div className="metric-note">{token ? "Captured across visible orders" : "Protected behind account access"}</div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <Card className="p-6">
          <div className="page-header">
            <div>
              <div className="metric-label">Featured products</div>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[#0F172A]">Start from the highest-signal items</h2>
            </div>
            <Link to="/products">
              <Button variant="secondary">View all products</Button>
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {featured.length ? (
              featured.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="rounded-[20px] border border-[#E2E8F0] bg-[#F8FAFC] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#BFDBFE] hover:shadow-[0_14px_32px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="badge border-transparent bg-white text-[#0B5FFF]">Featured</span>
                    <span className="text-xs text-[#64748B]">{formatCurrency(product.price)}</span>
                  </div>
                  <div className="mt-6 text-xl font-semibold tracking-[-0.03em] text-[#0F172A]">{product.name}</div>
                  <p className="mt-3 text-sm leading-6 text-[#64748B]">{product.description}</p>
                  <div className="mt-5 text-sm font-medium text-[#475569]">{product.stock} units available</div>
                </Link>
              ))
            ) : (
              <div className="rounded-[20px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-8 text-sm text-[#64748B]">
                No products yet. Add your first item to populate the storefront.
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="metric-label">Recent orders</div>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[#0F172A]">Operational timeline</h2>
          <div className="mt-6 space-y-4">
            {!token ? (
              <div className="rounded-[20px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-6">
                <div className="text-sm font-semibold text-[#0F172A]">Sign in to unlock order data</div>
                <div className="mt-2 text-sm leading-6 text-[#64748B]">Revenue and fulfillment metrics are shown only for authenticated users.</div>
              </div>
            ) : null}
            {token && ordersQuery.isLoading ? <div className="text-sm text-[#64748B]">Loading order summary...</div> : null}
            {token && ordersQuery.isError ? <div className="text-sm text-[#DC2626]">Could not load recent orders.</div> : null}
            {token && !orders.length ? (
              <div className="rounded-[20px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-6 text-sm text-[#64748B]">
                No orders yet. Create one from the cart to populate the revenue view.
              </div>
            ) : null}
            {orders.slice(0, 4).map((order) => (
              <div key={order.id} className="rounded-[20px] border border-[#E2E8F0] bg-[#F8FAFC] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-[#0F172A]">Order #{order.id}</div>
                    <div className="mt-1 text-sm text-[#64748B]">{formatDateTime(order.created_at)}</div>
                  </div>
                  <span className="status-badge" data-status={order.status === "paid" ? "paid" : order.status === "pending" ? "pending" : "default"}>
                    {order.status}
                  </span>
                </div>
                <div className="mt-4 text-lg font-semibold text-[#0F172A]">{formatCurrency(order.total_amount)}</div>
                <div className="mt-1 text-sm text-[#64748B]">{order.items.length} line items</div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {showCreate ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(15,23,42,0.18)] p-4 backdrop-blur-sm">
          <Card className="w-full max-w-xl p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="text-lg font-semibold text-[#0F172A]">Create product</div>
                <div className="mt-1 text-sm text-[#64748B]">
                  Add a new catalog item with pricing and live stock.
                </div>
              </div>
              <button
                className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B] transition hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                type="button"
                onClick={() => setShowCreate(false)}
              >
                Close
              </button>
            </div>

            <form
              className="mt-6 space-y-4"
              onSubmit={createForm.handleSubmit((v) => createMutation.mutate(v))}
            >
              <Input
                label="Name"
                {...createForm.register("name")}
                error={createForm.formState.errors.name?.message}
              />
              <Input
                label="Description"
                {...createForm.register("description")}
                error={createForm.formState.errors.description?.message}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Price (INR)"
                  inputMode="decimal"
                  {...createForm.register("price")}
                  error={createForm.formState.errors.price?.message}
                />
                <Input
                  label="Stock"
                  inputMode="numeric"
                  {...createForm.register("stock")}
                  error={createForm.formState.errors.stock?.message}
                />
              </div>
              <Button type="submit" loading={createMutation.isPending} className="w-full">
                {createMutation.isPending ? "Creating product" : "Create product"}
              </Button>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

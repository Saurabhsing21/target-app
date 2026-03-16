import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { api } from "../lib/api";
import { formatCurrency, formatDate } from "../lib/format";
import { useCartStore } from "../stores/cartStore";
import { useToastStore } from "../stores/toastStore";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  created_by: number;
  created_at: string;
};

export function ProductPage() {
  const { id } = useParams();
  const productId = Number(id);
  const addItem = useCartStore((s) => s.addItem);
  const pushToast = useToastStore((s) => s.push);
  const [qty, setQty] = useState(1);

  const productQuery = useQuery({
    queryKey: ["product", productId],
    queryFn: () => api<Product>(`/products/${productId}`, { auth: false }),
    enabled: Number.isFinite(productId) && productId > 0,
  });

  const safeQty = useMemo(
    () => Math.max(1, Math.min(qty, productQuery.data?.stock ?? 1)),
    [qty, productQuery.data?.stock],
  );

  if (productQuery.isLoading) return <div className="text-sm text-[#64748B]">Loading product...</div>;
  if (productQuery.isError || !productQuery.data)
    return <div className="text-sm text-[#DC2626]">Product not found.</div>;

  const p = productQuery.data;

  return (
    <div className="mx-auto max-w-5xl page-stack">
      <div className="flex items-center justify-between">
        <Link
          to="/products"
          className="text-xs font-semibold uppercase tracking-[0.22em] text-[#64748B] hover:text-[#0F172A]"
        >
          ← Back
        </Link>
        <div className="badge">
          id #{p.id}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex min-h-[420px] flex-col justify-between bg-[linear-gradient(145deg,#eef4ff,#f8fafc_45%,#dbeafe)] p-8">
            <div className="flex items-center justify-between gap-3">
              <span className="badge border-transparent bg-white/90 text-[#0B5FFF]">Product detail</span>
              <span className="text-sm text-[#64748B]">{formatDate(p.created_at)}</span>
            </div>
            <div className="max-w-xl">
              <div className="text-4xl font-semibold tracking-[-0.04em] text-[#0F172A] md:text-5xl">{p.name}</div>
              <div className="mt-5 text-base leading-8 text-[#475569]">{p.description}</div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="badge">{p.stock} units available</span>
              <span className="badge">Fast checkout enabled</span>
            </div>
          </div>

          <div className="p-8">
            <div className="metric-label">Purchase panel</div>
            <div className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[#0F172A]">
              {formatCurrency(p.price)}
            </div>
            <div className="mt-2 text-sm text-[#64748B]">Clear CTA, strong focus state, and safer quantity selection.</div>

            <div className="mt-8 rounded-[20px] border border-[#E2E8F0] bg-[#F8FAFC] p-5">
              <div className="metric-label">Quantity</div>
              <div className="mt-4 flex items-center gap-3">
                <Button variant="secondary" size="sm" onClick={() => setQty((current) => Math.max(1, current - 1))}>
                  <Minus size={16} />
                </Button>
                <input
                  className="h-11 w-20 rounded-xl border border-[#E2E8F0] bg-white px-3 text-center text-sm font-semibold text-[#0F172A] outline-none focus:border-[#0B5FFF] focus:ring-4 focus:ring-[#DBEAFE]"
                  type="number"
                  min={1}
                  max={p.stock}
                  value={safeQty}
                  onChange={(e) => setQty(Number(e.target.value))}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setQty((current) => Math.min(p.stock || 1, current + 1))}
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>

            <div className="mt-8 grid gap-3">
              <Button
                size="lg"
                disabled={p.stock <= 0}
                onClick={() => {
                  addItem({ productId: p.id, name: p.name, price: p.price }, safeQty);
                  pushToast({ kind: "success", title: "Added to cart", message: `${safeQty} × ${p.name}` });
                }}
              >
                <ShoppingBag size={16} />
                {p.stock > 0 ? "Add to cart" : "Out of stock"}
              </Button>
              <Link to="/cart">
                <Button variant="secondary" size="lg" className="w-full">
                  Go to cart
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

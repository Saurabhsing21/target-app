import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { api } from "../lib/api";
import { cn } from "../lib/cn";
import { formatCompactNumber, formatCurrency, formatDate } from "../lib/format";
import { useCartStore } from "../stores/cartStore";
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

export function ProductsPage() {
  const addItem = useCartStore((s) => s.addItem);
  const pushToast = useToastStore((s) => s.push);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: () => api<Product[]>("/products", { auth: false }),
  });

  const filteredProducts = useMemo(() => {
    const products = productsQuery.data ?? [];
    const term = deferredQuery.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) =>
      `${product.name} ${product.description}`.toLowerCase().includes(term),
    );
  }, [productsQuery.data, deferredQuery]);

  const inStockCount = filteredProducts.reduce((sum, product) => sum + product.stock, 0);

  return (
    <div className="page-stack">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_320px]">
        <Card className="subtle-grid p-8 md:p-10">
          <div className="eyebrow">Product Listing</div>
          <h1 className="section-title mt-6">Products that are easy to scan and easier to buy.</h1>
          <p className="section-copy mt-5">
            Every card now surfaces the essentials first: price, stock, and the primary action. The layout is designed for quick comparison without visual noise.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/cart">
              <Button size="lg">
                <ShoppingBag size={16} />
                Review cart
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="secondary" size="lg">
                Open dashboard
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 text-[#0F172A]">
            <div className="rounded-2xl bg-[#EFF6FF] p-3 text-[#0B5FFF]">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <div className="text-lg font-semibold">Catalog health</div>
              <div className="mt-1 text-sm text-[#64748B]">Live inventory and visible buying actions.</div>
            </div>
          </div>
          <div className="mt-6 grid gap-4">
            <div className="metric-card p-4">
              <div className="metric-label">Showing</div>
              <div className="metric-value">{filteredProducts.length}</div>
              <div className="metric-note">products in the current view</div>
            </div>
            <div className="metric-card p-4">
              <div className="metric-label">Units available</div>
              <div className="metric-value">{formatCompactNumber(inStockCount)}</div>
              <div className="metric-note">inventory across visible items</div>
            </div>
          </div>
        </Card>
      </section>

      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-4 top-[44px] text-[#94A3B8]" />
            <Input
              label="Search products"
              placeholder="Search by name or description"
              className="pl-11"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="badge">Visible products: {filteredProducts.length}</span>
            <span className="badge">Total inventory: {formatCompactNumber(inStockCount)}</span>
          </div>
        </div>
      </Card>

      {productsQuery.isLoading ? <div className="text-sm text-[#64748B]">Loading products...</div> : null}
      {productsQuery.isError ? <div className="text-sm text-[#DC2626]">Failed to load products.</div> : null}

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="h-52 bg-[linear-gradient(145deg,#eef4ff,#f8fafc_45%,#dbeafe)] p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="badge border-transparent bg-white/90 text-[#0B5FFF]">Featured item</span>
                <span className="text-xs font-medium text-[#64748B]">{formatDate(product.created_at)}</span>
              </div>
              <div className="mt-10 max-w-[80%]">
                <div className="text-2xl font-semibold tracking-[-0.03em] text-[#0F172A]">{product.name}</div>
                <div className="mt-2 text-sm text-[#475569]">{formatCurrency(product.price)}</div>
              </div>
            </div>

            <div className="p-6">
              <p className="min-h-[72px] text-sm leading-6 text-[#64748B]">{product.description}</p>

              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <div className="metric-label">Price</div>
                  <div className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#0F172A]">
                    {formatCurrency(product.price)}
                  </div>
                </div>
                <span
                  className={cn(
                    "status-badge",
                    product.stock > 0 ? "bg-[#F0FDF4] text-[#15803D]" : "bg-[#FEF2F2] text-[#DC2626]",
                  )}
                  data-status={product.stock > 0 ? "paid" : "failed"}
                >
                  {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                </span>
              </div>

              <div className="mt-6 flex items-center gap-3 border-t border-[#E2E8F0] pt-5">
                <Link to={`/products/${product.id}`} className="flex-1">
                  <Button variant="secondary" className="w-full">
                    View details
                  </Button>
                </Link>
                <Button
                  className="flex-1"
                  disabled={product.stock <= 0}
                  onClick={() => {
                    addItem({ productId: product.id, name: product.name, price: product.price }, 1);
                    pushToast({ kind: "success", title: "Added to cart", message: product.name });
                  }}
                >
                  Add to cart
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </section>

      {!productsQuery.isLoading && !filteredProducts.length ? (
        <Card className="p-10 text-center">
          <div className="text-xl font-semibold text-[#0F172A]">No products match this search.</div>
          <div className="mt-2 text-sm text-[#64748B]">Try a shorter query or clear the search to see the full catalog.</div>
        </Card>
      ) : null}
    </div>
  );
}

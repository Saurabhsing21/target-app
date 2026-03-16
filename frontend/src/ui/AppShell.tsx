import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { LayoutDashboard, LogOut, ShoppingBag, User2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { cn } from "../lib/cn";
import { api } from "../lib/api";
import { type User, useAuthStore } from "../stores/authStore";
import { useCartStore } from "../stores/cartStore";
import { useToastStore } from "../stores/toastStore";
import { Button } from "./Button";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-[background-color,color,box-shadow] duration-200",
    "text-[#475569] hover:bg-white hover:text-[#0F172A]",
    isActive
      ? "bg-white text-[#0F172A] shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
      : "",
  );

export function AppShell({ children }: PropsWithChildren) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const pushToast = useToastStore((s) => s.push);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => api<User>(`/auth/me`),
    enabled: !!token && !user,
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (meQuery.data) setUser(meQuery.data);
  }, [meQuery.data, setUser]);

  useEffect(() => {
    if (meQuery.isError) logout();
  }, [meQuery.isError, logout]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[#E2E8F0]/80 bg-[rgba(248,250,252,0.88)] backdrop-blur-xl">
        <div className="app-container flex flex-wrap items-center justify-between gap-4 py-4">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0B5FFF] text-white shadow-[0_14px_30px_rgba(11,95,255,0.24)]">
              <LayoutDashboard size={18} />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-[-0.03em] text-[#0F172A]">Target Commerce</div>
              <div className="text-xs text-[#64748B]">Unified storefront workspace</div>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-1">
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/products" className={navLinkClass}>
              Products
            </NavLink>
            <NavLink to="/orders" className={navLinkClass}>
              Orders
            </NavLink>
            <NavLink to="/cart" className={navLinkClass}>
              <span className="inline-flex items-center gap-2">
                <ShoppingBag size={16} />
                Cart
                {cartCount ? (
                  <span className="rounded-full bg-[#DBEAFE] px-2 py-0.5 text-xs font-semibold text-[#0B5FFF]">
                    {cartCount}
                  </span>
                ) : null}
              </span>
            </NavLink>
            <NavLink to={user ? "/profile" : "/login"} className={navLinkClass}>
              <span className="inline-flex items-center gap-2">
                <User2 size={16} />
                {user ? user.name.split(" ")[0] : "Sign in"}
              </span>
            </NavLink>
            {user ? (
              <Button
                variant="secondary"
                size="sm"
                className="hidden md:inline-flex"
                onClick={() => {
                  logout();
                  pushToast({ kind: "success", title: "Logged out" });
                }}
                title="Logout"
              >
                <span className="inline-flex items-center gap-2">
                  <LogOut size={16} />
                  Logout
                </span>
              </Button>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="app-container py-8 sm:py-10">
        <div className="glass-panel relative overflow-hidden rounded-[32px] border border-white/70 shadow-[0_28px_80px_rgba(15,23,42,0.10)]">
          <div className="absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_top,rgba(11,95,255,0.12),transparent_72%)]" />
          <div className="relative border-b border-[#E2E8F0] bg-white/72 px-5 py-4 text-sm text-[#64748B]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#FB7185]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
              </div>
              <div className="rounded-full border border-[#E2E8F0] bg-white px-4 py-1.5 text-xs font-medium">
                target.local
              </div>
            </div>
          </div>
          <div className="relative px-5 py-8 md:px-8 md:py-10">
            {children}
          </div>
        </div>
      </main>

      <footer className="app-container pb-10">
        <div className="border-t border-[#E2E8F0] pt-6 text-sm text-[#64748B]">
          Secure checkout, live inventory, and test payments in a consistent commerce workspace.
        </div>
      </footer>
    </div>
  );
}

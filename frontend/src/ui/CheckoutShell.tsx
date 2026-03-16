import type { PropsWithChildren } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export function CheckoutShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[#E2E8F0] bg-[rgba(248,250,252,0.9)] backdrop-blur-xl">
        <div className="app-container flex flex-wrap items-center justify-between gap-3 py-5">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-[#0F172A] transition hover:bg-[#F8FAFC]"
          >
            <ArrowLeft size={16} />
            Back to cart
          </Link>
          <div className="text-center">
            <div className="text-xl font-semibold text-[#0F172A]">Secure Checkout</div>
            <div className="text-xs uppercase tracking-[0.18em] text-[#64748B]">Protected payment flow</div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-[#D1FAE5] bg-[#F0FDF4] px-4 py-2 text-sm text-[#166534]">
            <ShieldCheck size={16} className="text-[#16A34A]" />
            Verified flow
          </div>
        </div>
      </header>
      <main className="app-container py-10">{children}</main>
    </div>
  );
}

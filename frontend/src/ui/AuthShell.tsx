import type { PropsWithChildren } from "react";
import { Link } from "react-router-dom";

export function AuthShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen">
      <div className="app-container flex min-h-screen flex-col py-6">
        <header className="flex items-center justify-between py-4">
          <Link to="/" className="text-xl font-semibold tracking-[-0.03em] text-[#0F172A]">
            Target Commerce
          </Link>
          <Link
            to="/products"
            className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-[#0F172A] transition hover:border-[#CBD5E1] hover:bg-[#F8FAFC]"
          >
            Browse products
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center py-8">{children}</div>
      </div>
    </div>
  );
}

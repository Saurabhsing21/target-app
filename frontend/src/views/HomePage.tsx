import { Link } from "react-router-dom";
import { ArrowRight, Boxes, CreditCard, ShieldCheck, Sparkles } from "lucide-react";

import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

export function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[#E2E8F0]/80 bg-[rgba(248,250,252,0.88)] backdrop-blur-xl">
        <div className="app-container flex flex-wrap items-center justify-between gap-4 py-5">
          <div>
            <div className="text-2xl font-semibold tracking-[-0.04em] text-[#0F172A]">Target Commerce</div>
            <div className="text-xs uppercase tracking-[0.2em] text-[#64748B]">Premium ecommerce workspace</div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-[#0F172A] transition hover:bg-[#F8FAFC]"
            >
              Sign in
            </Link>
            <Link to="/products">
              <Button>Browse products</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="app-container py-12">
        <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="eyebrow">
              <Sparkles size={14} />
              Commerce OS
            </div>
            <h1 className="section-title mt-6 max-w-4xl text-5xl md:text-7xl">
              Run products, orders, and checkout from one clear interface.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#64748B]">
              A premium, task-focused ecommerce frontend with stronger hierarchy, sharper actions, and a cleaner path from discovery to payment.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/dashboard">
                <Button className="min-w-44">
                  <span className="inline-flex items-center gap-2">
                    Explore dashboard
                    <ArrowRight size={16} />
                  </span>
                </Button>
              </Link>
              <Link
                to="/register"
                className="rounded-xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-semibold text-[#0F172A] transition hover:bg-[#F8FAFC]"
              >
                Create account
              </Link>
            </div>
          </div>

          <Card className="subtle-grid p-6">
            <div className="grid gap-4">
              {[
                {
                  icon: Boxes,
                  title: "Catalog management",
                  text: "Create products, publish pricing, and track live stock in one place.",
                },
                {
                  icon: CreditCard,
                  title: "Checkout flow",
                  text: "Move from cart to Razorpay payment with backend verification.",
                },
                {
                  icon: ShieldCheck,
                  title: "User accounts",
                  text: "Separate login, register, dashboard, and checkout routes for a cleaner experience.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-[#E2E8F0] bg-white/90 p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-[#EFF6FF] p-3 text-[#0B5FFF]">
                      <item.icon size={18} />
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-[#0F172A]">{item.title}</div>
                      <div className="mt-2 text-sm leading-6 text-[#64748B]">{item.text}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}

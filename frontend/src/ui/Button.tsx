import type { ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";

import { cn } from "../lib/cn";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "solid";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  children,
  disabled,
  ...props
}: Props) {
  const resolvedVariant = variant === "solid" ? "primary" : variant;

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "min-h-10 px-4 text-sm",
        size === "md" && "min-h-11 px-5 text-sm",
        size === "lg" && "min-h-12 px-6 text-[15px]",
        resolvedVariant === "primary" &&
          "border-transparent bg-[#0B5FFF] text-white shadow-[0_16px_36px_rgba(11,95,255,0.22)] hover:bg-[#084fd6] hover:shadow-[0_20px_40px_rgba(11,95,255,0.26)] active:translate-y-px focus-visible:ring-[#bfdbfe]",
        resolvedVariant === "secondary" &&
          "border-[#cbd5e1] bg-white text-[#0F172A] shadow-[0_8px_24px_rgba(15,23,42,0.06)] hover:border-[#94a3b8] hover:bg-[#f8fafc] focus-visible:ring-[#dbeafe]",
        resolvedVariant === "ghost" &&
          "border-transparent bg-transparent text-[#334155] hover:bg-white hover:text-[#0F172A] focus-visible:ring-[#dbeafe]",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoaderCircle size={16} className="animate-spin" /> : null}
      {children}
    </button>
  );
}

import type { InputHTMLAttributes } from "react";

import { cn } from "../lib/cn";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({ className, label, hint, error, id, ...props }: Props) {
  const inputId = id ?? props.name;
  return (
    <label className="block">
      {label ? (
        <span className="block text-sm font-medium text-[#334155]">
          {label}
        </span>
      ) : null}
      <input
        id={inputId}
        className={cn(
          "mt-2 w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] shadow-[0_2px_4px_rgba(15,23,42,0.02)] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[#94A3B8] focus:border-[#0B5FFF] focus:ring-4 focus:ring-[#DBEAFE]",
          error && "border-[#DC2626] focus:border-[#DC2626] focus:ring-[rgba(220,38,38,0.12)]",
          className,
        )}
        {...props}
      />
      {error ? <div className="mt-2 text-sm text-[#DC2626]">{error}</div> : null}
      {!error && hint ? <div className="mt-2 text-xs text-[#64748B]">{hint}</div> : null}
    </label>
  );
}

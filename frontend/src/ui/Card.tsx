import type { PropsWithChildren } from "react";

import { cn } from "../lib/cn";

export function Card({
  className,
  outerClassName,
  children,
}: PropsWithChildren<{ className?: string; outerClassName?: string }>) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-[#E2E8F0] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.08)]",
        outerClassName,
      )}
    >
      <div className={cn("relative rounded-[23px]", className)}>
        {children}
      </div>
    </div>
  );
}

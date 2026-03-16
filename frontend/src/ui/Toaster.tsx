import { useEffect } from "react";

import { cn } from "../lib/cn";
import { useToastStore } from "../stores/toastStore";

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  useEffect(() => {
    if (!toasts.length) return;
    const ids = toasts.map((t) => t.id);
    const timer = window.setTimeout(() => {
      for (const id of ids) remove(id);
    }, 4200);
    return () => window.clearTimeout(timer);
  }, [toasts, remove]);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex w-[min(420px,calc(100vw-40px))] flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "rounded-2xl border bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur",
            t.kind === "success" && "border-[#BBF7D0]",
            t.kind === "error" && "border-[#FECACA]",
            t.kind === "info" && "border-[#BFDBFE]",
          )}
        >
          <div className="text-sm font-semibold text-[#0F172A]">{t.title}</div>
          {t.message ? <div className="mt-1 text-sm text-[#64748B]">{t.message}</div> : null}
          <button
            className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#64748B] hover:text-[#0F172A]"
            onClick={() => remove(t.id)}
          >
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}

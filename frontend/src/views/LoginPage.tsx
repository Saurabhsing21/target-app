import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { api, ApiError } from "../lib/api";
import { type User, useAuthStore } from "../stores/authStore";
import { useToastStore } from "../stores/toastStore";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const [params] = useSearchParams();
  const next = params.get("next") ?? "/dashboard";
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const pushToast = useToastStore((s) => s.push);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const token = await api<{ access_token: string }>(`/auth/login`, {
        method: "POST",
        body: values,
        auth: false,
      });
      setAuth(token.access_token, null);
      const me = await api<User>(`/auth/me`, { method: "GET" });
      useAuthStore.getState().setUser(me);
      pushToast({ kind: "success", title: "Signed in" });
      navigate(next, { replace: true });
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Login failed";
      pushToast({ kind: "error", title: "Could not sign in", message });
    }
  });

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <Card className="subtle-grid flex flex-col justify-between p-8 md:p-10">
        <div>
          <div className="eyebrow">
            <ShieldCheck size={14} />
            Secure access
          </div>
          <h1 className="section-title mt-6 text-4xl md:text-5xl">Sign in with a stronger visual path to the next step.</h1>
          <p className="section-copy mt-5">
            Focus states, spacing, and hierarchy now make the form easier to complete quickly without guessing where the primary action is.
          </p>
        </div>
        <div className="mt-10 grid gap-4">
          <div className="rounded-[20px] border border-[#E2E8F0] bg-white/90 p-5">
            <div className="text-sm font-semibold text-[#0F172A]">Manage products</div>
            <div className="mt-2 text-sm leading-6 text-[#64748B]">Update your catalog from a single dashboard and products view.</div>
          </div>
          <div className="rounded-[20px] border border-[#E2E8F0] bg-white/90 p-5">
            <div className="text-sm font-semibold text-[#0F172A]">Track orders</div>
            <div className="mt-2 text-sm leading-6 text-[#64748B]">Keep payment state and fulfillment context visible in one place.</div>
          </div>
        </div>
      </Card>

      <Card className="p-8 md:p-10">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[#EFF6FF] p-3 text-[#0B5FFF]">
            <LockKeyhole size={18} />
          </div>
          <div>
            <div className="text-lg font-semibold text-[#0F172A]">Sign in</div>
            <div className="mt-1 text-sm text-[#64748B]">Use your account to continue to the workspace.</div>
          </div>
        </div>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            {...register("email")}
            error={errors.email?.message}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
            error={errors.password?.message}
          />
          <Button type="submit" loading={isSubmitting} disabled={isSubmitting} className="mt-2 w-full" size="lg">
            {isSubmitting ? "Signing in" : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
          <Link className="font-semibold text-[#0B5FFF] hover:text-[#084fd6]" to="/forgot-password">
            Forgot password?
          </Link>
          <div className="text-[#64748B]">
            New here?{" "}
            <Link className="font-semibold text-[#0B5FFF] hover:text-[#084fd6]" to="/register">
              Create an account
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

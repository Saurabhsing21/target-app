import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { api, ApiError } from "../lib/api";
import { useToastStore } from "../stores/toastStore";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});
type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const pushToast = useToastStore((s) => s.push);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = useMemo(
    () =>
      handleSubmit(async (values) => {
        try {
          await api(`/auth/register`, { method: "POST", body: values, auth: false });
          pushToast({ kind: "success", title: "Account created", message: "Now sign in to continue." });
          navigate("/login");
        } catch (e) {
          const message = e instanceof ApiError ? e.message : "Registration failed";
          pushToast({ kind: "error", title: "Could not register", message });
        }
      }),
    [handleSubmit, navigate, pushToast],
  );

  return (
    <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2 md:items-start">
      <div className="pt-4">
        <div className="font-display text-3xl leading-tight">
          Create your account and start selling with <span className="text-acid-400">Northstar</span>.
        </div>
        <p className="mt-4 max-w-md text-sm text-paper-200/70">
          Set up your profile, add products, and use the integrated checkout flow for test payments.
        </p>
      </div>

      <Card className="p-6">
        <div className="text-sm font-semibold">Register</div>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Input label="Name" autoComplete="name" {...register("name")} error={errors.name?.message} />
          <Input label="Email" type="email" autoComplete="email" {...register("email")} error={errors.email?.message} />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            hint="Minimum 8 characters."
            {...register("password")}
            error={errors.password?.message}
          />
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creating…" : "Create account"}
          </Button>
        </form>
        <div className="mt-6 text-sm text-paper-200/70">
          Already have an account?{" "}
          <Link
            className="font-semibold text-paper-50 underline decoration-paper-200/30 underline-offset-4 hover:decoration-acid-400/60"
            to="/login"
          >
            Sign in
          </Link>
          .
        </div>
      </Card>
    </div>
  );
}

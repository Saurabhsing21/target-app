import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { api, ApiError } from "../lib/api";
import { useToastStore } from "../stores/toastStore";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";

const schema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const pushToast = useToastStore((s) => s.push);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      token: params.get("token") ?? "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: FormData) {
    try {
      await api<void>("/auth/reset-password", {
        method: "POST",
        body: { token: values.token, password: values.password },
        auth: false,
      });
      pushToast({ kind: "success", title: "Password reset", message: "Sign in with your new password." });
      navigate("/login", { replace: true });
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Reset failed";
      pushToast({ kind: "error", title: "Could not reset password", message });
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2 md:items-start">
      <div className="pt-4">
        <div className="font-display text-3xl leading-tight">Create a new password</div>
        <p className="mt-4 max-w-md text-sm text-paper-200/70">
          Use the reset token from the forgot password step, then sign back in with the new password.
        </p>
      </div>

      <Card className="p-6">
        <div className="text-sm font-semibold">Reset password</div>
        {!params.get("token") ? (
          <div className="mt-4 rounded-[22px] bg-[#fff4f1] px-4 py-3 text-sm text-[#9b3d2f] shadow-[inset_0_0_0_1px_#f2c7bf]">
            Reset link is missing or incomplete. Request a new password reset email.
          </div>
        ) : null}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
            error={errors.password?.message}
          />
          <Input
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
          />
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Resetting…" : "Reset password"}
          </Button>
        </form>

        <div className="mt-6 text-sm text-paper-200/70">
          Need a token first?{" "}
          <Link
            className="font-semibold text-paper-50 underline decoration-paper-200/30 underline-offset-4 hover:decoration-acid-400/60"
            to="/forgot-password"
          >
            Forgot password
          </Link>
          .
        </div>
      </Card>
    </div>
  );
}

import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { api, ApiError } from "../lib/api";
import { useToastStore } from "../stores/toastStore";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";

const schema = z.object({
  email: z.string().email(),
});

type FormData = z.infer<typeof schema>;

type ForgotPasswordResponse = {
  message: string;
};

export function ForgotPasswordPage() {
  const pushToast = useToastStore((s) => s.push);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormData) {
    try {
      const response = await api<ForgotPasswordResponse>("/auth/forgot-password", {
        method: "POST",
        body: values,
        auth: false,
      });
      pushToast({ kind: "success", title: "Reset request created", message: response.message });
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Request failed";
      pushToast({ kind: "error", title: "Could not start reset", message });
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2 md:items-start">
      <div className="pt-4">
        <div className="font-display text-3xl leading-tight">Forgot your password?</div>
        <p className="mt-4 max-w-md text-sm text-paper-200/70">
          Enter your email to start a password reset. This page stays available before login.
        </p>
      </div>

      <Card className="p-6">
        <div className="text-sm font-semibold">Reset access</div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            {...register("email")}
            error={errors.email?.message}
          />
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>

        <div className="mt-6 text-sm text-paper-200/70">
          Back to{" "}
          <Link
            className="font-semibold text-paper-50 underline decoration-paper-200/30 underline-offset-4 hover:decoration-acid-400/60"
            to="/login"
          >
            sign in
          </Link>
          .
        </div>
      </Card>
    </div>
  );
}

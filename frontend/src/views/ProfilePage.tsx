import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { api, ApiError } from "../lib/api";
import { useAuthStore, type User } from "../stores/authStore";
import { useToastStore } from "../stores/toastStore";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";

const schema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});
type FormData = z.infer<typeof schema>;

export function ProfilePage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logoutLocal = useAuthStore((s) => s.logout);
  const pushToast = useToastStore((s) => s.push);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => api<User>(`/auth/me`),
    enabled: !!token,
  });

  const initial = meQuery.data ?? user;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    values: { name: initial?.name, email: initial?.email },
  });

  const updateMutation = useMutation({
    mutationFn: (values: FormData) => api<User>(`/users/${initial!.id}`, { method: "PUT", body: values }),
    onSuccess: (u) => {
      setUser(u);
      pushToast({ kind: "success", title: "Profile updated" });
    },
    onError: (e) => {
      const message = e instanceof ApiError ? e.message : "Update failed";
      pushToast({ kind: "error", title: "Could not update profile", message });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => api<void>(`/auth/logout`, { method: "POST" }),
    onSuccess: () => {
      logoutLocal();
      pushToast({ kind: "success", title: "Logged out" });
      navigate("/login");
    },
    onError: () => {
      logoutLocal();
      navigate("/login");
    },
  });

  const onSubmit = useMemo(
    () =>
      form.handleSubmit(async (values) => {
        if (!initial) return;
        await updateMutation.mutateAsync(values);
      }),
    [form, updateMutation, initial],
  );

  if (!initial) return <div className="text-sm text-paper-200/70">Loading…</div>;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="font-display text-3xl leading-tight">Profile</div>
          <div className="mt-2 text-sm text-paper-200/70">Update safe fields only (name/email).</div>
        </div>
        <Button variant="ghost" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
          Logout
        </Button>
      </div>

      <Card className="mt-7 p-6">
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input label="Name" {...form.register("name")} error={form.formState.errors.name?.message} />
          <Input label="Email" type="email" {...form.register("email")} error={form.formState.errors.email?.message} />
          <Button type="submit" disabled={updateMutation.isPending} className="w-full md:w-auto">
            {updateMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </form>
        <div className="mt-6 text-xs text-paper-200/55">
          User id #{initial.id} · Created {new Date(initial.created_at).toLocaleDateString()}
        </div>
      </Card>
    </div>
  );
}


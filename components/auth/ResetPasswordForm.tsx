"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { AuthShell, Field } from "./ui";

export function ResetPasswordForm() {
  const token = useSearchParams().get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!token) {
    return (
      <AuthShell title="Invalid link" subtitle="This reset link is missing its token or has expired.">
        <Link href="/forgot-password" className="inline-block rounded-full border border-ink px-6 py-2.5 text-sm font-medium transition hover:bg-ink hover:text-paper">
          Request a new one
        </Link>
      </AuthShell>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (password !== confirm) return setError("Passwords don't match");
    setBusy(true);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    if (error) {
      setError(error.message ?? "Couldn't reset your password");
      setBusy(false);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <AuthShell title="Password updated" subtitle="You can now sign in with your new password.">
        <Link href="/login" className="inline-block w-full rounded-full bg-ink py-3 text-center text-sm font-medium text-paper transition hover:bg-stone-800">
          Go to login
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password">
      <form onSubmit={submit} className="space-y-4">
        <Field label="New password (8+ characters)" type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Field label="Confirm new password" type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {error && <p className="text-sm text-sale" role="alert">{error}</p>}
        <button type="submit" disabled={busy}
          className="w-full rounded-full bg-ink py-3 text-sm font-medium text-paper transition hover:bg-stone-800 disabled:opacity-40">
          {busy ? "Updating…" : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}
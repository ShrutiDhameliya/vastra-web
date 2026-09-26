"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { AuthShell, Field } from "./ui";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    // await authClient.forgetPassword({ email, redirectTo: "/reset-password" });
    await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
    setSent(true);
    setBusy(false);
  }

  if (sent) {
    return (
      <AuthShell title="Check your inbox" subtitle="If an account exists for that email, a reset link is on its way.">
        <p className="rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-600">
          Running without email keys (dev)? The link prints in your server terminal.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Forgot password" subtitle="We'll email you a link to choose a new one.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="submit" disabled={busy}
          className="w-full rounded-full bg-ink py-3 text-sm font-medium text-paper transition hover:bg-stone-800 disabled:opacity-40">
          {busy ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}
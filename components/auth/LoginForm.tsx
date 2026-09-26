"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { AuthShell, Field } from "./ui";

export function LoginForm() {
  const router = useRouter();
  const nextParam = useSearchParams().get("next");
  // Internal redirects only — never bounce users off-site after login
  const next = nextParam?.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      setError(error.message ?? "Invalid email or password");
      setBusy(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to track orders and check out faster."
      footer={<>New to Vastra? <Link href="/register" className="font-medium text-ink underline-offset-2 hover:underline">Create an account</Link></>}
    >
      <form data-tour="auth-form" onSubmit={submit} className="space-y-4">
        <Field label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-sm text-sale" role="alert">{error}</p>}
        <button type="submit" disabled={busy}
          className="w-full rounded-full bg-ink py-3 text-sm font-medium text-paper transition hover:bg-stone-800 disabled:opacity-40">
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-center text-sm">
          <Link href="/forgot-password" className="text-stone-500 hover:text-ink">Forgot password?</Link>
        </p>
      </form>
    </AuthShell>
  );
}
// app/reset-password/page.tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Reset Password" };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-stone-400">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
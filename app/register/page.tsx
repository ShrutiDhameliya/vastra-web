// app/register/page.tsx — same shape
import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Create Account" };

export default async function RegisterPage() {
  if (await getSessionUser()) redirect("/account");
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-stone-400">Loading…</div>}>
      <RegisterForm />
    </Suspense>
  );
}
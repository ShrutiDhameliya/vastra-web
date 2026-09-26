// app/login/page.tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage() {
    if (await getSessionUser()) redirect("/account");
    return (
        <Suspense fallback={<div className="py-24 text-center text-sm text-stone-400">Loading…</div>}>
            <LoginForm />
        </Suspense>
    );
}
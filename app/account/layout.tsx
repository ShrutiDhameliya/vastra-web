import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { AccountNav } from "@/components/account/AccountNav";

export const metadata: Metadata = { title: "My Account", robots: { index: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
    const user = await getSessionUser();
    if (!user) redirect("/login?next=/account");

    return (
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
                <aside>
                    <p className="truncate font-display text-xl font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-stone-500">{user.email}</p>
                    <AccountNav />
                </aside>
                <div className="min-w-0">{children}</div>
            </div>
        </div>
    );
}
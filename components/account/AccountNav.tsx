"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";

const LINKS = [
    { href: "/account", label: "Overview", exact: true },
    { href: "/account/orders", label: "My Orders" },
    { href: "/account/addresses", label: "Addresses" },
    { href: "/account/profile", label: "Profile & Security" },
];

export function AccountNav() {
    const pathname = usePathname();
    const router = useRouter();

    async function signOut() {
        await authClient.signOut();
        router.push("/");
        router.refresh();
    }

    return (
        <nav className="mt-6 flex gap-1 overflow-x-auto lg:flex-col" aria-label="Account">
            {LINKS.map((l) => {
                const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
                return (
                    <Link key={l.href} href={l.href}
                        className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-ink text-paper" : "text-stone-600 hover:bg-stone-100"
                            }`}>
                        {l.label}
                    </Link>
                );
            })}
            <button
                onClick={signOut}
                className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-sale transition hover:bg-red-50">
                <LogOut className="size-4" /> Sign out
            </button>
        </nav>
    );
}
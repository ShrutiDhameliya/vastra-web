"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { StartTourButton } from "../tour/StartTourButton";

const LINKS = [
    { href: "/admin", label: "Dashboard", exact: true },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/categories", label: "Categories" },
];

export function AdminNav() {
    const pathname = usePathname();
    return (
        <nav className="mt-6 flex gap-1 overflow-x-auto lg:flex-col" aria-label="Admin">
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
            <StartTourButton
                tour="admin"
                label="Take a tour"
                className="flex shrink-0 items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-ink"
            />
            <Link href="/" className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-stone-500 transition hover:bg-stone-100 hover:text-ink">
                <ExternalLink className="size-3.5" /> View store
            </Link>
        </nav>
    );
}
import Link from "next/link";
import { PackageSearch } from "lucide-react";

export default function NotFound() {
    return (
        <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
            <PackageSearch className="size-10 text-stone-400" />
            <h1 className="mt-4 font-display text-3xl font-semibold">Page not found</h1>
            <p className="mt-2 text-sm text-stone-500">
                The link may be broken, or the page may have moved.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                    href="/"
                    className="rounded-full bg-ink px-7 py-3 text-sm font-medium text-paper transition hover:bg-stone-800"
                >
                    Go home
                </Link>
                <Link
                    href="/shop"
                    className="rounded-full border border-ink px-7 py-3 text-sm font-medium transition hover:bg-ink hover:text-paper"
                >
                    Browse the shop
                </Link>
            </div>
        </div>
    );
}
"use client";

import Link from "next/link";

export default function ErrorPage({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
            <h1 className="font-display text-3xl font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-stone-500">
                The page hit an unexpected error
                {error.digest ? ` (ref: ${error.digest})` : ""}.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button
                    onClick={reset}
                    className="rounded-full bg-ink px-7 py-3 text-sm font-medium text-paper transition hover:bg-stone-800"
                >
                    Try again
                </button>
                <Link
                    href="/"
                    className="rounded-full border border-ink px-7 py-3 text-sm font-medium transition hover:bg-ink hover:text-paper"
                >
                    Go home
                </Link>
            </div>
        </div>
    );
}
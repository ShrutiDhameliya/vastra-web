"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { STATUS_LABEL } from "@/lib/order-status";
import type { OrderStatus } from "@prisma/client";

export function StatusUpdater({ orderNumber, next }: {
    orderNumber: string;
    next: OrderStatus[];
}) {
    const router = useRouter();
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function moveTo(status: OrderStatus) {
        if (status === "CANCELLED" && !window.confirm("Cancel this order? Reserved stock will be released.")) return;
        if (status === "REFUNDED" && !window.confirm("Mark as refunded? Issue the actual refund in the Razorpay dashboard first.")) return;
        setBusy(status);
        setError(null);
        try {
            const res = await fetch(`/api/admin/orders/${orderNumber}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? "Couldn't update status");
                return;
            }
            router.refresh();
        } finally {
            setBusy(null);
        }
    }

    if (next.length === 0) {
        return <p className="text-sm text-stone-500">Terminal state — no further transitions.</p>;
    }

    return (
        <div>
            <div className="flex flex-wrap gap-2">
                {next.map((s) => (
                    <button
                        key={s} onClick={() => moveTo(s)} disabled={busy !== null}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-40 ${s === "CANCELLED" || s === "REFUNDED"
                            ? "border border-sale text-sale hover:bg-sale hover:text-white"
                            : "bg-ink text-paper hover:bg-stone-800"
                            }`}>
                        {busy === s ? "…" : `Mark ${STATUS_LABEL[s]}`}
                    </button>
                ))}
            </div>
            {error && <p className="mt-2 text-sm text-sale" role="alert">{error}</p>}
        </div>
    );
}
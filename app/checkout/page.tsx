"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Banknote, CreditCard, Lock, ShieldCheck, Truck, Zap } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useQuote } from "@/components/checkout/useQuote";
import { formatPaise } from "@/lib/money";
import { authClient } from "@/lib/auth-client";

type RazorpayOptions = {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    order_id: string;
    prefill?: { name?: string; email?: string; contact?: string };
    theme?: { color?: string };
    handler?: (r: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
    modal?: { ondismiss?: () => void };
};
declare global {
    interface Window {
        Razorpay?: new (o: RazorpayOptions) => { open: () => void };
    }
}

function loadRazorpay(): Promise<boolean> {
    return new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        document.body.appendChild(s);
    });
}

const EMPTY = { fullName: "", phone: "", email: "", line1: "", line2: "", city: "", state: "", pincode: "" };
type Address = typeof EMPTY;

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</span>
            <input
                {...props}
                className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-ink"
            />
        </label>
    );
}

export default function CheckoutPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [address, setAddress] = useState<Address>(EMPTY);
    const [deliveryMethod, setDeliveryMethod] = useState<"standard" | "express">("standard");
    const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "COD">("RAZORPAY");
    const [placing, setPlacing] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState<{ problems: string[] } | null>(null);

    const items = useCartStore((s) => s.items);
    const clear = useCartStore((s) => s.clear);
    const coupon = useCartStore((s) => s.coupon);
    const { quote } = useQuote(deliveryMethod);

    // Generated in the click handler, NOT render — a useRef value avoids the
    // server/client hydration mismatch that useState(() => randomUUID()) causes.
    const idemRef = useRef<string | null>(null);
    // Stops the empty-cart redirect from clobbering the success-page push
    // (which happens right after clear()).
    const doneRef = useRef(false);
    const { data: session } = authClient.useSession();
    const [saved, setSaved] = useState<
        { id: string; fullName: string; phone: string; line1: string; line2: string | null; city: string; state: string; pincode: string; isDefault: boolean }[] | null
    >(null);
    const [selectedSaved, setSelectedSaved] = useState<string | null>(null);
    const [saveAddress, setSaveAddress] = useState(true);


    useEffect(() => setMounted(true), []);
    useEffect(() => {
        const saved = localStorage.getItem("vastra-address");
        if (saved) {
            try {
                setAddress((a) => ({ ...a, ...JSON.parse(saved) }));
            } catch { }
        }
    }, []);
    useEffect(() => {
        if (mounted && !doneRef.current && items.length === 0) router.replace("/cart");
    }, [mounted, items.length, router]);

    // Logged in → load saved addresses; the default (or session identity) prefills the form
    useEffect(() => {
        if (!session?.user || saved !== null) return;
        fetch("/api/addresses")
            .then((r) => (r.ok ? r.json() : []))
            .then((list) => {
                setSaved(list);
                const def = list.find((a: { isDefault: boolean }) => a.isDefault);
                if (def) {
                    setSelectedSaved(def.id);
                    setAddress({
                        fullName: def.fullName, phone: def.phone, email: session.user.email,
                        line1: def.line1, line2: def.line2 ?? "", city: def.city, state: def.state, pincode: def.pincode,
                    });
                } else if (!address.fullName && !address.email) {
                    setAddress((a) => ({ ...a, fullName: session.user.name, email: session.user.email }));
                }
            });
    }, [session?.user?.id, saved]); // eslint-disable-line react-hooks/exhaustive-deps

    const required: (keyof Address)[] = ["fullName", "phone", "email", "line1", "city", "state", "pincode"];
    const formValid = required.every((k) => address[k].trim().length > 0);
    const lineUnavailable = (variantId: string) => {
        if (!quote) return false;
        const l = quote.lines.find((x) => x.variantId === variantId);
        return !l || !l.available;
    };
    const hasUnavailable = quote && items.some((i) => lineUnavailable(i.variantId));
    const canPlace = mounted && formValid && !!quote && !hasUnavailable && !placing && !verifying;

    async function handlePlace() {
        setError(null);
        setPlacing(true);
        try {
            idemRef.current ??= crypto.randomUUID();
            const res = await fetch("/api/checkout/place", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    idempotencyKey: idemRef.current,
                    paymentMethod,
                    deliveryMethod,
                    couponCode: coupon,
                    address,
                    items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                setError({ problems: data.problems ?? ["Something went wrong"] });
                return;
            }

            // Remember the address for next time (convenience only — server owns truth)
            localStorage.setItem("vastra-address", JSON.stringify(address));

            if (session?.user && saveAddress && selectedSaved === null) {
                try {
                    await fetch("/api/addresses", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            fullName: address.fullName, phone: address.phone, line1: address.line1,
                            line2: address.line2, city: address.city, state: address.state, pincode: address.pincode,
                        }),
                    });
                } catch { /* non-fatal — the order is already placed */ }
            }

            if (data.paymentMethod === "COD") {
                doneRef.current = true;
                clear();
                router.push(`/checkout/success?order=${data.orderNumber}`);
                return;
            }

            const loaded = await loadRazorpay();
            if (!loaded || !window.Razorpay) {
                setError({ problems: ["Couldn't load the payment window — check your connection and press the button again."] });
                return;
            }

            new window.Razorpay({
                key: data.razorpay.keyId,
                amount: data.razorpay.amount,
                currency: "INR",
                name: "Vastra",
                description: `Order ${data.orderNumber}`,
                order_id: data.razorpay.razorpayOrderId,
                prefill: { name: address.fullName, email: address.email, contact: address.phone },
                theme: { color: "#1c1917" },
                handler: async (resp) => {
                    setVerifying(true);
                    try {
                        const v = await fetch("/api/checkout/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(resp),
                        });
                        const vd = await v.json();
                        if (v.ok && vd.ok) {
                            doneRef.current = true;
                            clear();
                            router.push(`/checkout/success?order=${vd.orderNumber}`);
                        } else {
                            setError({
                                problems: [vd.error ?? "Verification failed — if you were charged, it will auto-settle or be refunded."],
                            });
                        }
                    } finally {
                        setVerifying(false);
                    }
                },
                modal: {
                    ondismiss: () =>
                        setError({
                            problems: ["Payment window closed — your order is reserved. Press the button again to pay."],
                        }),
                },
            }).open();
        } catch {
            setError({ problems: ["Network error — please try again."] });
        } finally {
            setPlacing(false);
        }
    }

    if (!mounted) {
        return <div className="mx-auto max-w-7xl px-4 py-24 text-center text-sm text-stone-400">Loading checkout…</div>;
    }

    return (
        <div className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6">
            <h1 className="font-display text-3xl font-semibold">Checkout</h1>

            <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_24rem]">
                <div className="min-w-0 space-y-10">
                    {/* 1 — Address */}
                    <section>
                        <h2 className="font-display text-xl font-semibold">Delivery address</h2>
                        {saved && saved.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {saved.map((a) => (
                                    <button
                                        key={a.id}
                                        type="button"
                                        aria-pressed={selectedSaved === a.id}
                                        onClick={() => {
                                            setSelectedSaved(a.id);
                                            setAddress({
                                                fullName: a.fullName, phone: a.phone, email: session?.user.email ?? address.email,
                                                line1: a.line1, line2: a.line2 ?? "", city: a.city, state: a.state, pincode: a.pincode,
                                            });
                                        }}
                                        className={`block w-full rounded-xl border p-4 text-left transition ${selectedSaved === a.id ? "border-ink bg-white" : "border-stone-200 hover:border-stone-400"
                                            }`}
                                    >
                                        <span className="text-sm font-medium">
                                            {a.fullName}
                                            {a.isDefault && <span className="ml-2 rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold text-paper">DEFAULT</span>}
                                        </span>
                                        <span className="mt-0.5 block truncate text-xs text-stone-500">
                                            {a.line1}, {a.city}, {a.state} — {a.pincode}
                                        </span>
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    aria-pressed={selectedSaved === null}
                                    onClick={() => { setSelectedSaved(null); setAddress(EMPTY); }}
                                    className="block w-full rounded-xl border border-dashed border-stone-300 p-4 text-left text-sm text-stone-500 transition hover:border-ink hover:text-ink"
                                >
                                    + Use a new address
                                </button>
                            </div>
                        )}
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <Field label="Full name" required autoComplete="name" value={address.fullName}
                                onChange={(e) => setAddress({ ...address, fullName: e.target.value })} />
                            <Field label="Phone" required type="tel" autoComplete="tel" inputMode="tel" value={address.phone}
                                onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
                            <Field label="Email" required type="email" autoComplete="email" value={address.email}
                                onChange={(e) => setAddress({ ...address, email: e.target.value })} />
                            <Field label="PIN code" required inputMode="numeric" pattern="\d{6}" autoComplete="postal-code" value={address.pincode}
                                onChange={(e) => setAddress({ ...address, pincode: e.target.value })} />
                            <div className="sm:col-span-2">
                                <Field label="Address line 1" required autoComplete="address-line1" value={address.line1}
                                    onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
                            </div>
                            <div className="sm:col-span-2">
                                <Field label="Address line 2 (optional)" autoComplete="address-line2" value={address.line2}
                                    onChange={(e) => setAddress({ ...address, line2: e.target.value })} />
                            </div>
                            <Field label="City" required autoComplete="address-level2" value={address.city}
                                onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                            <Field label="State" required autoComplete="address-level1" value={address.state}
                                onChange={(e) => setAddress({ ...address, state: e.target.value })} />
                            {session?.user && (
                                <label className="mt-4 flex items-center gap-2 text-sm text-stone-600">
                                    <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="accent-[#1c1917]" />
                                    Save this address to my account
                                </label>
                            )}
                        </div>
                    </section>

                    {/* 2 — Delivery */}
                    <section>
                        <h2 className="font-display text-xl font-semibold">Delivery speed</h2>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {(["standard", "express"] as const).map((m) => (
                                <label
                                    key={m}
                                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${deliveryMethod === m ? "border-ink bg-white" : "border-stone-200 hover:border-stone-400"
                                        }`}
                                >
                                    <input
                                        type="radio" name="delivery" className="mt-1 accent-[#1c1917]"
                                        checked={deliveryMethod === m} onChange={() => setDeliveryMethod(m)}
                                    />
                                    <span className="flex-1">
                                        <span className="flex items-center justify-between text-sm font-medium">
                                            {m === "standard" ? "Standard" : "Express"}
                                            {m === "express" ? <Zap className="size-4 text-sale" /> : <Truck className="size-4" />}
                                        </span>
                                        <span className="mt-0.5 block text-xs text-stone-500">
                                            {m === "standard"
                                                ? "2–4 business days · ₹100 (free over ₹1,999)"
                                                : "1–2 business days · ₹199 flat"}
                                        </span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    </section>

                    {/* 3 — Payment */}
                    <section>
                        <h2 className="font-display text-xl font-semibold">Payment</h2>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${paymentMethod === "RAZORPAY" ? "border-ink bg-white" : "border-stone-200 hover:border-stone-400"
                                }`}>
                                <input type="radio" name="payment" className="mt-1 accent-[#1c1917]"
                                    checked={paymentMethod === "RAZORPAY"} onChange={() => setPaymentMethod("RAZORPAY")} />
                                <span className="flex-1">
                                    <span className="flex items-center justify-between text-sm font-medium">
                                        Pay Online <CreditCard className="size-4" />
                                    </span>
                                    <span className="mt-0.5 block text-xs text-stone-500">UPI · Cards · Netbanking · Wallets — via Razorpay</span>
                                </span>
                            </label>
                            <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${paymentMethod === "COD" ? "border-ink bg-white" : "border-stone-200 hover:border-stone-400"
                                }`}>
                                <input type="radio" name="payment" className="mt-1 accent-[#1c1917]"
                                    checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} />
                                <span className="flex-1">
                                    <span className="flex items-center justify-between text-sm font-medium">
                                        Cash on Delivery <Banknote className="size-4" />
                                    </span>
                                    <span className="mt-0.5 block text-xs text-stone-500">Pay in cash when your order arrives</span>
                                </span>
                            </label>
                        </div>
                    </section>

                    {(quote?.problems.length ?? 0) > 0 && (
                        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            {quote!.problems.map((p, index) => (
                                <p key={`${p}-${index}`}>{p}</p>
                            ))}
                        </div>
                    )}
                    {error && (
                        <div className="rounded-lg border border-sale/30 bg-sale/5 px-4 py-3 text-sm text-sale" role="alert">
                            {error.problems.map((p) => <p key={p}>{p}</p>)}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handlePlace}
                        disabled={!canPlace}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-paper transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {verifying ? "Verifying payment…" : placing ? "Placing order…" : paymentMethod === "COD" ? (
                            `Place Order — ${formatPaise(quote?.total ?? 0)}`
                        ) : (
                            <>
                                <Lock className="size-4" /> Pay {formatPaise(quote?.total ?? 0)}
                            </>
                        )}
                    </button>
                    <p className="text-center text-xs text-stone-500">
                        {paymentMethod === "RAZORPAY"
                            ? "You'll complete payment in Razorpay's secure window."
                            : "Keep exact change ready for the delivery partner."}
                    </p>
                </div>

                {/* 4 — Summary */}
                <aside className="lg:sticky lg:top-24 lg:self-start">
                    <div className="rounded-xl border border-stone-200 bg-white p-6">
                        <h2 className="font-display text-lg font-semibold">Order summary</h2>
                        <ul className="mt-4 space-y-4">
                            {items.map((i) => {
                                const line = quote?.lines.find((l) => l.variantId === i.variantId);
                                const unit = line?.unitPrice ?? i.unitPrice;
                                return (
                                    <li key={i.variantId} className="flex gap-3">
                                        <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-stone-100">
                                            {i.imageUrl && <Image src={i.imageUrl} alt="" fill sizes="48px" className="object-cover" />}
                                        </div>
                                        <div className="min-w-0 flex-1 text-sm">
                                            <p className="truncate font-medium">{i.name}</p>
                                            <p className="text-xs text-stone-500">
                                                {[i.variantLabel, `Qty ${i.quantity}`].filter(Boolean).join(" · ")}
                                            </p>
                                        </div>
                                        <span className="text-sm font-medium">{formatPaise(unit * i.quantity)}</span>
                                    </li>
                                );
                            })}
                        </ul>
                        <dl className="mt-5 space-y-2 border-t border-stone-200 pt-4 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-stone-500">Subtotal</dt>
                                <dd>{formatPaise(quote?.subtotal ?? 0)}</dd>
                            </div>
                            {quote?.discount ? (
                                <div className="flex justify-between text-green-700">
                                    <dt>Coupon</dt>
                                    <dd>−{formatPaise(quote.discount)}</dd>
                                </div>
                            ) : null}
                            <div className="flex justify-between">
                                <dt className="text-stone-500">Shipping</dt>
                                <dd>{quote?.shippingFee ? formatPaise(quote.shippingFee) : "Free"}</dd>
                            </div>
                            <div className="flex justify-between border-t border-stone-200 pt-3 text-base font-semibold">
                                <dt>Total</dt>
                                <dd>{formatPaise(quote?.total ?? 0)}</dd>
                            </div>
                        </dl>
                        <p className="mt-3 flex items-center gap-1.5 text-xs text-stone-500">
                            <ShieldCheck className="size-3.5" /> Prices include all taxes
                        </p>
                        <Link href="/cart" className="mt-4 block text-center text-xs font-medium text-stone-500 hover:text-ink">
                            ← Edit cart
                        </Link>
                    </div>
                </aside>
            </div>
        </div>
    );
}
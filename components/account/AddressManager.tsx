"use client";

import { useState } from "react";
import { Pencil, Star, Trash2 } from "lucide-react";

export type Addr = {
    id: string; fullName: string; phone: string; line1: string; line2: string | null;
    city: string; state: string; pincode: string; isDefault: boolean;
};

const EMPTY = { fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" };

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</span>
            <input {...props}
                className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-ink" />
        </label>
    );
}

export function AddressManager({ initial }: { initial: Addr[] }) {
    const [list, setList] = useState(initial);
    const [form, setForm] = useState({ ...EMPTY });
    const [editId, setEditId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const payload = () => ({
        fullName: form.fullName.trim(), phone: form.phone.trim(), line1: form.line1.trim(),
        line2: form.line2.trim(), city: form.city.trim(), state: form.state.trim(), pincode: form.pincode.trim(),
    });

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setBusy(true);
        try {
            const res = await fetch(editId ? `/api/addresses/${editId}` : "/api/addresses", {
                method: editId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload()),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.problems?.[0] ?? data.error ?? "Couldn't save the address");
                return;
            }
            const saved: Addr = data.address;
            setList((l) => {
                const rest = l.filter((a) => a.id !== saved.id).map((a) => (saved.isDefault ? { ...a, isDefault: false } : a));
                return saved.isDefault ? [saved, ...rest] : [...rest, saved].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
            });
            setForm({ ...EMPTY });
            setEditId(null);
        } finally {
            setBusy(false);
        }
    }

    async function remove(id: string) {
        const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const promo = data?.newDefaultId as string | null;
        setList((l) => l.filter((a) => a.id !== id).map((a) => (promo && a.id === promo ? { ...a, isDefault: true } : a)));
    }

    async function makeDefault(id: string) {
        const res = await fetch(`/api/addresses/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isDefault: true }),
        });
        if (res.ok) setList((l) => l.map((a) => ({ ...a, isDefault: a.id === id })));
    }

    function startEdit(a: Addr) {
        setEditId(a.id);
        setError(null);
        setForm({ fullName: a.fullName, phone: a.phone, line1: a.line1, line2: a.line2 ?? "", city: a.city, state: a.state, pincode: a.pincode });
    }

    const iconBtn = "grid size-8 place-items-center rounded-full text-stone-500 transition hover:bg-stone-100";

    return (
        <div>
            <h1 className="font-display text-3xl font-semibold">Addresses</h1>

            {list.length > 0 && (
                <ul className="mt-6 space-y-3">
                    {list.map((a) => (
                        <li key={a.id} className={`rounded-xl border bg-white p-4 ${a.isDefault ? "border-ink" : "border-stone-200"}`}>
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium">
                                        {a.fullName}
                                        {a.isDefault && (
                                            <span className="ml-2 rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold text-paper">DEFAULT</span>
                                        )}
                                    </p>
                                    <p className="mt-1 text-sm leading-relaxed text-stone-600">
                                        {a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />
                                        {a.city}, {a.state} — {a.pincode}<br />
                                        {a.phone}
                                    </p>
                                </div>
                                <div className="flex shrink-0 gap-1">
                                    {!a.isDefault && (
                                        <button onClick={() => makeDefault(a.id)} aria-label="Set as default" title="Set as default" className={iconBtn}>
                                            <Star className="size-4" />
                                        </button>
                                    )}
                                    <button onClick={() => startEdit(a)} aria-label={`Edit ${a.fullName}`} className={iconBtn}>
                                        <Pencil className="size-4" />
                                    </button>
                                    <button onClick={() => remove(a.id)} aria-label={`Delete ${a.fullName}`} className={`${iconBtn} hover:text-sale`}>
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <form onSubmit={submit} className="mt-8 rounded-xl border border-stone-200 bg-white p-6">
                <h2 className="font-display text-lg font-semibold">{editId ? "Edit address" : "Add a new address"}</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Field label="Full name" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                    <Field label="Phone" required type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    <div className="sm:col-span-2">
                        <Field label="Address line 1" required value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
                    </div>
                    <div className="sm:col-span-2">
                        <Field label="Address line 2 (optional)" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} />
                    </div>
                    <Field label="City" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                    <Field label="State" required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                    <Field label="PIN code" required inputMode="numeric" pattern="\d{6}" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
                </div>
                {error && <p className="mt-4 text-sm text-sale" role="alert">{error}</p>}
                <div className="mt-5 flex gap-3">
                    <button type="submit" disabled={busy}
                        className="rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper transition hover:bg-stone-800 disabled:opacity-40">
                        {busy ? "Saving…" : editId ? "Save changes" : "Add address"}
                    </button>
                    {editId && (
                        <button type="button" onClick={() => { setEditId(null); setForm({ ...EMPTY }); }}
                            className="rounded-full border border-stone-300 px-6 py-2.5 text-sm font-medium transition hover:border-ink">
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
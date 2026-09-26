"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { slugify } from "@/lib/slug";

type Cat = {
    id: string; name: string; slug: string; parentId: string | null;
    imageUrl: string | null; productCount: number; parentName: string | null;
};

export function CategoryManager({ initial }: { initial: Cat[] }) {
    const [list, setList] = useState(initial);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [slugEdited, setSlugEdited] = useState(false);
    const [parentId, setParentId] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [editId, setEditId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    function reset() {
        setEditId(null); setName(""); setSlug(""); setSlugEdited(false);
        setParentId(""); setImageUrl(""); setError(null);
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setBusy(true);
        try {
            const res = await fetch(editId ? `/api/admin/categories/${editId}` : "/api/admin/categories", {
                method: editId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    slug: slugify(slugEdited ? slug : name),
                    parentId: parentId || null,
                    imageUrl: imageUrl.trim(),
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.problems?.[0] ?? data.error ?? "Couldn't save the category");
                return;
            }
            // Cheap and correct: reload the list from the server's source of truth
            window.location.reload();
        } finally {
            setBusy(false);
        }
    }

    async function remove(c: Cat) {
        if (!window.confirm(`Delete "${c.name}"?`)) return;
        setError(null);
        const res = await fetch(`/api/admin/categories/${c.id}`, { method: "DELETE" });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
            setError(data?.error ?? data?.problems?.[0] ?? "Couldn't delete");
            return;
        }
        setList((l) => l.filter((x) => x.id !== c.id));
    }

    function startEdit(c: Cat) {
        setEditId(c.id);
        setName(c.name);
        setSlug(c.slug);
        setSlugEdited(true);
        setParentId(c.parentId ?? "");
        setImageUrl(c.imageUrl ?? "");
        setError(null);
    }

    const input = "w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-ink";

    return (
        <div data-tour="admin-categories">
            <h1 className="font-display text-3xl font-semibold">Categories</h1>

            <ul className="mt-6 space-y-2">
                {list.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3">
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                                {c.parentName && <span className="text-stone-400">{c.parentName} › </span>}
                                {c.name}
                            </p>
                            <p className="truncate text-xs text-stone-500">/{c.slug} · {c.productCount} products</p>
                        </div>
                        <button onClick={() => startEdit(c)} aria-label={`Edit ${c.name}`}
                            className="grid size-8 place-items-center rounded-full text-stone-500 hover:bg-stone-100">
                            <Pencil className="size-4" />
                        </button>
                        <button onClick={() => remove(c)} aria-label={`Delete ${c.name}`}
                            className="grid size-8 place-items-center rounded-full text-stone-400 hover:text-sale">
                            <Trash2 className="size-4" />
                        </button>
                    </li>
                ))}
            </ul>

            <form onSubmit={submit} className="mt-8 rounded-xl border border-stone-200 bg-white p-6">
                <h2 className="font-display text-lg font-semibold">{editId ? "Edit category" : "Add a category"}</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Name</span>
                        <input required value={name} onChange={(e) => setName(e.target.value)} className={`mt-1.5 ${input}`} />
                    </label>
                    <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Slug</span>
                        <input required value={slugEdited ? slug : slugify(name)}
                            onChange={(e) => { setSlugEdited(true); setSlug(e.target.value); }}
                            className={`mt-1.5 ${input}`} />
                    </label>
                    <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Parent (optional)</span>
                        <select value={parentId} onChange={(e) => setParentId(e.target.value)} className={`mt-1.5 ${input}`}>
                            <option value="">— Top level —</option>
                            {list.filter((c) => c.id !== editId).map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </label>
                    <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Image URL (optional)</span>
                        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className={`mt-1.5 ${input}`} />
                    </label>
                </div>
                {error && <p className="mt-4 text-sm text-sale" role="alert">{error}</p>}
                <div className="mt-5 flex gap-3">
                    <button type="submit" disabled={busy}
                        className="rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper transition hover:bg-stone-800 disabled:opacity-40">
                        {busy ? "Saving…" : editId ? "Save changes" : "Add category"}
                    </button>
                    {editId && (
                        <button type="button" onClick={reset}
                            className="rounded-full border border-stone-300 px-6 py-2.5 text-sm font-medium transition hover:border-ink">
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
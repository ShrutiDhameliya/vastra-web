"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { ArrowDown, ArrowUp, Loader2, Trash2, Upload } from "lucide-react";

type ImageRow = { id?: string; url: string; alt: string };

export function ImageField({
    image, onChange, onMoveUp, onMoveDown, onRemove, isFirst, isLast,
}: {
    image: ImageRow;
    onChange: (patch: Partial<ImageRow>) => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onRemove: () => void;
    isFirst: boolean;
    isLast: boolean;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleFile(file: File) {
        setError(null);
        if (!file.type.startsWith("image/")) return setError("That's not an image file");
        if (file.size > 4 * 1024 * 1024) return setError("Images must be 4 MB or smaller");
        setUploading(true);
        try {
            const blob = await upload(file.name, file, {
                access: "public",
                handleUploadUrl: "/api/admin/upload",
            });
            onChange({ url: blob.url });
        } catch {
            setError("Upload failed — check your connection and try again");
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    }

    const input =
        "w-full min-w-0 rounded-lg border border-stone-300 px-2.5 py-2 text-sm outline-none focus:border-ink";

    return (
        <div>
            <div className="flex items-center gap-2">
                <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded border border-stone-200 bg-stone-100">
                    {image.url && <img src={image.url} alt="" className="h-full w-full object-cover" />}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row">
                    <input className={input} placeholder="Image URL (or upload)" aria-label="Image URL"
                        value={image.url} onChange={(e) => onChange({ url: e.target.value })} />
                    <input className={input} placeholder="Alt text" aria-label="Image alt text"
                        value={image.alt} onChange={(e) => onChange({ alt: e.target.value })} />
                </div>
                <input
                    ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
                />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                    aria-label="Upload image file" title="Upload image file"
                    className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-stone-100 disabled:opacity-40">
                    {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                </button>
                <button type="button" onClick={onMoveUp} disabled={isFirst} aria-label="Move up"
                    className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-stone-100 disabled:opacity-30">
                    <ArrowUp className="size-4" />
                </button>
                <button type="button" onClick={onMoveDown} disabled={isLast} aria-label="Move down"
                    className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-stone-100 disabled:opacity-30">
                    <ArrowDown className="size-4" />
                </button>
                <button type="button" onClick={onRemove} aria-label="Remove image"
                    className="grid size-9 shrink-0 place-items-center rounded-full text-stone-400 hover:text-sale">
                    <Trash2 className="size-4" />
                </button>
            </div>
            {error && <p className="mt-1 text-xs text-sale">{error}</p>}
        </div>
    );
}
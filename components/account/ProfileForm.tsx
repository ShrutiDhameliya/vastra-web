// components/account/ProfileForm.tsx
"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</span>
            <input {...props}
                className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-ink disabled:bg-stone-100 disabled:text-stone-500" />
        </label>
    );
}

export function ProfileForm({ user }: { user: { name: string; email: string; phone: string | null } }) {
    const [name, setName] = useState(user.name);
    const [phone, setPhone] = useState(user.phone ?? "");
    const [profileMsg, setProfileMsg] = useState<string | null>(null);
    const [profileErr, setProfileErr] = useState<string | null>(null);

    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [pwMsg, setPwMsg] = useState<string | null>(null);
    const [pwErr, setPwErr] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    async function saveProfile(e: React.FormEvent) {
        e.preventDefault();
        setProfileMsg(null);
        setProfileErr(null);
        setBusy(true);
        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, phone }),
            });
            const data = await res.json();
            if (!res.ok) {
                setProfileErr(data.problems?.[0] ?? "Couldn't save your profile");
                return;
            }
            setProfileMsg("Profile updated");
            await authClient.getSession(); // refresh the session store so the header name updates
        } finally {
            setBusy(false);
        }
    }

    async function changePassword(e: React.FormEvent) {
        e.preventDefault();
        setPwMsg(null);
        setPwErr(null);
        if (next.length < 8) return setPwErr("New password must be at least 8 characters");
        if (next !== confirm) return setPwErr("New passwords don't match");
        setBusy(true);
        try {
            const { error } = await authClient.changePassword({
                currentPassword: current,
                newPassword: next,
                revokeOtherSessions: true,
            });
            if (error) {
                setPwErr(error.message ?? "Couldn't change your password");
                return;
            }
            setPwMsg("Password changed — other sessions were signed out");
            setCurrent(""); setNext(""); setConfirm("");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="space-y-12">
            <section>
                <h1 className="font-display text-3xl font-semibold">Profile</h1>
                <form onSubmit={saveProfile} className="mt-6 max-w-md space-y-4">
                    <Field label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
                    <Field label="Email" value={user.email} disabled title="Email changes require account tools not built yet" />
                    <Field label="Phone" type="tel" inputMode="tel" placeholder="10-digit mobile" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    {profileErr && <p className="text-sm text-sale" role="alert">{profileErr}</p>}
                    {profileMsg && <p className="text-sm text-green-700">{profileMsg}</p>}
                    <button type="submit" disabled={busy}
                        className="rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper transition hover:bg-stone-800 disabled:opacity-40">
                        {busy ? "Saving…" : "Save changes"}
                    </button>
                </form>
            </section>

            <section>
                <h2 className="font-display text-xl font-semibold">Change password</h2>
                <form onSubmit={changePassword} className="mt-4 max-w-md space-y-4">
                    <Field label="Current password" type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
                    <Field label="New password (8+)" type="password" required autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
                    <Field label="Confirm new password" type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                    {pwErr && <p className="text-sm text-sale" role="alert">{pwErr}</p>}
                    {pwMsg && <p className="text-sm text-green-700">{pwMsg}</p>}
                    <button type="submit" disabled={busy}
                        className="rounded-full border border-ink px-6 py-2.5 text-sm font-medium transition hover:bg-ink hover:text-paper disabled:opacity-40">
                        {busy ? "Updating…" : "Update password"}
                    </button>
                </form>
            </section>
        </div>
    );
}
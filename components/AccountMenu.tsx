"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, MapPin, Package, User } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function AccountMenu() {
  const { data: session, isPending } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // While loading or logged out: a plain icon — works either way
  if (isPending || !session) {
    return (
      <Link href="/login" aria-label={isPending ? "Account" : "Sign in"}
        className="grid size-10 place-items-center rounded-full text-stone-700 transition hover:bg-stone-100 hover:text-ink">
        <User className="size-5" />
      </Link>
    );
  }

  const initials = session.user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  async function signOut() {
    setOpen(false);
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  const item = "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-stone-700 transition hover:bg-stone-100";

  return (
    <div className="relative">
      {open && <button aria-hidden className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Account menu"
        className="relative z-40 grid size-10 place-items-center rounded-full bg-ink text-xs font-semibold text-paper"
      >
        {initials}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-40 w-56 rounded-xl border border-stone-200 bg-white p-2 shadow-lg">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium">{session.user.name}</p>
            <p className="truncate text-xs text-stone-500">{session.user.email}</p>
          </div>
          <div className="my-1 border-t border-stone-100" />
          <Link href="/account/orders" onClick={() => setOpen(false)} className={item}><Package className="size-4" /> My Orders</Link>
          <Link href="/account/addresses" onClick={() => setOpen(false)} className={item}><MapPin className="size-4" /> Addresses</Link>
          <Link href="/account/profile" onClick={() => setOpen(false)} className={item}><User className="size-4" /> Profile</Link>
          <div className="my-1 border-t border-stone-100" />
          <button onClick={signOut} className={`${item} text-sale hover:bg-red-50`}>
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
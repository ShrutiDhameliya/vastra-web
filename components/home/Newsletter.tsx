"use client";

import { useState } from "react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <section data-tour="newsletter" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <div className="rounded-xl border border-stone-200 bg-white px-6 py-10 text-center sm:px-10">
        <h2 className="font-display text-2xl font-semibold">Stay in the loop</h2>
        <p className="mt-2 text-sm text-stone-600">
          New arrivals, restocks and members-only offers. No spam, unsubscribe anytime.
        </p>
        {done ? (
          <p className="mt-6 text-sm font-medium text-green-700">
            Thanks — you&apos;re on the list.
          </p>
        ) : (
          <form
            className="mx-auto mt-6 flex max-w-md gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (email.includes("@")) setDone(true); // wired to real storage later
            }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-full border border-stone-300 px-4 py-2.5 text-sm outline-none transition focus:border-ink"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper transition hover:bg-stone-800"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useCartStore, selectCartCount } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { AccountMenu } from "./AccountMenu";

const NAV_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "New Arrivals", href: "/shop?sort=new" },
  { label: "Sale", href: "/shop?sale=true", accent: true },
];

function SearchBox({ dataTour }: { dataTour?: string }) {
  return (
    <form action="/shop" data-tour={dataTour} className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />

      <input
        type="search"
        name="q"
        placeholder="Search products…"
        className="w-full rounded-full border border-stone-300 bg-white py-1.5 pl-9 pr-3 text-sm outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10"
      />
    </form>
  );
}

function IconLink({
  href,
  label,
  count,
  dataTour,
  children,
}: {
  href: string;
  label: string;
  count?: number;
  dataTour?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      data-tour={dataTour}
      className="relative grid size-10 place-items-center rounded-full text-stone-700 transition hover:bg-stone-100 hover:text-ink"
    >
      {children}

      {!!count && count > 0 && (
        <span className="absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-ink px-1 text-[10px] font-semibold leading-4 text-paper">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const cartCount = useCartStore(selectCartCount);
  const wishlistIds = useWishlistStore((s) => s.productIds);

  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          data-tour="menu-btn"
          className="-ml-2 grid size-10 place-items-center rounded-full hover:bg-stone-100 md:hidden"
        >
          <Menu className="size-5" />
        </button>

        {/* Logo */}
        <Link
          href="/"
          data-tour="logo"
          className="font-display text-2xl font-semibold tracking-tight"
        >
          Vastra
        </Link>

        {/* Desktop navigation */}
        <nav
          data-tour="nav"
          className="ml-10 hidden items-center gap-7 text-sm font-medium md:flex"
          aria-label="Main"
        >
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`transition hover:text-stone-500 ${l.accent ? "text-sale" : ""
                }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-1">

          {/* Desktop search */}
          <div className="mr-2 hidden w-56 md:block">
            <SearchBox dataTour="search" />
          </div>

          {/* Wishlist */}
          <IconLink
            href="/wishlist"
            label="Wishlist"
            count={mounted ? wishlistIds.length : 0}
            dataTour="wishlist-icon"
          >
            <Heart className="size-5" />
          </IconLink>

          {/* Cart */}
          <IconLink
            href="/cart"
            label="Cart"
            count={mounted ? cartCount : 0}
            dataTour="cart-icon"
          >
            <ShoppingBag className="size-5" />
          </IconLink>

          <AccountMenu />
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">

          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMenuOpen(false)}
          />

          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-6 bg-paper p-6 shadow-xl">

            {/* Mobile menu header */}
            <div className="flex items-center justify-between">
              <span className="font-display text-xl font-semibold">
                Vastra
              </span>

              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="grid size-9 place-items-center rounded-full hover:bg-stone-100"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Mobile search */}
            <SearchBox />

            {/* Mobile navigation */}
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-stone-100 ${l.accent ? "text-sale" : ""
                    }`}
                >
                  {l.label}
                </Link>
              ))}

              <Link
                href="/account"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-stone-100"
              >
                Account
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

import Link from "next/link";
import { StartTourButton } from "./tour/StartTourButton";

const COLUMNS: { title: string; links: { label: string; href?: string; tour?: boolean }[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "All Products", href: "/shop" },
      { label: "New Arrivals", href: "/shop?sort=new" },
      { label: "Sale", href: "/shop?sale=true" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Take a Tour", tour: true },
      { label: "Track Order", href: "/account/orders" },
      { label: "Shipping & Returns", href: "/support/shipping" },
      { label: "Contact Us", href: "/support/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-stone-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1fr_auto_auto_auto]">
        <div>
          <p className="font-display text-xl font-semibold">Vastra</p>
          <p className="mt-2 max-w-xs text-sm text-stone-500">
            Considered essentials for modern living. Designed in India, priced honestly.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">{col.title}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.tour ? (
                    <StartTourButton className="text-stone-600 hover:text-ink" />
                  ) : (
                    <Link href={l.href!} className="text-stone-600 hover:text-ink">{l.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-stone-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 text-xs text-stone-500 sm:px-6">
          <p>© {new Date().getFullYear()} Vastra Commerce Pvt. Ltd.</p>
          <p>Prices in INR · Payments secured by Razorpay</p>
        </div>
      </div>
    </footer>
  );
}
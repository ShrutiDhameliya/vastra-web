import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WishlistSync } from "@/components/WishlistSync";
import { TourRoot } from "@/components/tour/TourRoot";
import { TourPrompt } from "@/components/tour/TourPrompt";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const display = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Vastra — Modern Essentials", template: "%s — Vastra" },
  description:
    "Considered essentials for modern living. Free shipping over ₹1,999, easy 7-day returns.",
  openGraph: {
    siteName: "Vastra",
    type: "website",
    title: "Vastra — Modern Essentials",
    description: "Considered essentials for modern living. Free shipping over ₹1,999, easy 7-day returns.",
    // Drop a 1200×630 image at public/og.jpg and add: images: ["/og.jpg"]
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-paper"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="min-h-[60vh]">{children}</main>
        <Footer />
        <TourRoot />
        <TourPrompt />
        <WishlistSync />
      </body>
    </html>
  );
}
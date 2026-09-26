import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "My Wishlist",
    robots: {
        index: false,
    },
};

export default function WishlistLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <>{children}</>;
}
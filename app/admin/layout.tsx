import type { Metadata } from "next";
import { getSessionUser } from "@/lib/session";
import { AdminNav } from "@/components/admin/AdminNav";

// Admin data must never be cached — everything under /admin is always fresh
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    // Middleware already bounces guests; this covers edge cases
    return null;
  }
  if (user.role !== "ADMIN") return null; // pages call requireAdmin() too

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside>
          <p className="font-display text-xl font-semibold">Admin</p>
          <p className="truncate text-xs text-stone-500">{user.name}</p>
          <AdminNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
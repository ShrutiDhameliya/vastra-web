import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "./db";
import { getSessionUser } from "./session";

/** Page guard — bounces guests to login, non-admins home. Call at the top of
 *  every admin page (layouts render in parallel with pages, so pages don't
 *  inherit its guarantees). */
export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

/** API guard — role read fresh from the DB, not from the session payload. */
export async function isAdminRequest(req: Request): Promise<boolean> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return false;
  const row = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return row?.role === "ADMIN";
}

/** The single source of truth for the sale filter — the debt from the shop
 *  phase, now repaid. Every price/mrp write goes through here. */
export function computeDiscountPercent(price: number, mrp: number | null): number {
  if (mrp == null || mrp <= price) return 0;
  return Math.min(100, Math.round((1 - price / mrp) * 100));
}
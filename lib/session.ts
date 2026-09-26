import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "./auth";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
};

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const u = session.user as SessionUser;
  return { id: u.id, name: u.name, email: u.email, phone: u.phone ?? null, role: u.role ?? "CUSTOMER" };
});

/** Guest orders (userId null) stay link-accessible; orders bound to an
 *  account require that account's session. */
export function canViewOrder(order: { userId: string | null }, user: { id: string } | null): boolean {
  return order.userId == null || order.userId === user?.id;
}
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AddressManager } from "@/components/account/AddressManager";

export const metadata: Metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const user = await getSessionUser();
  if (!user) return null;
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return <AddressManager initial={addresses} />;
}
// app/account/profile/page.tsx
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/session";
import { ProfileForm } from "@/components/account/ProfileForm";

export const metadata: Metadata = { title: "Profile & Security" };

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <ProfileForm user={{ name: user.name, email: user.email, phone: user.phone }} />;
}
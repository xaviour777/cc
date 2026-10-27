import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth";
import AdminNav from "@/components/admin/nav";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — Colony Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="flex min-h-screen bg-mist text-ink">
      <AdminNav email={user.email} />
      <main className="flex-1 min-w-0 px-4 md:px-8 py-6 md:py-8 max-w-[1400px]">{children}</main>
    </div>
  );
}

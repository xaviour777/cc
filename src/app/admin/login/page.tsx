import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import AdminLoginForm from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Admin sign in" };

export default async function AdminLoginPage() {
  const user = await getSessionUser();
  if (user?.role === "ADMIN") redirect("/admin");
  return (
    <div className="min-h-screen bg-mist flex items-center justify-center px-5">
      <AdminLoginForm />
    </div>
  );
}

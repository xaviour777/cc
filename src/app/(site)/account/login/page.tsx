import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMember } from "@/lib/members";
import { MemberLoginForm } from "@/components/account/forms";

export const metadata: Metadata = { title: "Member sign in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function MemberLoginPage() {
  if (await getMember()) redirect("/account");
  return (
    <div className="px-5 md:px-10 py-20 md:py-28">
      <MemberLoginForm />
    </div>
  );
}

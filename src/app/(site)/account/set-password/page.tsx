import type { Metadata } from "next";
import Link from "next/link";
import { tokenIsValid } from "@/lib/members";
import { SetPasswordForm } from "@/components/account/forms";

export const metadata: Metadata = { title: "Set your password", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const valid = token ? await tokenIsValid(token) : false;
  return (
    <div className="px-5 md:px-10 py-20 md:py-28">
      {valid && token ? (
        <SetPasswordForm token={token} />
      ) : (
        <div className="text-center max-w-md mx-auto">
          <h1 className="display-md">This link has expired.</h1>
          <p className="text-ink-soft mt-3">Links work once and for 7 days. Get a fresh one below.</p>
          <Link href="/account/forgot" className="btn btn-primary mt-6">Get a new link</Link>
        </div>
      )}
    </div>
  );
}

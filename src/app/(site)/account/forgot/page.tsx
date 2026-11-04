import type { Metadata } from "next";
import { ForgotForm } from "@/components/account/forms";

export const metadata: Metadata = { title: "Password link", robots: { index: false } };

export default function ForgotPage() {
  return (
    <div className="px-5 md:px-10 py-20 md:py-28">
      <ForgotForm />
    </div>
  );
}

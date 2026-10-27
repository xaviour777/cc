import type { ReactNode } from "react";
import Header from "@/components/site/header";
import Footer from "@/components/site/footer";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="pt-[68px] min-h-screen">{children}</main>
      <Footer />
    </>
  );
}

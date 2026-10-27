"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BedDouble,
  BookOpenText,
  CalendarDays,
  ExternalLink,
  FileBarChart,
  FileCheck2,
  Handshake,
  Images,
  Inbox,
  LayoutDashboard,
  Loader2,
  LogOut,
  Settings,
  SwitchCamera,
  Users,
  Wallet,
} from "lucide-react";
import { adminLogout } from "@/app/admin/actions";
import { cx } from "@/lib/utils";
import { ColonyMark } from "@/components/ui/icons";

const NAV = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", Icon: BedDouble },
  { href: "/admin/guests", label: "Guests", Icon: Users },
  { href: "/admin/rooms", label: "Rooms & Beds", Icon: SwitchCamera },
  { href: "/admin/checkin", label: "Check-In / Out", Icon: Handshake },
  { href: "/admin/payments", label: "Payments", Icon: Wallet },
  { href: "/admin/kyc", label: "KYC & Agreements", Icon: FileCheck2 },
  { href: "/admin/events", label: "Events", Icon: CalendarDays },
  { href: "/admin/proposals", label: "Event Requests", Icon: Inbox },
  { href: "/admin/articles", label: "Journal / Articles", Icon: BookOpenText },
  { href: "/admin/social", label: "Social Feed", Icon: Images },
  { href: "/admin/studio", label: "Studio & Call Pod", Icon: SwitchCamera },
  { href: "/admin/reports", label: "Reports", Icon: FileBarChart },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
];

export default function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-line bg-paper min-h-screen sticky top-0 h-screen overflow-y-auto">
        <Link href="/admin" className="flex items-center gap-2.5 px-5 h-16 border-b border-line">
          <ColonyMark className="w-7 h-7" />
          <span className="font-display font-extrabold text-sm leading-none">
            CONTENT<br />COLONY
          </span>
        </Link>
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {NAV.map(({ href, label, Icon }) => {
            const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cx(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium transition-colors",
                  active ? "bg-ink text-paper" : "text-ink-soft hover:bg-mist hover:text-ink"
                )}
              >
                <Icon size={16} /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-line space-y-2">
          <Link href="/" className="flex items-center gap-2 text-[12.5px] text-ink-soft hover:text-ink px-3 py-1.5 transition-colors">
            <ExternalLink size={13} /> View site
          </Link>
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-[11.5px] text-ink-soft truncate max-w-28">{email}</span>
            <button
              onClick={async () => {
                setLeaving(true);
                await adminLogout();
                router.push("/admin/login");
                router.refresh();
              }}
              className="w-8 h-8 rounded-full border border-line flex items-center justify-center hover:border-ink transition-colors"
              aria-label="Log out"
            >
              {leaving ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile topbar */}
      <div className="md:hidden sticky top-0 z-40 bg-paper border-b border-line">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/admin" className="flex items-center gap-2">
            <ColonyMark className="w-6 h-6" />
            <span className="font-display font-extrabold text-xs">COLONY ADMIN</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="w-8 h-8 rounded-full border border-line flex items-center justify-center" aria-label="View site">
              <ExternalLink size={13} />
            </Link>
            <button
              onClick={async () => {
                setLeaving(true);
                await adminLogout();
                router.push("/admin/login");
                router.refresh();
              }}
              className="w-8 h-8 rounded-full border border-line flex items-center justify-center"
              aria-label="Log out"
            >
              {leaving ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />}
            </button>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar">
          {NAV.map(({ href, label }) => {
            const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cx(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium border transition-colors",
                  active ? "bg-ink text-paper border-ink" : "border-line text-ink-soft"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

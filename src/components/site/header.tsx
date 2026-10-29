"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Moon, Sun, ArrowUpRight } from "lucide-react";
import { cx } from "@/lib/utils";
import { ColonyMark, ColonyWordmark } from "@/components/ui/icons";

const NAV = [
  { href: "/stay", label: "Stay" },
  { href: "/events", label: "Events" },
  { href: "/community", label: "Community" },
  { href: "/journal", label: "Journal" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("cc-theme", next ? "dark" : "light");
    } catch {}
  };

  return (
    <>
      <header
        className={cx(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-paper/90 backdrop-blur-md border-b border-line"
            : "bg-transparent border-b border-transparent"
        )}
      >
        <div className="mx-auto max-w-[1440px] px-5 md:px-10 h-[68px] flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <ColonyMark className="w-11 h-10" />
            <ColonyWordmark className="h-[26px]" />
          </Link>

          <nav className="hidden lg:flex items-center gap-7">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "u-link text-[13.5px] font-medium tracking-wide",
                  pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href))
                    ? "active"
                    : "text-ink-soft"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-10 h-10 rounded-full border border-line flex items-center justify-center hover:border-ink transition-colors"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link href="/stay#book" className="btn btn-primary !py-2.5 !px-5 text-sm hidden sm:inline-flex">
              Find Your Stay
              <ArrowUpRight size={15} />
            </Link>
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="lg:hidden w-10 h-10 rounded-full border border-line flex items-center justify-center"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        className={cx(
          "fixed inset-0 z-[60] bg-paper flex flex-col transition-all duration-500 lg:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between px-5 h-[68px] border-b border-line">
          <div className="flex items-center gap-2.5">
            <ColonyMark className="w-11 h-10" />
            <ColonyWordmark className="h-[26px]" />
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="w-10 h-10 rounded-full border border-line flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 flex flex-col justify-center px-8 gap-1">
          {[{ href: "/", label: "Home" }, ...NAV].map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "display-md py-3 border-b border-line transition-all duration-500",
                open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              )}
              style={{ transitionDelay: `${80 + i * 55}ms` }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-8">
          <Link href="/stay#book" className="btn btn-primary w-full">
            Find Your Stay <ArrowUpRight size={16} />
          </Link>
          <p className="text-center text-xs text-ink-soft mt-4 tracking-wide">
            Come as a stranger. Create as a friend.
          </p>
        </div>
      </div>
    </>
  );
}

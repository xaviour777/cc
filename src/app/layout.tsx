import type { Metadata, Viewport } from "next";
import type React from "react";
import type { ReactNode } from "react";
import "./globals.css";

// Fonts load in the browser from Google Fonts, so the dev server never has
// to download them (that download fails on some networks).
const fontsHref =
  "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=Inter:wght@100..900&family=Instrument+Serif:ital@0;1&family=Noto+Nastaliq+Urdu:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Space+Grotesk:wght@500;600&display=swap";

const fontVars = {
  "--font-inter": '"Inter"',
  "--font-archivo": '"Archivo"',
  "--font-serif-accent": '"Instrument Serif"',
  "--font-urdu": '"Noto Nastaliq Urdu"',
} as React.CSSProperties;

// Every page reads live data (settings, rooms, prices), so render on request
// instead of at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:1002"),
  title: {
    default: "Content Colony — Your people are here.",
    template: "%s — Content Colony",
  },
  description:
    "A creative home in Lahore for people who build, create, explore, and never stop learning. Co-living, coworking, studio, events and community in Johar Town.",
  openGraph: {
    siteName: "Content Colony",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

const themeScript = `(function(){try{var t=localStorage.getItem('cc-theme');if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})()`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={fontsHref} />
      </head>
      <body style={fontVars} className="bg-paper text-ink font-sans antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}

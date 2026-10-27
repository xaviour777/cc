import type { MetadataRoute } from "next";
import { db } from "@/db";
import { articles, articleTranslations, events } from "@/db/schema";
import { ne } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL ?? "http://localhost:3000";
  const staticRoutes = ["", "/stay", "/events", "/community", "/journal", "/about", "/contact", "/neighborhood", "/host-event", "/booking"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));

  const [trs, evs] = await Promise.all([
    db.select().from(articleTranslations),
    db.select().from(events).where(ne(events.status, "DRAFT")),
  ]);
  const articleRoutes = trs.map((t) => ({
    url: `${base}/journal/${t.slug}${t.lang !== "en" ? `?lang=${t.lang}` : ""}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  const eventRoutes = evs.map((e) => ({
    url: `${base}/events/${e.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
  return [...staticRoutes, ...articleRoutes, ...eventRoutes];
}

export const dynamic = "force-dynamic";

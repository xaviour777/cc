import { and, desc, eq, lte, ne } from "drizzle-orm";
import { db } from "@/db";
import { articleTranslations, articles } from "@/db/schema";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET() {
  const base = process.env.SITE_URL ?? "http://localhost:3000";
  const rows = await db
    .select({ a: articles, t: articleTranslations })
    .from(articles)
    .innerJoin(
      articleTranslations,
      and(eq(articleTranslations.articleId, articles.id), eq(articleTranslations.lang, "en"))
    )
    .where(and(ne(articles.status, "DRAFT"), lte(articles.publishedAt, new Date())))
    .orderBy(desc(articles.publishedAt))
    .limit(30);

  const items = rows
    .map(
      (r) => `<item>
<title>${esc(r.t.title)}</title>
<link>${base}/journal/${r.t.slug}</link>
<guid>${base}/journal/${r.t.slug}</guid>
<description>${esc(r.t.excerpt)}</description>
<pubDate>${(r.a.publishedAt ?? r.a.createdAt).toUTCString()}</pubDate>
</item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>Content Colony Journal</title>
<link>${base}/journal</link>
<description>Daily articles &amp; creator stories from Content Colony, Lahore.</description>
${items}
</channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}

export const dynamic = "force-dynamic";

import { and, asc, desc, eq, ne, sql, inArray, lte } from "drizzle-orm";
import { db } from "@/db";
import {
  accommodationTypes,
  articleTranslations,
  articles,
  categories,
  eventRegistrations,
  events,
  ratePlans,
  socialPosts,
} from "@/db/schema";
import { getSetting } from "@/lib/stays";
import type { StayProduct } from "@/components/booking/booking-widget";

export async function getStayProducts(): Promise<StayProduct[]> {
  const types = await db
    .select()
    .from(accommodationTypes)
    .where(eq(accommodationTypes.active, true))
    .orderBy(asc(accommodationTypes.sortOrder));
  const plans = await db.select().from(ratePlans).where(eq(ratePlans.active, true));
  return types.map((t) => {
    const mine = plans.filter((p) => p.accommodationTypeId === t.id);
    return {
      key: t.key,
      name: t.name,
      tagline: t.tagline,
      nightlyPkr: mine.find((p) => p.unitNights === 1)?.pricePkr ?? 0,
      weeklyPkr: mine.find((p) => p.unitNights === 7)?.pricePkr ?? null,
      monthlyPkr: mine.find((p) => p.unitNights === 30)?.pricePkr ?? null,
      maxGuests: t.key === "SHARED_BUNK" ? 1 : 2,
    };
  });
}

export async function getAccommodationTypes() {
  return db
    .select()
    .from(accommodationTypes)
    .where(eq(accommodationTypes.active, true))
    .orderBy(asc(accommodationTypes.sortOrder));
}

export type PublicEvent = typeof events.$inferSelect & { seatsTaken: number };

export async function getPublicEvents(): Promise<PublicEvent[]> {
  const rows = await db
    .select()
    .from(events)
    .where(inArray(events.status, ["PUBLISHED", "FULL"]))
    .orderBy(desc(events.featured), asc(events.startDate));
  const counts = await db
    .select({
      eventId: eventRegistrations.eventId,
      count: sql<number>`count(*)`,
    })
    .from(eventRegistrations)
    .where(ne(eventRegistrations.status, "CANCELLED"))
    .groupBy(eventRegistrations.eventId);
  const map = new Map(counts.map((c) => [c.eventId, Number(c.count)]));
  return rows.map((e) => ({ ...e, seatsTaken: map.get(e.id) ?? 0 }));
}

export async function getEventBySlug(slug: string): Promise<PublicEvent | null> {
  const rows = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  const e = rows[0];
  if (!e) return null;
  const taken = await db
    .select({ count: sql<number>`count(*)` })
    .from(eventRegistrations)
    .where(and(eq(eventRegistrations.eventId, e.id), ne(eventRegistrations.status, "CANCELLED")));
  return { ...e, seatsTaken: Number(taken[0]?.count ?? 0) };
}

export type CardArticle = {
  id: number;
  slug: string;
  lang: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  authorName: string;
  publishedAt: Date | null;
  readingMinutes: number;
  featured: boolean;
  langs: string[];
};

export async function getArticles(lang = "en", limit = 30): Promise<CardArticle[]> {
  const rows = await db
    .select({
      article: articles,
      translation: articleTranslations,
      category: categories,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(
      articleTranslations,
      and(
        eq(articleTranslations.articleId, articles.id),
        eq(articleTranslations.lang, lang)
      )
    )
    .where(
      and(
        ne(articles.status, "DRAFT"),
        lte(articles.publishedAt, new Date(Date.now() + 5 * 60_000))
      )
    )
    .orderBy(desc(articles.featured), desc(articles.publishedAt))
    .limit(limit);

  // Fallback to any translation when the requested lang is missing
  const missing = rows.filter((r) => !r.translation);
  const fallbackMap = new Map<number, typeof articleTranslations.$inferSelect>();
  if (missing.length) {
    const fb = await db
      .select()
      .from(articleTranslations)
      .where(inArray(articleTranslations.articleId, missing.map((r) => r.article.id)));
    for (const t of fb) if (!fallbackMap.has(t.articleId)) fallbackMap.set(t.articleId, t);
  }

  const allTranslations = await db
    .select({ articleId: articleTranslations.articleId, lang: articleTranslations.lang })
    .from(articleTranslations)
    .where(inArray(articleTranslations.articleId, rows.map((r) => r.article.id)));
  const langMap = new Map<number, string[]>();
  for (const t of allTranslations) {
    langMap.set(t.articleId, [...(langMap.get(t.articleId) ?? []), t.lang]);
  }

  return rows
    .map((r) => {
      const t = r.translation ?? fallbackMap.get(r.article.id);
      if (!t) return null;
      return {
        id: r.article.id,
        slug: t.slug,
        lang: t.lang,
        title: t.title,
        excerpt: t.excerpt,
        coverImage: r.article.coverImage,
        categoryName: r.category?.nameEn ?? null,
        categorySlug: r.category?.slug ?? null,
        authorName: r.article.authorName,
        publishedAt: r.article.publishedAt,
        readingMinutes: r.article.readingMinutes,
        featured: r.article.featured,
        langs: langMap.get(r.article.id) ?? [t.lang],
      } satisfies CardArticle;
    })
    .filter((x): x is CardArticle => x != null);
}

export async function getArticleBySlug(slug: string, lang = "en") {
  const rows = await db
    .select({ article: articles, translation: articleTranslations, category: categories })
    .from(articleTranslations)
    .innerJoin(articles, eq(articleTranslations.articleId, articles.id))
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(eq(articleTranslations.slug, slug));
  if (!rows.length) return null;
  const preferred =
    rows.find((r) => r.translation.lang === lang) ??
    rows.find((r) => r.translation.lang === "en") ??
    rows[0];
  return {
    ...preferred,
    availableLangs: rows.map((r) => r.translation.lang),
  };
}

export async function getSocialPosts() {
  return db
    .select()
    .from(socialPosts)
    .where(eq(socialPosts.active, true))
    .orderBy(desc(socialPosts.featured), asc(socialPosts.sortOrder));
}

export async function getCategories() {
  return db.select().from(categories).orderBy(asc(categories.id));
}

export { getSetting };

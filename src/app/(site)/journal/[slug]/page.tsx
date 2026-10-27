import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Clock3 } from "lucide-react";
import { getArticleBySlug, getArticles, getEventBySlug } from "@/lib/data";
import { cx, formatDate } from "@/lib/utils";
import Reveal from "@/components/ui/reveal";
import ArticleBody from "@/components/journal/article-body";
import ArticleCard from "@/components/site/article-card";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { lang } = await searchParams;
  const data = await getArticleBySlug(slug, lang);
  if (!data) return { title: "Article not found" };
  return {
    title: data.article.seoTitle ?? data.translation.title,
    description: data.article.seoDescription ?? data.translation.excerpt,
    openGraph: { images: [data.article.ogImage ?? data.article.coverImage ?? ""] },
  };
}

const LANG_LABEL: Record<string, string> = { en: "English", ur: "اردو", "roman-ur": "Roman Urdu" };

export default async function ArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const { lang } = await searchParams;
  const data = await getArticleBySlug(slug, lang);
  if (!data || data.article.status === "DRAFT") notFound();

  const { article, translation, category, availableLangs } = data;
  const isUr = translation.lang === "ur";
  const related = (await getArticles(translation.lang, 4)).filter((a) => a.slug !== slug).slice(0, 3);
  const relatedEvent = article.relatedEventSlug ? await getEventBySlug(article.relatedEventSlug) : null;

  return (
    <div className="px-5 md:px-10 py-10 md:py-16">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <Link href="/journal" className="u-link inline-flex items-center gap-2 text-sm text-ink-soft no-print">
            <ArrowLeft size={15} className={isUr ? "rotate-180" : ""} /> Journal
          </Link>
        </Reveal>

        <Reveal delay={50}>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <p className="kicker text-ink-soft">{isUr && category?.nameUr ? category.nameUr : category?.nameEn ?? "Journal"}</p>
            {availableLangs.length > 1 && (
              <div className="flex rounded-full border border-line p-0.5 no-print">
                {availableLangs.map((l) => (
                  <Link
                    key={l}
                    href={`/journal/${slug}?lang=${l}`}
                    className={cx(
                      "px-3 py-1 rounded-full text-[12px] font-medium transition-colors",
                      l === translation.lang ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
                    )}
                  >
                    {LANG_LABEL[l] ?? l}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <h1
            className={cx("display-lg mt-4", isUr && "!font-urdu !font-semibold !leading-[1.7] tracking-normal")}
            lang={isUr ? "ur" : undefined}
            dir={isUr ? "rtl" : undefined}
          >
            {translation.title}
          </h1>
          <div className="flex items-center gap-3 mt-5 text-sm text-ink-soft">
            <span className="w-9 h-9 rounded-full bg-mist flex items-center justify-center font-display font-bold">
              {article.authorName.slice(0, 1)}
            </span>
            <span>
              {article.authorName}
              {article.authorRole ? ` · ${article.authorRole}` : ""}
            </span>
            <span>·</span>
            <span>{formatDate(article.publishedAt)}</span>
            <span className="inline-flex items-center gap-1">
              <Clock3 size={13} /> {article.readingMinutes} min
            </span>
          </div>
        </Reveal>

        {article.coverImage && (
          <Reveal delay={100}>
            <div className="img-frame rounded-3xl aspect-[21/10] mt-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={article.coverImage} alt={translation.title} className="w-full h-full object-cover" />
            </div>
          </Reveal>
        )}

        <Reveal delay={140} className="mt-8">
          <div lang={isUr ? "ur" : undefined} dir={isUr ? "rtl" : undefined}>
            <ArticleBody content={translation.content} />
          </div>
        </Reveal>

        {relatedEvent && (
          <Reveal className="mt-14">
            <Link
              href={`/events/${relatedEvent.slug}`}
              className="group flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-ink text-paper p-7 md:p-9"
            >
              <div>
                <p className="kicker text-paper/50">Related workshop</p>
                <p className="font-display font-bold text-xl md:text-2xl mt-2 tracking-tight">
                  {relatedEvent.title}
                </p>
                <p className="text-paper/60 text-sm mt-1.5">{relatedEvent.excerpt.slice(0, 110)}…</p>
              </div>
              <span className="inline-flex items-center gap-2 font-semibold group-hover:gap-3 transition-all">
                Save a seat <ArrowUpRight size={17} />
              </span>
            </Link>
          </Reveal>
        )}
      </div>

      {related.length > 0 && (
        <div className="mx-auto max-w-[1440px] mt-20 md:mt-28">
          <Reveal>
            <h2 className="display-md mb-8">More from the Journal</h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
            {related.map((a, i) => (
              <ArticleCard key={a.id} article={a} delay={i * 70} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";

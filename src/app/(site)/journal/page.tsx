import type { Metadata } from "next";
import Link from "next/link";
import { getArticles, getCategories } from "@/lib/data";
import { cx } from "@/lib/utils";
import Reveal from "@/components/ui/reveal";
import ArticleCard from "@/components/site/article-card";

export const metadata: Metadata = {
  title: "Journal — daily articles & creator stories",
  description:
    "Tutorials, guides, interviews and creator stories from Content Colony, Lahore — in English and Urdu.",
};

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; cat?: string }>;
}) {
  const { lang: langParam, cat } = await searchParams;
  const lang = langParam === "ur" ? "ur" : "en";
  const [all, cats] = await Promise.all([getArticles(lang, 60), getCategories()]);
  const list = cat ? all.filter((a) => a.categorySlug === cat) : all;
  const featuredArticle = !cat ? list.find((a) => a.featured) : undefined;
  const rest = featuredArticle ? list.filter((a) => a.id !== featuredArticle.id) : list;

  return (
    <div className="px-5 md:px-10 py-14 md:py-20">
      <div className="mx-auto max-w-[1440px]">
        <Reveal className="max-w-3xl">
          <p className="kicker text-ink-soft">Journal</p>
          <h1 className="display-xl mt-4">
            Stories worth
            <br />
            <span className="serif-em normal-case">staying for.</span>
          </h1>
          <p className="lede mt-5">
            Daily articles, tutorials, creator stories and colony updates — in
            English and اردو.
          </p>
        </Reveal>

        {/* Language + filters */}
        <Reveal className="mt-10 flex flex-wrap items-center gap-3" delay={60}>
          <div className="flex rounded-full border border-line p-1">
            {[
              { code: "en", label: "English" },
              { code: "ur", label: "اردو" },
            ].map((l) => (
              <Link
                key={l.code}
                href={`/journal?lang=${l.code}${cat ? `&cat=${cat}` : ""}`}
                className={cx(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                  lang === l.code ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/journal?lang=${lang}`}
              className={cx(
                "text-[12.5px] px-3.5 py-1.5 rounded-full border transition-colors",
                !cat ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
              )}
            >
              All
            </Link>
            {cats.map((c) => (
              <Link
                key={c.id}
                href={`/journal?lang=${lang}&cat=${c.slug}`}
                className={cx(
                  "text-[12.5px] px-3.5 py-1.5 rounded-full border transition-colors",
                  cat === c.slug ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
                )}
              >
                {lang === "ur" && c.nameUr ? c.nameUr : c.nameEn}
              </Link>
            ))}
          </div>
        </Reveal>

        {list.length === 0 && (
          <p className="mt-16 text-ink-soft">Nothing here yet — check back tomorrow.</p>
        )}

        {featuredArticle && (
          <div className="mt-10">
            <ArticleCard article={featuredArticle} big />
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12 mt-12">
          {rest.map((a, i) => (
            <ArticleCard key={a.id} article={a} delay={(i % 3) * 70} />
          ))}
        </div>
      </div>
    </div>
  );
}

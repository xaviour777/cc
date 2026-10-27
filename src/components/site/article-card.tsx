import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import type { CardArticle } from "@/lib/data";
import { cx, formatDate } from "@/lib/utils";
import Reveal from "@/components/ui/reveal";

export default function ArticleCard({
  article,
  big = false,
  delay = 0,
}: {
  article: CardArticle;
  big?: boolean;
  delay?: number;
}) {
  return (
    <Reveal delay={delay} className="h-full">
      <Link
        href={`/journal/${article.slug}?lang=${article.lang}`}
        className="group flex flex-col h-full"
      >
        <div className={cx("img-frame rounded-2xl", big ? "aspect-[16/9]" : "aspect-[16/10]")}>
          {article.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.coverImage}
              alt={article.title}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <p className="kicker text-ink-soft mt-5">{article.categoryName ?? "Journal"}</p>
        <h3
          className={cx(
            "font-display font-bold tracking-tight mt-2 leading-[1.08]",
            big ? "text-2xl md:text-4xl" : "text-xl",
            article.lang === "ur" && "!font-urdu !font-semibold tracking-normal leading-relaxed"
          )}
          lang={article.lang === "ur" ? "ur" : undefined}
          dir={article.lang === "ur" ? "rtl" : undefined}
        >
          {article.title}
        </h3>
        <p
          className="text-ink-soft text-[15px] mt-2 leading-relaxed line-clamp-2"
          lang={article.lang === "ur" ? "ur" : undefined}
          dir={article.lang === "ur" ? "rtl" : undefined}
        >
          {article.excerpt}
        </p>
        <div className="mt-auto pt-4 flex items-center justify-between text-[12.5px] text-ink-soft">
          <span>
            {article.authorName} · {formatDate(article.publishedAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 size={12} /> {article.readingMinutes} min
            <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>
        </div>
      </Link>
    </Reveal>
  );
}

import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { articleTranslations, articles, categories, events } from "@/db/schema";
import { deleteArticle, setArticleStatus } from "@/app/admin/actions";
import { ActionButton, AdminBadge } from "@/components/admin/form-shell";
import ArticleEditor from "@/components/admin/article-editor";

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; new?: string }>;
}) {
  const { edit, new: isNew } = await searchParams;
  const [rows, trs, cats, evs] = await Promise.all([
    db.select().from(articles).orderBy(desc(articles.updatedAt)),
    db.select().from(articleTranslations),
    db.select().from(categories),
    db.select().from(events),
  ]);
  const editing = edit ? rows.find((a) => a.id === Number(edit)) : undefined;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight">Journal / Articles</h1>
          <p className="text-sm text-ink-soft mt-1">
            Daily publishing in English and اردو — drafts, scheduled posts and the public Journal all live here.
          </p>
        </div>
        <Link href="/admin/articles?new=1" className="btn btn-primary !py-2.5 !px-5 text-sm">
          New article
        </Link>
      </div>

      {(isNew || editing) && (
        <div className="mt-5">
          <ArticleEditor
            article={editing}
            translations={editing ? trs.filter((t) => t.articleId === editing.id) : []}
            categories={cats}
            events={evs}
          />
          {/* Publishing-calendar hint for scheduled items */}
          <p className="text-[12px] text-ink-soft mt-2">
            Scheduled articles go live automatically at their publish time — plan one a day.
          </p>
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-line bg-paper overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="text-left text-[11px] tracking-[0.12em] uppercase text-ink-soft border-b border-line">
              <th className="px-5 py-3.5 font-semibold">Article</th>
              <th className="px-5 py-3.5 font-semibold">Category</th>
              <th className="px-5 py-3.5 font-semibold">Languages</th>
              <th className="px-5 py-3.5 font-semibold">Publishes</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const langs = trs.filter((t) => t.articleId === a.id).map((t) => t.lang);
              const en = trs.find((t) => t.articleId === a.id && t.lang === "en") ?? trs.find((t) => t.articleId === a.id);
              return (
                <tr key={a.id} className="border-b border-line last:border-0 hover:bg-mist/60">
                  <td className="px-5 py-3.5">
                    <p className="font-medium">{en?.title ?? "(untitled)"}</p>
                    <p className="text-[12px] text-ink-soft">by {a.authorName}{a.featured ? " · featured" : ""}</p>
                  </td>
                  <td className="px-5 py-3.5">{cats.find((c) => c.id === a.categoryId)?.nameEn ?? "—"}</td>
                  <td className="px-5 py-3.5">{langs.join(" · ") || "—"}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {a.publishedAt ? a.publishedAt.toLocaleDateString("en-GB") : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <AdminBadge tone={a.status === "PUBLISHED" ? "dark" : "neutral"}>{a.status}</AdminBadge>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1.5 justify-end">
                      <Link href={`/admin/articles?edit=${a.id}`} className="inline-flex items-center rounded-full px-3.5 py-1.5 text-[12.5px] font-medium border border-line hover:border-ink transition-colors">
                        Edit
                      </Link>
                      {a.status !== "PUBLISHED" && (
                        <ActionButton variant="primary" action={setArticleStatus.bind(null, a.id, "PUBLISHED")}>
                          Publish
                        </ActionButton>
                      )}
                      {a.status === "PUBLISHED" && (
                        <a
                          href={en ? `/journal/${en.slug}` : "#"}
                          target="_blank"
                          className="inline-flex items-center rounded-full px-3.5 py-1.5 text-[12.5px] font-medium border border-line hover:border-ink transition-colors"
                        >
                          View
                        </a>
                      )}
                      <ActionButton variant="danger" confirm="Delete this article in all languages?" action={deleteArticle.bind(null, a.id)}>
                        Delete
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-ink-soft">No articles yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

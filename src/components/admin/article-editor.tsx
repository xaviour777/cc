"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { upsertArticle } from "@/app/admin/actions";
import type { Article, ArticleTranslation, Category, Event } from "@/db/schema";

type TrDraft = { lang: string; slug: string; title: string; excerpt: string; content: string };

export default function ArticleEditor({
  article,
  translations,
  categories,
  events,
}: {
  article?: Article;
  translations: ArticleTranslation[];
  categories: Category[];
  events: Event[];
}) {
  const existing = (lang: string): TrDraft => {
    const t = translations.find((x) => x.lang === lang);
    return { lang, slug: t?.slug ?? "", title: t?.title ?? "", excerpt: t?.excerpt ?? "", content: t?.content ?? "" };
  };
  const [f, setF] = useState({
    id: article?.id ?? 0,
    categoryId: article?.categoryId ?? categories[0]?.id ?? 0,
    coverImage: article?.coverImage ?? "",
    authorName: article?.authorName ?? "Content Colony",
    authorRole: article?.authorRole ?? "",
    status: article?.status ?? "DRAFT",
    publishedAt: article?.publishedAt
      ? new Date(article.publishedAt).toISOString().slice(0, 16)
      : "",
    featured: article?.featured ?? false,
    readingMinutes: article?.readingMinutes ?? 4,
    seoTitle: article?.seoTitle ?? "",
    seoDescription: article?.seoDescription ?? "",
    ogImage: article?.ogImage ?? "",
    relatedEventSlug: article?.relatedEventSlug ?? "",
  });
  const [trs, setTrs] = useState<TrDraft[]>([
    existing("en"),
    existing("ur"),
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const setTr = (lang: string, k: keyof TrDraft, v: string) =>
    setTrs((prev) => prev.map((t) => (t.lang === lang ? { ...t, [k]: v } : t)));

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("id", String(f.id));
      fd.set("categoryId", String(f.categoryId));
      for (const k of ["coverImage", "authorName", "authorRole", "status", "seoTitle", "seoDescription", "ogImage", "relatedEventSlug"] as const)
        fd.set(k, String(f[k]));
      fd.set("readingMinutes", String(f.readingMinutes));
      if (f.publishedAt) fd.set("publishedAt", new Date(f.publishedAt).toISOString());
      if (f.featured) fd.set("featured", "on");
      fd.set("translations", JSON.stringify(trs.filter((t) => t.title.trim())));
      const res = await upsertArticle(fd);
      if (!res.ok) {
        setError(res.error ?? "Failed");
        return;
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setBusy(false);
    }
  };

  const trBlock = (lang: "en" | "ur", label: string) => {
    const t = trs.find((x) => x.lang === lang)!;
    return (
      <div className="rounded-2xl border border-line p-4 space-y-3">
        <p className="text-[11px] tracking-[0.16em] uppercase font-semibold">{label}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <input className="field" placeholder="Slug (URL)" value={t.slug} onChange={(e) => setTr(lang, "slug", e.target.value)} />
          <input
            className="field"
            placeholder="Title"
            value={t.title}
            onChange={(e) => setTr(lang, "title", e.target.value)}
            dir={lang === "ur" ? "rtl" : "ltr"}
            lang={lang === "ur" ? "ur" : undefined}
          />
        </div>
        <input
          className="field"
          placeholder="Excerpt"
          value={t.excerpt}
          onChange={(e) => setTr(lang, "excerpt", e.target.value)}
          dir={lang === "ur" ? "rtl" : "ltr"}
          lang={lang === "ur" ? "ur" : undefined}
        />
        <div>
          <textarea
            className={`field min-h-56 font-mono text-[13px] leading-relaxed ${lang === "ur" ? "!font-urdu !leading-[2.3]" : ""}`}
            placeholder={"Body — supports:\n## Heading   ### Subheading   > Quote   - list item   ---\n[youtube:VIDEO_ID]   ![alt](image-url)"}
            value={t.content}
            onChange={(e) => setTr(lang, "content", e.target.value)}
            dir={lang === "ur" ? "rtl" : "ltr"}
            lang={lang === "ur" ? "ur" : undefined}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-line bg-paper p-5 space-y-4">
      <p className="font-semibold text-sm">{f.id ? `Editing article #${f.id}` : "New article"}</p>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="label">Category</label>
          <select className="field" value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: Number(e.target.value) })}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.nameEn}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="field" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as typeof f.status })}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="SCHEDULED">Scheduled</option>
          </select>
        </div>
        <div>
          <label className="label">Publish at (for scheduled)</label>
          <input type="datetime-local" className="field" value={f.publishedAt} onChange={(e) => setF({ ...f, publishedAt: e.target.value })} />
        </div>
        <div>
          <label className="label">Cover image URL</label>
          <input className="field" value={f.coverImage} onChange={(e) => setF({ ...f, coverImage: e.target.value })} />
        </div>
        <div>
          <label className="label">Author name</label>
          <input className="field" value={f.authorName} onChange={(e) => setF({ ...f, authorName: e.target.value })} />
        </div>
        <div>
          <label className="label">Author role</label>
          <input className="field" value={f.authorRole} onChange={(e) => setF({ ...f, authorRole: e.target.value })} />
        </div>
        <div>
          <label className="label">Reading minutes</label>
          <input type="number" min={1} className="field" value={f.readingMinutes} onChange={(e) => setF({ ...f, readingMinutes: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label">Related workshop (event)</label>
          <select className="field" value={f.relatedEventSlug} onChange={(e) => setF({ ...f, relatedEventSlug: e.target.value })}>
            <option value="">None</option>
            {events.map((e) => (
              <option key={e.id} value={e.slug}>{e.title}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm mt-6">
          <input type="checkbox" className="accent-black" checked={f.featured} onChange={(e) => setF({ ...f, featured: e.target.checked })} />
          Featured article
        </label>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="label">SEO title</label>
          <input className="field" value={f.seoTitle} onChange={(e) => setF({ ...f, seoTitle: e.target.value })} />
        </div>
        <div>
          <label className="label">Meta description</label>
          <input className="field" value={f.seoDescription} onChange={(e) => setF({ ...f, seoDescription: e.target.value })} />
        </div>
        <div>
          <label className="label">OG image URL</label>
          <input className="field" value={f.ogImage} onChange={(e) => setF({ ...f, ogImage: e.target.value })} />
        </div>
      </div>

      {trBlock("en", "English version")}
      {trBlock("ur", "اردو ترجمہ (RTL)")}

      <div className="flex items-center gap-3">
        <button onClick={submit} disabled={busy} className="btn btn-primary !py-2.5 !px-6 text-sm">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saved ? "Saved" : f.id ? "Save changes" : "Create article"}
        </button>
        {error && <p className="text-sm font-medium">{error}</p>}
      </div>
    </div>
  );
}

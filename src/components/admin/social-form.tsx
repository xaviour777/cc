"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { upsertSocialPost } from "@/app/admin/actions";
import type { SocialPost } from "@/db/schema";

export default function SocialPostForm({ post }: { post?: SocialPost }) {
  const [f, setF] = useState({
    id: post?.id ?? 0,
    platform: post?.platform ?? "INSTAGRAM",
    url: post?.url ?? "",
    thumbnail: post?.thumbnail ?? "",
    creatorName: post?.creatorName ?? "",
    creatorHandle: post?.creatorHandle ?? "",
    caption: post?.caption ?? "",
    category: post?.category ?? "",
    featured: post?.featured ?? false,
    active: post?.active ?? true,
    sortOrder: post?.sortOrder ?? 0,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("id", String(f.id));
      fd.set("platform", f.platform);
      fd.set("url", f.url);
      fd.set("thumbnail", f.thumbnail);
      fd.set("creatorName", f.creatorName);
      fd.set("creatorHandle", f.creatorHandle);
      fd.set("caption", f.caption);
      fd.set("category", f.category);
      if (f.featured) fd.set("featured", "on");
      if (f.active) fd.set("active", "on");
      else fd.delete("active");
      fd.set("sortOrder", String(f.sortOrder));
      const res = await upsertSocialPost(fd);
      if (!res.ok) {
        setError(res.error ?? "Failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-paper p-5 space-y-3">
      <p className="font-semibold text-sm">{f.id ? `Editing post #${f.id}` : "Add a reel / post"}</p>
      <p className="text-[12px] text-ink-soft">
        Paste the public permalink (Instagram reel, TikTok, YouTube Short, Facebook video). If a platform blocks
        embeds, the site shows a beautiful thumbnail card that opens the original post — no scraping, no fake embeds.
      </p>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="label">Platform</label>
          <select className="field" value={f.platform} onChange={(e) => setF({ ...f, platform: e.target.value as typeof f.platform })}>
            <option value="INSTAGRAM">Instagram</option>
            <option value="TIKTOK">TikTok</option>
            <option value="YOUTUBE">YouTube / Shorts</option>
            <option value="FACEBOOK">Facebook</option>
          </select>
        </div>
        <div>
          <label className="label">Permalink (original post URL)</label>
          <input className="field" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="https://instagram.com/reel/…" />
        </div>
        <div>
          <label className="label">Thumbnail URL *</label>
          <input className="field" value={f.thumbnail} onChange={(e) => setF({ ...f, thumbnail: e.target.value })} />
        </div>
        <div>
          <label className="label">Creator name *</label>
          <input className="field" value={f.creatorName} onChange={(e) => setF({ ...f, creatorName: e.target.value })} />
        </div>
        <div>
          <label className="label">Creator handle</label>
          <input className="field" value={f.creatorHandle} onChange={(e) => setF({ ...f, creatorHandle: e.target.value })} placeholder="@handle" />
        </div>
        <div>
          <label className="label">Category</label>
          <input className="field" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="Studio / Gaming / Community…" />
        </div>
      </div>
      <div>
        <label className="label">Caption</label>
        <input className="field" value={f.caption} onChange={(e) => setF({ ...f, caption: e.target.value })} />
      </div>
      <div className="flex flex-wrap items-center gap-5">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="accent-black" checked={f.featured} onChange={(e) => setF({ ...f, featured: e.target.checked })} /> Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="accent-black" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Active
        </label>
        <div className="flex items-center gap-2 text-sm">
          Sort order
          <input type="number" className="field !w-24 !py-2" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: Number(e.target.value) })} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={submit} disabled={busy} className="btn btn-primary !py-2.5 !px-6 text-sm">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {f.id ? "Save changes" : "Add post"}
        </button>
        {error && <p className="text-sm font-medium">{error}</p>}
      </div>
    </div>
  );
}

import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { socialPosts } from "@/db/schema";
import { deleteSocialPost, moveSocialPost } from "@/app/admin/actions";
import { ActionButton, AdminBadge } from "@/components/admin/form-shell";
import SocialPostForm from "@/components/admin/social-form";

export default async function SocialAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; new?: string }>;
}) {
  const { edit, new: isNew } = await searchParams;
  const rows = await db.select().from(socialPosts).orderBy(desc(socialPosts.featured), asc(socialPosts.sortOrder));
  const editing = edit ? rows.find((p) => p.id === Number(edit)) : undefined;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight">Social Feed</h1>
          <p className="text-sm text-ink-soft mt-1">
            The &quot;Made at the Colony&quot; grid — real reel permalinks, thumbnails and creator credit.
          </p>
        </div>
        <Link href="/admin/social?new=1" className="btn btn-primary !py-2.5 !px-5 text-sm">Add post</Link>
      </div>

      {(isNew || editing) && (
        <div className="mt-5">
          <SocialPostForm post={editing} />
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
        {rows.map((p) => (
          <div key={p.id} className="rounded-2xl border border-line bg-paper overflow-hidden">
            <div className="relative aspect-[4/3] bg-mist">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.thumbnail} alt={p.caption} className="w-full h-full object-cover grayscale" />
              <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                <AdminBadge tone="dark">{p.platform}</AdminBadge>
                {!p.active && <AdminBadge tone="soft">Hidden</AdminBadge>}
                {p.featured && <AdminBadge>Featured</AdminBadge>}
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm font-medium">{p.creatorName} <span className="text-ink-soft font-normal">{p.creatorHandle}</span></p>
              <p className="text-[12.5px] text-ink-soft mt-0.5 line-clamp-2">{p.caption}</p>
              <p className="text-[11.5px] text-ink-soft mt-1">{p.url ? "Links to original post ✓" : "No permalink yet — shows as preview card"}</p>
              <div className="flex gap-1.5 mt-3">
                <ActionButton action={moveSocialPost.bind(null, p.id, -1)}><ArrowUp size={12} /></ActionButton>
                <ActionButton action={moveSocialPost.bind(null, p.id, 1)}><ArrowDown size={12} /></ActionButton>
                <Link href={`/admin/social?edit=${p.id}`} className="inline-flex items-center rounded-full px-3.5 py-1.5 text-[12.5px] font-medium border border-line hover:border-ink transition-colors">Edit</Link>
                <ActionButton variant="danger" confirm="Remove this post from the grid?" action={deleteSocialPost.bind(null, p.id)}>Remove</ActionButton>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-sm text-ink-soft col-span-full rounded-2xl border border-line bg-paper p-10 text-center">
            No posts yet — add your first reel.
          </p>
        )}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

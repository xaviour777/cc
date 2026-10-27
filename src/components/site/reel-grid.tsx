import { Play } from "lucide-react";
import type { SocialPost } from "@/db/schema";
import { cx } from "@/lib/utils";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  YoutubeIcon,
} from "@/components/ui/icons";
import Reveal from "@/components/ui/reveal";

const PLATFORM: Record<string, { label: string; Icon: (p: React.SVGProps<SVGSVGElement>) => React.ReactNode }> = {
  INSTAGRAM: { label: "Instagram", Icon: InstagramIcon },
  TIKTOK: { label: "TikTok", Icon: TikTokIcon },
  YOUTUBE: { label: "YouTube", Icon: YoutubeIcon },
  FACEBOOK: { label: "Facebook", Icon: FacebookIcon },
  LINKEDIN: { label: "LinkedIn", Icon: InstagramIcon },
};

export default function ReelGrid({ posts }: { posts: SocialPost[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {posts.map((post, i) => {
        const P = PLATFORM[post.platform];
        const body = (
          <>
            <div className="img-frame relative aspect-[4/5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.thumbnail}
                alt={post.caption || `Reel by ${post.creatorName}`}
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-80" />
              {post.url && (
                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="w-12 h-12 rounded-full bg-paper text-ink flex items-center justify-center">
                    <Play size={18} className="ml-0.5" />
                  </span>
                </span>
              )}
              <div className="absolute bottom-0 inset-x-0 p-3.5 text-white">
                <p className="text-[13px] font-semibold leading-tight">{post.creatorName}</p>
                {post.creatorHandle && (
                  <p className="text-[11px] text-white/70">{post.creatorHandle}</p>
                )}
              </div>
              <span className="absolute top-3 left-3 w-7 h-7 rounded-full bg-paper/90 text-ink flex items-center justify-center">
                {P && <P.Icon width={13} height={13} />}
              </span>
            </div>
            <p className="text-[12px] text-ink-soft mt-2.5 leading-snug line-clamp-2">
              {post.caption}
            </p>
          </>
        );
        return (
          <Reveal key={post.id} delay={i * 60}>
            {post.url ? (
              <a
                href={post.url}
                target="_blank"
                rel="noreferrer"
                className="group block"
                aria-label={`Open ${P?.label ?? post.platform} post by ${post.creatorName}`}
              >
                {body}
              </a>
            ) : (
              <div className={cx("group")} title="Permalink added by admin at launch">
                {body}
              </div>
            )}
          </Reveal>
        );
      })}
    </div>
  );
}

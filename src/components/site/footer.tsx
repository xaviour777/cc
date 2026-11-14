import Link from "next/link";
import { getSetting } from "@/lib/stays";
import {
  ColonyMark,
  ColonyWordmark,
  TikTokIcon,
  WhatsAppIcon,
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
  LinkedinIcon,
} from "@/components/ui/icons";

export default async function Footer() {
  const [ig, tt, yt, fb, li, wa, email] = await Promise.all([
    getSetting<string>("instagram", ""),
    getSetting<string>("tiktok", ""),
    getSetting<string>("youtube", ""),
    getSetting<string>("facebook", ""),
    getSetting<string>("linkedin", ""),
    getSetting<string>("whatsappNumber", ""),
    getSetting<string>("contactEmail", "hello@contentcolony.live"),
  ]);

  // Settings may hold a handle or a full URL; Instagram and Facebook have defaults.
  const link = (v: string, base: string) => (!v ? "" : /^https?:\/\//.test(v) ? v : `${base}${v}`);
  const socials = [
    { label: "Instagram", href: link(ig || "content.colony", "https://www.instagram.com/"), Icon: InstagramIcon },
    { label: "Facebook", href: link(fb || "https://www.facebook.com/profile.php?id=61595642176792", "https://www.facebook.com/"), Icon: FacebookIcon },
    { label: "YouTube", href: link(yt, "https://youtube.com/@"), Icon: YoutubeIcon },
    { label: "TikTok", href: link(tt, "https://tiktok.com/@"), Icon: TikTokIcon },
    { label: "LinkedIn", href: link(li, "https://linkedin.com/company/"), Icon: LinkedinIcon },
  ].filter((s) => s.href);
  // Round "3D" buttons that press down on hover / click.
  const bubble =
    "w-11 h-11 rounded-full border border-ink bg-paper text-ink flex items-center justify-center shadow-[0_4px_0_0_var(--color-ink)] transition-all duration-150 hover:translate-y-[2px] hover:shadow-[0_2px_0_0_var(--color-ink)] active:translate-y-[4px] active:shadow-none";

  return (
    <footer className="bg-mist border-t border-line">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10 pt-16 pb-8">
        <div className="grid md:grid-cols-12 gap-10 md:gap-6">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <ColonyMark className="w-12 h-11" />
              <ColonyWordmark className="h-[30px]" />
            </div>
            <p className="mt-5 text-ink-soft max-w-sm leading-relaxed text-[15px]">
              A creative home in Johar Town, Lahore — co-living, coworking,
              studio time, events and a community that feels like your people.
            </p>
            {socials.length > 0 ? (
              <div className="flex gap-3 mt-6">
                {socials.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className={bubble}
                  >
                    <Icon width={18} height={18} />
                  </a>
                ))}
                {wa && (
                  <a
                    href={`https://wa.me/${wa.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                    className={bubble}
                  >
                    <WhatsAppIcon />
                  </a>
                )}
              </div>
            ) : (
              <p className="mt-6 text-xs tracking-[0.18em] uppercase text-ink-soft">
                Social handles announced at launch
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <p className="kicker text-ink-soft">Explore</p>
            <ul className="mt-4 space-y-2.5 text-[14.5px]">
              {[
                ["Live with us", "/stay"],
                ["Events", "/events"],
                ["Community", "/community"],
                ["Journal", "/journal"],
                ["Neighborhood", "/neighborhood"],
                ["Host an Event", "/host-event"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="u-link text-ink-soft hover:text-ink">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="kicker text-ink-soft">Company</p>
            <ul className="mt-4 space-y-2.5 text-[14.5px]">
              {[
                ["About", "/about"],
                ["Contact", "/contact"],
                ["My booking", "/booking"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="u-link text-ink-soft hover:text-ink">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <p className="kicker text-ink-soft">Visit</p>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
              Johar Town, H Block
              <br />
              Lahore, Pakistan
              <br />
              <span className="text-xs">
                Exact address is shared with confirmed guests.
              </span>
            </p>
            <p className="mt-4 text-[15px]">
              <a href={`mailto:${email}`} className="u-link">
                {email}
              </a>
            </p>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-line flex flex-col md:flex-row justify-between gap-3 text-[12.5px] text-ink-soft">
          <p>© {new Date().getFullYear()} Content Colony. Your people are here.</p>
        </div>
      </div>
    </footer>
  );
}

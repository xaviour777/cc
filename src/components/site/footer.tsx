import Link from "next/link";
import { getSetting } from "@/lib/stays";
import {
  ColonyMark,
  TikTokIcon,
  WhatsAppIcon,
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
  LinkedinIcon,
} from "@/components/ui/icons";

export default async function Footer() {
  const [ig, tt, yt, fb, li, wa, email, legal] = await Promise.all([
    getSetting<string>("instagram", ""),
    getSetting<string>("tiktok", ""),
    getSetting<string>("youtube", ""),
    getSetting<string>("facebook", ""),
    getSetting<string>("linkedin", ""),
    getSetting<string>("whatsappNumber", ""),
    getSetting<string>("contactEmail", "hello@contentcolony.pk"),
    getSetting<string>("legalNotice", ""),
  ]);

  const socials = [
    { label: "Instagram", value: ig, href: ig ? `https://instagram.com/${ig}` : "", Icon: InstagramIcon },
    { label: "TikTok", value: tt, href: tt ? `https://tiktok.com/@${tt}` : "", Icon: TikTokIcon },
    { label: "YouTube", value: yt, href: yt ? `https://youtube.com/@${yt}` : "", Icon: YoutubeIcon },
    { label: "Facebook", value: fb, href: fb ? `https://facebook.com/${fb}` : "", Icon: FacebookIcon },
    { label: "LinkedIn", value: li, href: li ? `https://linkedin.com/company/${li}` : "", Icon: LinkedinIcon },
  ].filter((s) => s.value);

  return (
    <footer className="bg-mist border-t border-line">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10 pt-16 pb-8">
        <div className="grid md:grid-cols-12 gap-10 md:gap-6">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <ColonyMark className="w-9 h-9" />
              <span className="font-display font-extrabold tracking-[-0.02em] text-lg leading-none">
                CONTENT<br />COLONY
              </span>
            </div>
            <p className="mt-5 text-ink-soft max-w-sm leading-relaxed text-[15px]">
              A creative home in Johar Town, Lahore — co-living, coworking,
              studio time, events and a community that feels like your people.
            </p>
            {socials.length > 0 ? (
              <div className="flex gap-2 mt-6">
                {socials.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="w-10 h-10 rounded-full border border-line bg-paper flex items-center justify-center hover:border-ink transition-colors"
                  >
                    <Icon width={16} height={16} />
                  </a>
                ))}
                {wa && (
                  <a
                    href={`https://wa.me/${wa.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                    className="w-10 h-10 rounded-full border border-line bg-paper flex items-center justify-center hover:border-ink transition-colors"
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
                ["Stay", "/stay"],
                ["Events", "/events"],
                ["Community", "/community"],
                ["Journal", "/journal"],
                ["Colony Gazette", "/gazette"],
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
          <p className="max-w-xl">{legal}</p>
        </div>
      </div>
    </footer>
  );
}

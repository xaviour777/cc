import type { Metadata } from "next";
import { Mail, MapPin } from "lucide-react";
import { getSetting } from "@/lib/stays";
import Reveal from "@/components/ui/reveal";
import ContactForm from "@/components/forms/contact-form";
import { WhatsAppIcon, InstagramIcon, TikTokIcon, YoutubeIcon, FacebookIcon, LinkedinIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to the Content Colony team — stays, events, workshops, collaborations.",
};

export default async function ContactPage() {
  const [email, wa, ig, tt, yt, fb, li] = await Promise.all([
    getSetting<string>("contactEmail", "hello@contentcolony.pk"),
    getSetting<string>("whatsappNumber", ""),
    getSetting<string>("instagram", ""),
    getSetting<string>("tiktok", ""),
    getSetting<string>("youtube", ""),
    getSetting<string>("facebook", ""),
    getSetting<string>("linkedin", ""),
  ]);
  const socials = [
    { label: "Instagram", value: ig, href: `https://instagram.com/${ig}`, Icon: InstagramIcon },
    { label: "TikTok", value: tt, href: `https://tiktok.com/@${tt}`, Icon: TikTokIcon },
    { label: "YouTube", value: yt, href: `https://youtube.com/@${yt}`, Icon: YoutubeIcon },
    { label: "Facebook", value: fb, href: `https://facebook.com/${fb}`, Icon: FacebookIcon },
    { label: "LinkedIn", value: li, href: `https://linkedin.com/company/${li}`, Icon: LinkedinIcon },
  ].filter((s) => s.value);

  return (
    <div className="px-5 md:px-10 py-14 md:py-20">
      <div className="mx-auto max-w-[1200px] grid lg:grid-cols-2 gap-12 items-start">
        <div className="lg:sticky lg:top-24">
          <Reveal>
            <p className="kicker text-ink-soft">Contact</p>
            <h1 className="display-lg mt-4">
              Say salam.
              <br />
              <span className="serif-em normal-case">We reply fast.</span>
            </h1>
            <p className="lede mt-5">
              Stays, workshops, hosting an event, filming here, or just figuring out
              if the Colony is your vibe — write to us.
            </p>
          </Reveal>
          <Reveal delay={100} className="mt-8 space-y-4">
            <a href={`mailto:${email}`} className="flex items-center gap-3 group">
              <span className="w-11 h-11 rounded-full bg-mist flex items-center justify-center shrink-0 group-hover:bg-line transition-colors">
                <Mail size={17} />
              </span>
              <span className="u-link font-medium">{email}</span>
            </a>
            {wa && (
              <a href={`https://wa.me/${wa.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 group">
                <span className="w-11 h-11 rounded-full bg-mist flex items-center justify-center shrink-0 group-hover:bg-line transition-colors">
                  <WhatsAppIcon width={17} height={17} />
                </span>
                <span className="u-link font-medium">WhatsApp us</span>
              </a>
            )}
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-full bg-mist flex items-center justify-center shrink-0">
                <MapPin size={17} />
              </span>
              <span className="text-sm text-ink-soft">Johar Town, H Block, Lahore — exact address shared with confirmed guests</span>
            </div>
            {socials.length > 0 && (
              <div className="flex gap-2 pt-2">
                {socials.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="w-10 h-10 rounded-full border border-line flex items-center justify-center hover:border-ink transition-colors"
                  >
                    <Icon width={15} height={15} />
                  </a>
                ))}
              </div>
            )}
          </Reveal>
        </div>
        <Reveal delay={120}>
          <ContactForm />
        </Reveal>
      </div>
    </div>
  );
}

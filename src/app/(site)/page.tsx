import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgePercent,
  BedDouble,
  CalendarHeart,
  ChefHat,
  Clapperboard,
  DoorOpen,
  Gamepad2,
  MapPin,
  PhoneCall,
  Popcorn,
  Sofa,
  Users,
  Wifi,
} from "lucide-react";
import { IMG, CREATORS } from "@/lib/images";
import { getArticles, getPublicEvents, getSocialPosts, getStayProducts } from "@/lib/data";
import { getHidePrices, getMinStayNights, getSetting } from "@/lib/stays";
import { pkr } from "@/lib/utils";
import Reveal from "@/components/ui/reveal";
import EventCard from "@/components/site/event-card";
import ArticleCard from "@/components/site/article-card";
import ReelGrid from "@/components/site/reel-grid";
import JoinForm from "@/components/forms/join-form";

export default async function HomePage() {
  const [products, events, articlesList, reels, minStay, discount, hidePrices] = await Promise.all([
    getStayProducts(),
    getPublicEvents(),
    getArticles("en", 3),
    getSocialPosts(),
    getMinStayNights(),
    getSetting<number>("residentDiscountPct", 25),
    getHidePrices(),
  ]);
  const featured = events.filter((e) => e.featured && e.kind === "WORKSHOP");
  const community = events.filter((e) => e.kind !== "WORKSHOP").slice(0, 3);

  return (
    <div>
      {/* ---------- HERO ---------- */}
      <section className="px-5 md:px-10 pt-6 md:pt-8">
        <div className="mx-auto max-w-[1440px]">
          <Reveal>
            <p className="kicker text-ink-soft text-center">
              Co-living · Coworking · Community — Johar Town, Lahore
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="display-xl text-center mt-5">
              Your <span className="serif-em normal-case">people</span>
              <br />
              are here.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="lede text-center max-w-xl mx-auto mt-6">
              A creative home in Lahore for people who build, create, explore,
              and never stop learning.
            </p>
          </Reveal>
          <Reveal delay={220}>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <Link href="/stay#book" className="btn btn-primary">
                Find Your Stay <ArrowRight size={16} />
              </Link>
              <Link href="/events" className="btn btn-outline">
                See What&apos;s Happening
              </Link>
            </div>
          </Reveal>
          <Reveal delay={280}>
            <div className="img-frame rounded-[2rem] mt-10 md:mt-14">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMG.hero}
                alt="Creators collaborating in the Content Colony lounge"
                className="w-full h-[52vh] md:h-[68vh] object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- MARQUEE ---------- */}
      <div className="mt-10 border-y border-line py-4 overflow-hidden" aria-hidden>
        <div className="marquee-track gap-10">
          {Array.from({ length: 2 }).map((_, dup) => (
            <div key={dup} className="flex gap-10 items-center shrink-0">
              {[
                "Build together",
                "Create daily",
                "Play harder",
                "Learn always",
                "Eat as family",
                "Come as a stranger",
                "Create as a friend",
              ].map((w) => (
                <span key={w} className="flex items-center gap-10 shrink-0">
                  <span className="font-display font-bold text-lg tracking-tight uppercase">{w}</span>
                  <span className="w-2 h-2 rounded-full bg-ink inline-block" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ---------- WELCOME ---------- */}
      <section className="px-5 md:px-10 py-20 md:py-32">
        <div className="mx-auto max-w-[1440px] grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div>
            <Reveal>
              <p className="kicker text-ink-soft">Welcome to Content Colony</p>
              <h2 className="display-lg mt-4">
                Not a hotel.
                <br />
                Not a hostel.
                <br />
                <span className="serif-em normal-case">A colony.</span>
              </h2>
            </Reveal>
          </div>
          <div className="lg:pt-14">
            <Reveal delay={100}>
              <p className="lede">
                We built the place we always wanted to land in: somewhere you can
                sleep well, work deeply, shoot your next video, argue about movies,
                and eat dinner with people who get it.
              </p>
              <p className="text-ink-soft mt-5 leading-relaxed">
                Eight bunks, two private rooms, a coworking lounge, a production
                studio, a call pod and a kitchen that never really closes — wrapped
                around a community of YouTubers, filmmakers, editors, designers and
                founders. Come for three nights. Stay for the people.
              </p>
            </Reveal>
            <Reveal delay={180}>
              <div className="grid grid-cols-3 gap-4 mt-10 border-t border-line pt-8">
                {[
                  ["10", "places to sleep"],
                  ["25%", "resident workshop discount"],
                  ["7", "dinners a week, together"],
                ].map(([n, l]) => (
                  <div key={l}>
                    <p className="font-display font-extrabold text-3xl md:text-4xl tracking-tight">{n}</p>
                    <p className="text-[12.5px] text-ink-soft mt-1 leading-snug">{l}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- STAY WITH US ---------- */}
      <section className="px-5 md:px-10 pb-20 md:pb-32">
        <div className="mx-auto max-w-[1440px]">
          <Reveal className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <p className="kicker text-ink-soft">Stay with us</p>
              <h2 className="display-lg mt-3">Pick your corner.</h2>
            </div>
            <Link href="/stay" className="btn btn-outline">
              All rates & booking <ArrowUpRight size={15} />
            </Link>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-5">
            {products.map((p, i) => (
              <Reveal key={p.key} delay={i * 90}>
                <Link href={`/stay#book`} className="group block rounded-3xl overflow-hidden border border-line card-lift bg-paper">
                  <div className="img-frame aspect-[16/10]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.key === "SHARED_BUNK" ? IMG.bunkRoom : IMG.privateRoom}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 md:p-8">
                    <div className="flex items-center gap-2 text-ink-soft">
                      {p.key === "SHARED_BUNK" ? <BedDouble size={17} /> : <DoorOpen size={17} />}
                      <span className="text-[12px] tracking-[0.16em] uppercase font-medium">
                        {p.key === "SHARED_BUNK" ? "Shared living" : "Private accommodation"}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-2xl md:text-3xl mt-2 tracking-tight">{p.name}</h3>
                    <p className="text-ink-soft mt-2 leading-relaxed text-[15px]">{p.tagline}</p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {!hidePrices && p.weeklyPkr && (
                        <span className="text-[12px] bg-mist rounded-full px-3 py-1.5">
                          7 nights · {pkr(p.weeklyPkr)}
                        </span>
                      )}
                      {!hidePrices && p.monthlyPkr && (
                        <span className="text-[12px] bg-mist rounded-full px-3 py-1.5">
                          30 nights · {pkr(p.monthlyPkr)}
                        </span>
                      )}
                      <span className="text-[12px] bg-mist rounded-full px-3 py-1.5">
                        Min {minStay} nights
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-6 pt-5 border-t border-line">
                      <p>
                        {hidePrices ? (
                          <span className="font-display font-bold text-lg tracking-tight">Price on request</span>
                        ) : (
                          <>
                            <span className="font-display font-extrabold text-2xl tracking-tight">{pkr(p.nightlyPkr)}</span>
                            <span className="text-ink-soft text-sm"> / night</span>
                          </>
                        )}
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium group-hover:gap-2.5 transition-all">
                        Check dates <ArrowRight size={15} />
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- EVERYTHING INCLUDED ---------- */}
      <section className="bg-mist border-y border-line px-5 md:px-10 py-20 md:py-28">
        <div className="mx-auto max-w-[1440px]">
          <Reveal className="max-w-2xl">
            <p className="kicker text-ink-soft">Included in every stay</p>
            <h2 className="display-lg mt-3">Everything is already yours.</h2>
            <p className="lede mt-4">
              One rate. No surprises. These come with every bunk and every room,
              every single night.
            </p>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line rounded-3xl overflow-hidden mt-12 border border-line">
            {[
              { Icon: Users, t: "Coworking lounge", d: "Shared desks, good chairs, better company." },
              { Icon: Wifi, t: "High-speed Wi-Fi", d: "Backup line included — uploads don't wait." },
              { Icon: Clapperboard, t: "Production studio", d: "Lights, audio, backdrop. Bookable by slot." },
              { Icon: PhoneCall, t: "Call pod", d: "A quiet booth for calls, podcasts & clients." },
              { Icon: ChefHat, t: "Shared kitchen", d: "Cook together or claim the midnight chai shift." },
              { Icon: Sofa, t: "Community lounge", d: "Where collabs start and breaks stretch long." },
              { Icon: Gamepad2, t: "Entertainment area", d: "Console, PC games and tournament nights." },
              { Icon: Popcorn, t: "Movie nights", d: "Projector on, blankets out, every week." },
              { Icon: CalendarHeart, t: "Free meetups", d: "Community sessions are always free for residents." },
            ].map(({ Icon, t, d }, i) => (
              <Reveal key={t} delay={(i % 3) * 70} className="bg-paper">
                <div className="p-6 md:p-7 h-full">
                  <Icon size={20} />
                  <p className="font-semibold mt-4">{t}</p>
                  <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-8">
            <div className="rounded-2xl border border-line bg-paper p-5 flex flex-wrap items-center gap-x-6 gap-y-2 justify-between">
              <p className="text-sm text-ink-soft leading-relaxed max-w-2xl">
                <span className="font-semibold text-ink">Optional paid extras, always clearly priced:</span>{" "}
                specialised workshops &amp; bootcamps. Residents always save {discount}% — verified
                against your stay, never self-declared.
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                <BadgePercent size={16} /> {discount}% resident discount
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- EVENTS ---------- */}
      <section className="px-5 md:px-10 py-20 md:py-32">
        <div className="mx-auto max-w-[1440px]">
          <Reveal className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <p className="kicker text-ink-soft">Events & workshops</p>
              <h2 className="display-lg mt-3">
                Learn it here,
                <br />
                <span className="serif-em normal-case">ship it tonight.</span>
              </h2>
            </div>
            <Link href="/events" className="btn btn-outline">
              All events <ArrowUpRight size={15} />
            </Link>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-5">
            {featured.map((e, i) => (
              <EventCard key={e.id} event={e} delay={i * 90} />
            ))}
            {community.map((e, i) => (
              <EventCard key={e.id} event={e} delay={i * 90} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- LIFE AT THE COLONY ---------- */}
      <section className="px-5 md:px-10 pb-20 md:pb-32">
        <div className="mx-auto max-w-[1440px]">
          <Reveal className="max-w-2xl mb-10">
            <p className="kicker text-ink-soft">Community & entertainment</p>
            <h2 className="display-lg mt-3">Life at the Colony.</h2>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { src: IMG.gamingCouch, label: "GTA V sessions & console nights", cls: "md:col-span-2 md:row-span-2 aspect-[4/3] md:aspect-auto" },
              { src: IMG.dinner, label: "Weekend community dinners", cls: "aspect-[4/3]" },
              { src: IMG.movieNight, label: "Projector movie nights", cls: "aspect-[4/3]" },
              { src: IMG.kitchen, label: "Kitchen takeovers", cls: "aspect-[4/3]" },
              { src: IMG.coworkLounge, label: "Creator hangouts & collabs", cls: "aspect-[4/3]" },
            ].map((item, i) => (
              <Reveal key={item.label} delay={i * 70} className={item.cls}>
                <figure className="img-frame rounded-2xl h-full relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.src} alt={item.label} loading="lazy" className="w-full h-full object-cover absolute inset-0" />
                  <figcaption className="absolute inset-x-0 bottom-0 p-4 text-white text-[13px] font-medium bg-gradient-to-t from-black/70 to-transparent pt-8">
                    {item.label}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link href="/community" className="btn btn-primary">
              Explore life at the Colony <ArrowRight size={15} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---------- MEET THE CREATORS ---------- */}
      <section className="bg-ink text-paper px-5 md:px-10 py-20 md:py-28">
        <div className="mx-auto max-w-[1440px]">
          <Reveal className="max-w-2xl mb-12">
            <p className="kicker text-paper/50">Meet the creators</p>
            <h2 className="display-lg mt-3">The people you&apos;ll be eating with.</h2>
            <p className="text-paper/60 mt-4 lede">
              A rotating cast of YouTubers, filmmakers, editors and founders —
              residents, mentors and workshop hosts who call the Colony home.
            </p>
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {CREATORS.map((c, i) => (
              <Reveal key={c.name} delay={i * 70}>
                <div className="img-frame rounded-2xl aspect-[3/4]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image} alt={c.name} loading="lazy" className="w-full h-full object-cover" />
                </div>
                <p className="font-display font-bold text-lg mt-4">{c.name}</p>
                <p className="text-paper/50 text-sm">{c.role}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- MADE AT THE COLONY ---------- */}
      <section className="px-5 md:px-10 py-20 md:py-28">
        <div className="mx-auto max-w-[1440px]">
          <Reveal className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <p className="kicker text-ink-soft">Community reels</p>
              <h2 className="display-lg mt-3">Made at the Colony.</h2>
            </div>
            <p className="text-ink-soft text-sm max-w-xs leading-relaxed">
              Real reels and shorts from residents. Full social handles go live at launch.
            </p>
          </Reveal>
          <ReelGrid posts={reels.slice(0, 6)} />
        </div>
      </section>

      {/* ---------- JOURNAL ---------- */}
      <section className="px-5 md:px-10 pb-20 md:pb-32">
        <div className="mx-auto max-w-[1440px]">
          <Reveal className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <p className="kicker text-ink-soft">Journal</p>
              <h2 className="display-lg mt-3">Daily articles &amp; creator stories.</h2>
            </div>
            <Link href="/journal" className="btn btn-outline">
              Read the Journal <ArrowUpRight size={15} />
            </Link>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {articlesList.map((a, i) => (
              <ArticleCard key={a.id} article={a} delay={i * 80} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- NEIGHBORHOOD ---------- */}
      <section className="bg-mist border-y border-line px-5 md:px-10 py-20 md:py-28">
        <div className="mx-auto max-w-[1440px] grid lg:grid-cols-2 gap-10 items-center">
          <Reveal>
            <p className="kicker text-ink-soft">Our neighborhood</p>
            <h2 className="display-lg mt-3">
              Johar Town,
              <br />
              <span className="serif-em normal-case">our backyard.</span>
            </h2>
            <p className="lede mt-5">
              Expo Centre Lahore, Emporium Mall and Canal Road are the Colony&apos;s
              next-door neighbours — with food streets, cafés and everything you
              need within a short walk.*
            </p>
            <p className="text-[12px] text-ink-soft mt-3">
              *Walking-time estimates are verified against the final published map pin before any specific claim is printed.
            </p>
            <Link href="/neighborhood" className="btn btn-outline mt-7">
              Around the Colony <ArrowRight size={15} />
            </Link>
          </Reveal>
          <Reveal delay={120}>
            <div className="img-frame rounded-3xl aspect-[4/3]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={IMG.lahoreJuice} alt="Street life in Lahore" loading="lazy" className="w-full h-full object-cover" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- JOIN ---------- */}
      <section className="bg-ink text-paper px-5 md:px-10 py-20 md:py-32">
        <div className="mx-auto max-w-[1440px] text-center">
          <Reveal>
            <MapPin className="mx-auto text-paper/50" size={22} />
            <h2 className="display-xl mt-6">
              Join the<br />Colony.
            </h2>
            <p className="text-paper/60 max-w-lg mx-auto mt-6 lede">
              First dibs on bunks, workshop drops, and community nights. No spam —
              just the good stuff.
            </p>
          </Reveal>
          <Reveal delay={120} className="mt-10">
            <JoinForm dark />
          </Reveal>
        </div>
      </section>
    </div>
  );
}

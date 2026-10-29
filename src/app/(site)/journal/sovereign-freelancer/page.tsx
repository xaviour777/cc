import type { Metadata } from "next";
import Link from "next/link";
import EssayReader from "@/components/gazette/essay-reader";
import CohortForm from "@/components/gazette/cohort-form";

export const metadata: Metadata = {
  title: "The Sovereign Freelancer — The Colony Gazette",
  description:
    "A bilingual broadsheet for independent storytellers, colorists and technical directors at Content Colony, Lahore.",
};

// Images were generated in Google Stitch; swap these for your own photos any time.
const IMG = {
  hero: "https://lh3.googleusercontent.com/aida-public/AB6AXuCClJK5JnT_iud3OLYbxfQFe1OtCCk1TGRmBarkY50YPxxF7qz0HdfRcWQdl9XAI4WEmm7YziI_jKv80Uewyvr4OqHs0Qt3xjmvgdTS_6aupysr2O-fwiGO3G8S64FpEoHaSToanHUrlV4dZHKKe9mIfO9iKdTE8PAZ6_avvW6tckt16_vpa5Lis5XXkvRSJi_wpWWCcRe63_EZtjXtLkXL96vn00VgDvybm5TXhNtkdHonVF0lITTVyw",
  sound:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCUGnJtBYXpSyF2LmDkdEJKtTJQqnYVHHb-4_grNW64ub2Yi9DL85cbBIHsLT2X9Ov7u5nYUEMmkXxsmUe7xLrSSy-Oi0MvmbM1blSe81TM9NxyiKQ-ssicyfnU-1fUYwzV1_TVdYINkFvyWXu4KolLxESrGhFCbN10ee38Y36QklxXYjE9yqe-aLhNUnUaB7muVALOuBfWV4AXZXNTSm1YxgUS0o2zWxz1vyk4alJJ",
  chai: "https://lh3.googleusercontent.com/aida-public/AB6AXuC7s96wC11gq94WooC6r8u_0U4EqJD9yPLDD8Z-ze0b2SNj5vAXnlrClDuHrSMTO_rGcaTqMdM8ktTor-r_XdIZoG4cGMzfRGC_jxETSm3gj2H6Ge8SF9ra5Q6HDiobIW7MPf48OgiQKh5Wd6GHfHFSlh9XzS46TmgpM0hpnOQ3jXWpahmvXX5GTloTVxPHwnpvxr9u_p2XizwZxbo3v_jGwnL90uyCa-y4X2CD4jxLbkrALlGI7r5xxA",
  color:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuA3YJnx3qtKmfT8Ja3vkG8MFrA-HZd7MLAvyDUr2Eps4OTz-rZ4WG3vXNQatdhyAvHUzG3kmpV2cnVe8lxvN2hQo-QUstNpDjdyKcol2hKHkeLE5K-cX3CtftHYjDiunS63uU5XGYlsDSkgAM4jngOjpV587-YonjyF52F3hldtyzAvmvWR6ql1VPQgznN1zeJcPAk25tZtiuJFZIDgVDO3vzYDQSeO6DcxZT3gjIGWlwQqtM0H2iIo5A",
};

const SILENCE_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBdNJea3W5zbeIE0G0IEPSjN08ouC3RSSt7U0grTGntin5zTlySZKRuQFkzifaDRmLxyK9dkAPSJYOLcc5zGhY4lO4gzONMIT_iHzTEphR4Gu73zXsSdSHvEhLLjMTcuXIuenyuMkYe4Dk5DHxh5WuPaLXoeESWnv_BWgHieK0DvMlsRnm9ppxP-Au5pUzOLkvQWSW33eVakgMIuWWCQe89BkpUfx8UV4J1fEh1MOXSNUaqs9OT922Lqw";

const PLATES = [
  { img: IMG.sound, en: "Sound Suite A", ur: "صوتی اسٹوڈیو", alt: "An editor working late at night on a laptop timeline" },
  { img: IMG.chai, en: "Chai & Pitch Courtyard", ur: "صحن اور چائے خانہ", alt: "Creatives gathered around a communal table" },
  { img: IMG.color, en: "Color Grading Suite", ur: "کلر گریڈنگ روم", alt: "A colour grading setup with dual monitors" },
];

const PILLARS = [
  {
    no: "01 // Microgrid",
    tag: "بلاتعطل توانائی",
    title: "Zero-Downtime Microgrid",
    body: "66kVA dedicated automated backup coupled with synchronous lithium solar banks. Never drop a DaVinci render or live export during load shedding in the Lahore summer.",
    urTitle: "خودکار سولر و جنریٹر سسٹم",
    urBody: "۶۶ کے وی اے خودکار جنریٹر اور سولر مائیکرو گرڈ۔ لیسکو کی طویل بندش کے دوران بھی رینڈرنگ اور لائیو سٹریمنگ کا تسلسل کبھی نہیں ٹوٹتا۔",
    stat: "Uptime: 99.98%",
    urStat: "توانائی: مکمل محفوظ",
  },
  {
    no: "02 // Bandwidth",
    tag: "دوہرا فائبر نیٹ ورک",
    title: "1Gbps Redundant Pipeline",
    body: "Direct StormFiber and Nayatel active failover lines with unthrottled international peering. Ship 8K ProRes sequences and huge archives straight to London and New York.",
    urTitle: "۱ جی بی پی ایس دوہرا فائبر",
    urBody: "ہائی اسپیڈ سٹارم فائبر اور نیا ٹیل کا بیک اپ۔ ۸ کے اور پرو ریس فوٹیج منٹوں میں بغیر تعطل بیرونی پروڈکشن ہاؤسز تک منتقل کریں۔",
    stat: "Speed: Symmetric 1Gbps",
    urStat: "رفتار: نان اسٹاپ فائبر",
  },
  {
    no: "03 // Collective",
    tag: "تخلیقی رفاقت",
    title: "Collective Guild Equity",
    body: "Weekly Friday chai feasts, cross-border client pitch clinics, and cooperative agency bidding. Independent directors sharing high-end gear and negotiating retainers as an organized studio.",
    urTitle: "مشترکہ پلیٹ فارم اور تعاون",
    urBody: "جمعہ کی روایتی چائے کی بیٹھک، عالمی کلائنٹس کے ساتھ مشترکہ پچنگ اور تخلیقی رفاقت جہاں ہر رکن کو یکساں احترام حاصل ہے۔",
    stat: "Members: 48 Residents",
    urStat: "ارکان: ۴۸ ریذیڈنٹس",
  },
];

function Stats({ items }: { items: [string, string][] }) {
  return (
    <div className="p-4 bg-mist grid grid-cols-2 gap-3 text-center">
      {items.map(([n, label]) => (
        <div key={label} className="p-3 bg-paper border border-line">
          <span className="font-news text-[28px] leading-9 font-medium block">{n}</span>
          <span className="gz-label text-ink-soft">{label}</span>
        </div>
      ))}
    </div>
  );
}

const english = (
  <>
    <div className="space-y-3">
      <p className="gz-label text-ink-soft">Essay 01 // Field report · 9 min read</p>
      <h2 className="font-news text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] tracking-[-0.02em]">
        The Sovereign Freelancer: Escaping Platform Peonage in South Asia
      </h2>
      <p className="font-news italic text-[18px] leading-[26px] text-ink-soft">
        Why the top tier of Pakistani video editors, colorists and technical writers are abandoning algorithmic
        bidding platforms to build distributed creative co-ops right here in Johar Town.
      </p>
    </div>
    <blockquote className="p-5 bg-mist border-l-[3px] border-ink">
      <p className="font-news italic text-[22px] leading-[28px]">
        “Lahore never truly sleeps, but most of its creative class has worked in painful isolation—scattered across
        noisy cafes with erratic power, fighting load shedding, and chained to bidding platforms that extract 20%
        platform rent.”
      </p>
      <footer className="gz-label text-ink-soft mt-3">— Content Colony Editorial Council</footer>
    </blockquote>
    <div className="space-y-4 text-[16px] leading-[26px]">
      <p className="first-letter:font-news first-letter:text-6xl first-letter:float-left first-letter:mr-3 first-letter:leading-[0.8]">
        For nearly a decade, the narrative sold to educated Pakistani youth was intoxicating: open a profile on an
        international bidding platform, undercut legacy Western agencies by 80%, and exchange your sleepless nights
        for volatile US dollars. Yet what began as digital liberation swiftly hardened into algorithmic serfdom.
        Freelancers found themselves surveilled by keystroke trackers, forced into arbitrary rating shootouts, and
        subjected to unilateral account suspensions without recourse.
      </p>
      <p>
        When transformers explode under 44°C summer heat in Punjab, an editor rendering 6K raw footage in a suburban
        apartment faces sudden catastrophic deadlines. The platform does not negotiate with power failure; an
        uncompleted milestone translates directly into a lower rating and vanishing visibility.
      </p>
      <p>
        Content Colony was built as the antithesis to this fragmentation. Nestled within Johar Town, the space
        replaces solitary gig precarity with collective physical sovereignty: an uninterrupted solar microgrid, dual
        1Gbps fiber lines, and acoustically isolated post-production bays. The real breakthrough is social —
        independent operators pooling client referrals, sharing DaVinci panels, and setting their own client pricing.
      </p>
    </div>
    <Stats items={[["20%", "Platform tax eliminated"], ["100%", "Solar power uptime"]]} />
  </>
);

const urdu = (
  <>
    <div className="space-y-3">
      <p className="gz-label text-ink-soft">مقالہ نمبر ۰۱ // خصوصی تجزیہ · مطالعہ: ۹ منٹ</p>
      <h2 className="text-[26px] md:text-[32px] leading-[2]">خود مختار فری لانسر: پلیٹ فارم کی غلامی سے تخلیقی خودمختاری تک</h2>
      <p className="text-[17px] text-ink-soft">
        کیوں پاکستان کے مایہ ناز ویڈیو ایڈیٹرز، ڈائریکٹرز اور قلمکار بیرونی فری لانسنگ پورٹلز کی اجارہ داری کو خیرباد کہہ کر
        جوہر ٹاؤن، لاہور میں باہمی تخلیقی تعاون کی بنیاد رکھ رہے ہیں۔
      </p>
    </div>
    <blockquote className="p-5 bg-mist border-r-[3px] border-ink">
      <p className="text-[19px]">
        ”لاہور کی راتیں کبھی سوتی نہیں، لیکن ہمارے تخلیق کار طویل عرصے سے تنہائی، غیر مستحکم انٹرنیٹ اور بجلی کی بندش کے خلاف
        تن تنہا لڑتے رہے ہیں۔ بیرونی الگورتھمز نے ہماری محنت کی قیمت تو لگائی مگر ہمارے تخلیقی وقار کو تسلیم نہ کیا۔“
      </p>
      <footer className="gz-label text-ink-soft mt-2">— کونسل آف کنٹینٹ کالونی، لاہور</footer>
    </blockquote>
    <div className="space-y-4 text-[16px]">
      <p>
        گزشتہ دس سالوں کے دوران پاکستانی نوجوانوں کے سامنے ایک دلفریب خواب سجایا گیا: بین الاقوامی فری لانس پلیٹ فارمز پر پروفائلز
        بنائیں، مغربی ایجنسیوں سے اسّی فیصد کم معاوضے پر کام قبول کریں اور اپنی نیندیں بیچ کر چند ڈالرز کمائیں۔ لیکن یہ خواب جلد
        ہی الگورتھم کی نئی اور بے رحم ڈیجیٹل جاگیرداری میں بدل گیا۔
      </p>
      <p>
        گرمی کے عروج میں جب لاہور میں ٹرانسفارمر جل جاتا ہے، تو گھر میں ۶ کے را فوٹیج رینڈر کرنے والے ایڈیٹر کے سر پر قیامت ٹوٹ
        پڑتی ہے۔ غیر ملکی کلائنٹس کو بجلی کے بحران سے کوئی غرض نہیں۔
      </p>
      <p>
        کنٹینٹ کالونی اسی تنہائی اور استحصال کا توڑ ہے۔ جوہر ٹاؤن میں قائم یہ مقام محض مشترکہ ورک اسپیس نہیں، بلکہ تخلیق کاروں کی
        خود مختار چھاؤنی ہے۔ سولر مائیکرو گرڈ، ۱ جی بی پی ایس فائبر لائنز اور ساؤنڈ پروف پروڈکشن بیز نے وہ بنیاد فراہم کی ہے جہاں
        ہم ملازم کے بجائے ساجھے دار بن کر کام کرتے ہیں۔
      </p>
    </div>
    <Stats items={[["۲۰٪", "پورٹل کمیشن کا خاتمہ"], ["۱۰۰٪", "بلاتعطل سولر پاور"]]} />
  </>
);

export default function GazettePage() {
  return (
    <div className="px-5 md:px-10 py-8 md:py-12">
      <div className="mx-auto max-w-[1280px]">
        {/* Top wire */}
        <section className="flex flex-col md:flex-row md:items-baseline justify-between gap-1 border-b border-ink/20 pb-2 mb-6">
          <p className="gz-label text-ink-soft">
            Volume IV <span className="opacity-40">/</span> Issue No. 14 <span className="opacity-40">/</span>{" "}
            <span className="text-ink">Johar Town, Lahore</span>
          </p>
          <p className="gz-label text-ink-soft">
            Fortnightly broadsheet ·{" "}
            <span lang="ur" dir="rtl" className="normal-case tracking-normal">
              ہفتہ وار اشاعت برائے آزاد تخلیق کار
            </span>
          </p>
        </section>

        {/* Masthead */}
        <section className="text-center mb-8">
          <p className="gz-label inline-block px-3 py-1 bg-mist">Colony Dispatch // دو لسانی اداریہ</p>
          <h1 className="font-news text-[38px] leading-[44px] md:text-[64px] md:leading-[72px] tracking-[-0.03em] mt-3">
            THE COLONY GAZETTE
          </h1>
          <div className="flex items-center justify-center gap-4 pt-2">
            <span className="h-px bg-ink/20 flex-1 max-w-xs" />
            <p className="gz-label text-ink-soft">Dispatches from Johar Town // جوہر ٹاؤن مراسلہ</p>
            <span className="h-px bg-ink/20 flex-1 max-w-xs" />
          </div>
        </section>

        {/* Hero */}
        <section className="mb-12">
          <div className="relative aspect-[4/3] sm:aspect-[21/9] md:aspect-[2.4/1] bg-mist overflow-hidden border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={IMG.hero}
              alt="The Colony library and late-night editing floor"
              className="w-full h-full object-cover grayscale contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
            <div className="absolute bottom-0 inset-x-0 p-4 md:p-6 flex flex-col md:flex-row md:items-end justify-between gap-2 text-white">
              <div>
                <p className="gz-label text-white/70">Archival plate // 04-B</p>
                <p className="font-news text-[22px] leading-[28px]">The Colony Library &amp; Night Editing Floor, Block H</p>
              </div>
              <p lang="ur" dir="rtl" className="text-[13px] text-white/90">
                جوہر ٹاؤن بلاک ایچ: شبینہ سٹوڈیو اور رنگ و تحریر کا مرکز
              </p>
            </div>
          </div>
          <div className="mt-2 p-4 bg-mist grid md:grid-cols-2 gap-4">
            <div>
              <p className="gz-label text-ink-soft">Manifesto dossier</p>
              <p className="text-[14px] font-medium mt-1">
                Weekly dispatch for independent storytellers, colorists and technical directors building creative
                autonomy.
              </p>
            </div>
            <div lang="ur" dir="rtl">
              <p className="gz-label text-ink-soft">منشور و بیانیہ</p>
              <p className="text-[14px]">
                لاہور کے آزاد تخلیق کاروں، ایڈیٹرز اور تکنیکی ماہرین کے لیے ہفتہ وار باقاعدہ مراسلہ۔
              </p>
            </div>
          </div>
        </section>

        {/* Lead essay */}
        <section className="mb-16">
          <EssayReader english={english} urdu={urdu} />
        </section>

        {/* Photo plates */}
        <section className="mb-16">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-4 border-b border-ink/20">
            <p className="gz-label">Floor plates &amp; studio life // احاطہ اور اسٹوڈیو مناظر</p>
            <p className="gz-label text-ink-soft">Johar Town sanctuary</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {PLATES.map((p) => (
              <figure key={p.en} className="group relative aspect-[4/3] bg-mist overflow-hidden border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.img}
                  alt={p.alt}
                  loading="lazy"
                  className="w-full h-full object-cover grayscale contrast-125 group-hover:scale-105 transition-transform duration-500"
                />
                <figcaption className="absolute bottom-2 inset-x-2 px-3 py-2 bg-paper/90 backdrop-blur-sm flex justify-between items-center">
                  <span className="gz-label">{p.en}</span>
                  <span lang="ur" dir="rtl" className="text-[12px]">
                    {p.ur}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Pillars */}
        <section className="mb-16">
          <div className="flex flex-wrap justify-between items-baseline gap-2 pb-2 mb-6 border-b border-ink/20">
            <div>
              <p className="gz-label text-ink-soft">Infrastructure blueprint</p>
              <h3 className="font-news text-[22px] leading-[28px]">Dispatch Highlights &amp; Colony Realia</h3>
            </div>
            <p lang="ur" dir="rtl" className="text-[18px]">
              بنیادی سہولیات اور ستون
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PILLARS.map((p) => (
              <div key={p.no} className="p-6 bg-mist border border-line flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-ink/10">
                    <span className="gz-label">{p.no}</span>
                    <span lang="ur" dir="rtl" className="text-[12px] text-ink-soft">
                      {p.tag}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-news text-[22px] leading-[28px] font-medium">{p.title}</h4>
                    <p className="text-[14px] leading-[22px]">{p.body}</p>
                  </div>
                  <div lang="ur" dir="rtl" className="pt-3 border-t border-ink/10">
                    <h5 className="text-[15px] font-semibold">{p.urTitle}</h5>
                    <p className="text-[13px]">{p.urBody}</p>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between gap-2 text-ink-soft">
                  <span className="gz-label">{p.stat}</span>
                  <span lang="ur" dir="rtl" className="text-[12px]">
                    {p.urStat}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* More dispatches */}
        <section className="mb-16">
          <div className="flex flex-wrap justify-between items-baseline gap-2 pb-2 mb-6 border-b border-ink/20">
            <p className="gz-label">More dispatches // مزید مراسلے</p>
          </div>
          <Link
            href="/journal/architecture-of-silence"
            className="group grid md:grid-cols-[2fr_3fr] border border-line hover:border-ink transition-colors"
          >
            <div className="relative aspect-[16/10] md:aspect-auto bg-ink overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={SILENCE_IMG}
                alt="A sound engineer at an analog mixing console"
                loading="lazy"
                className="w-full h-full object-cover grayscale contrast-125 group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6 md:p-8 space-y-3">
              <p className="flex flex-wrap items-center gap-2">
                <span className="gz-label px-2 py-0.5 bg-ink text-paper">Dispatch 03</span>
                <span className="gz-label text-ink-soft">Cultural acoustics &amp; cinema sound · 14 min read</span>
              </p>
              <h3 className="font-news text-[26px] leading-[34px] md:text-[32px] md:leading-[40px] tracking-[-0.02em]">
                The Architecture of Silence: Why South Asian Cinema’s Greatest Crisis is Acoustic Precarity
              </h3>
              <p lang="ur" dir="rtl" className="text-[16px] text-ink-soft">
                خاموشی کی تلاش: لاہور کے شور میں سچی آواز کی گرفت
              </p>
              <span className="gz-label u-link inline-block">Read the dispatch →</span>
            </div>
          </Link>
        </section>

        {/* Cohort application */}
        <section id="apply" className="bg-mist border border-line p-6 md:p-10 mb-16">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <p className="gz-label text-ink-soft">Admissions // اگلی ریذیڈنسی</p>
              <h3 className="font-news text-[28px] leading-[34px] md:text-[40px] md:leading-[48px] tracking-[-0.02em]">
                Join Cohort IV at Content Colony
              </h3>
              <p lang="ur" dir="rtl" className="text-[15px] text-ink-soft">
                جوہر ٹاؤن اسٹوڈیو میں چوتھے بیج کے لیے درخواستیں کھلی ہیں — قلمکاروں، ایڈیٹرز اور میڈیا انٹرپرینیورز کا خیرمقدم ہے۔
              </p>
            </div>
            <CohortForm />
          </div>
        </section>

        {/* Colophon */}
        <section className="pt-4 border-t border-ink/20 grid md:grid-cols-3 gap-4 text-[12px] leading-[18px] text-ink-soft">
          <div>
            <p className="gz-label text-ink">Typographic standard</p>
            <p className="mt-1">
              Typeset in <em className="font-news">Newsreader</em> &amp; Noto Nastaliq Urdu, on an archival broadsheet grid.
            </p>
          </div>
          <div>
            <p className="gz-label text-ink">Physical pressroom</p>
            <p className="mt-1">Published digitally at Content Colony, Block H, Johar Town, Lahore.</p>
          </div>
          <div lang="ur" dir="rtl">
            <p className="gz-label text-ink">طباعت و اشاعت</p>
            <p>یہ شمارہ کنٹینٹ کالونی جوہر ٹاؤن، لاہور سے جاری کیا گیا۔</p>
          </div>
        </section>
      </div>
    </div>
  );
}

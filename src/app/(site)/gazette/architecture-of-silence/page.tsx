import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, AudioLines, Zap } from "lucide-react";
import ChapterReader, { type Chapter } from "@/components/gazette/chapter-reader";
import ResidencyForm from "@/components/gazette/residency-form";

export const metadata: Metadata = {
  title: "The Architecture of Silence — The Colony Gazette",
  description:
    "Why South Asian cinema's greatest crisis is acoustic precarity — a bilingual dispatch from Soundstage B-02, Content Colony, Lahore.",
};

// Images were generated in Google Stitch; swap these for your own photos any time.
const IMG = {
  hero: "https://lh3.googleusercontent.com/aida-public/AB6AXuBdNJea3W5zbeIE0G0IEPSjN08ouC3RSSt7U0grTGntin5zTlySZKRuQFkzifaDRmLxyK9dkAPSJYOLcc5zGhY4lO4gzONMIT_iHzTEphR4Gu73zXsSdSHvEhLLjMTcuXIuenyuMkYe4Dk5DHxh5WuPaLXoeESWnv_BWgHieK0DvMlsRnm9ppxP-Au5pUzOLkvQWSW33eVakgMIuWWCQe89BkpUfx8UV4J1fEh1MOXSNUaqs9OT922Lqw",
  floor:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuARu9Nw4f_J1DFmohEHeCk8l6UUuH5zet1FwK8Fh1xQ4U67kHfDOrMk3Ntj9AQbx4p0XFZ8Wvo_5aFbqW9fewpku4DaaxBixu3YYuJ6NkL5lcdPpntW8DCOOT475CURis8aYtZReKayicfN8qDYef5teS4art0Nd8wujLBWbOmYH3yDk8RbNr-F6lMmYvjMwRQ_3KuB2f701lirXhFYwZ5CCO2PXY-NmUjYDI4Ja7xvk8gp_jsNc3wUrA",
  foley:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDNRH08-9IIF9kRbv2wVJ00Xjo8SNW-vJ9YJNviV-4LtHyoW3K_Ub3mXiR6y7D1NPsIoHqcMiMn0SnEBi3fpUru-mZfygb0Lbx6ZF7k8FkUdcuQ-HYSjzQUm7AOiNlifdGB9JWifLDs4YpOaBvvjT-YrBVq4SlReqfIQlJW9CWGpbVTUuLQ1bcbZn4DzMa59pDm0iH2FGmTYjoeweP5xURuUw3q0_XQugpjX7zsv_jq05k5LaRQvBAtEg",
  mastering:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuA7TbMDsbgY2Z9DzdMI_j5XJlWUIVJpUIcxlE_pvVJCL5HWBOCrD0nRzyspBMegPv_Zt3s-Kx_SsnZ_4wo_g9dH-R86DiXtxsW3qOmbw7l8aft4Ccg3_DPpc3VWRalHZAE4N9tgOlDGBMd9RfWY0RkCqlnWnt8RisH5MH-8yTnK3J9kGHBNpkjv0sMxTJmAGkwfac5iuewhGOX-0wPUp6DxBFwgJqAULEIKaVyo2H5_tWUvMks_4ao3GQ",
};

const h3 = "font-news text-[24px] leading-[32px] md:text-[28px] md:leading-[36px] font-medium tracking-[-0.015em]";
const h3ur = "text-[22px] md:text-[24px] leading-[2]";
const lead = "text-[16px] leading-[26px]";
const body = "text-[14px] leading-[22px] text-ink-soft";

const CHAPTERS: Chapter[] = [
  {
    no: "Chapter 01 // باب اول",
    tag: "Urban resonance & bedroom studios",
    en: (
      <>
        <h3 className={h3}>The Roar of the Mohalla: Acoustic Precarity in Lahore</h3>
        <p className={lead}>
          Walk into any independent music producer’s bedroom in Johar Town, Model Town or Gulberg, and you will discover
          a profound, silent exhaustion. It is not creative lethargy, but structural helplessness. South Asian domestic
          architecture is built from single-leaf fired brick, uninsulated concrete slabs and single-pane aluminium
          windows. For thermal mass in intense summers this is efficient; for acoustic isolation it is catastrophic.
        </p>
        <p className={body}>
          Between 7:00 AM and midnight, the microphone captures not just the vocalist’s timbre but an aggressive city
          symphony: the low thrum of two-stroke rickshaws, the squeal of motorcycle brakes, howling street dogs, and the
          pervasive 50Hz hum of poorly wound neighbourhood transformers.
        </p>
        <div className="p-4 bg-mist border-l-[3px] border-ink">
          <p className="gz-label mb-1">Field observation note</p>
          <p className="text-[12px] leading-[18px] italic text-ink-soft">
            “When our team sampled 40 raw vocal tracks sent by emerging Lahore indie musicians, 38 showed phase
            cancellation below 120Hz from ceiling-fan motor noise leaking into large-diaphragm condenser mics.”
          </p>
        </div>
      </>
    ),
    ur: (
      <>
        <h3 className={h3ur}>محلے کا شور اور مائیکروفون کا المیہ: صوتی قحط سالی</h3>
        <p className="text-[16px]">
          جوہر ٹاؤن، ماڈل ٹاؤن یا پرانی انارکلی کے کسی بھی نوجوان پروڈیوسر یا گلوکار کے کمرے میں قدم رکھیں تو آپ کو ایک عجب تھکن
          اور بے بسی محسوس ہوگی۔ یہ تخلیقی بانجھ پن نہیں بلکہ صوتیاتی بے چارگی ہے۔ ہمارے گھر پکی اینٹوں، ماربل کے فرشوں اور پتلی
          ایلومینیم کھڑکیوں سے بنے ہیں جو آواز کو روکنے کے بجائے ڈھول کی طرح بجاتے ہیں۔
        </p>
        <p className="text-[14px] text-ink-soft">
          صبح سے رات گئے تک حساس مائیکروفون پر صرف سُر نہیں چڑھتے، بلکہ محلے کا پورا تماشا ریکارڈ ہوتا ہے: چنگ چی رکشوں کی
          گھرگھراہٹ، جنریٹروں کا شور، گلی میں سبزی بیچنے والے کی آواز اور چھت کے پنکھے کی باریک گونج۔
        </p>
        <div className="p-4 bg-mist border-r-[3px] border-ink">
          <p className="gz-label mb-1">مشاہدۂ لیب — جوہر ٹاؤن</p>
          <p className="text-[13px] text-ink-soft">
            ”لاہور کے آزاد تخلیق کاروں کے ۴۰ خام ٹریکس کے تجزیے سے پتا چلا کہ ۹۵ فیصد ریکارڈنگز میں بجلی کا جھٹکا اور گلی کی
            گونج اتنی گہری تھی کہ ان کا اصلی احساس ہی ختم ہو گیا۔“
          </p>
        </div>
      </>
    ),
  },
  {
    no: "Chapter 02 // باب دوم",
    tag: "Indigenous Foley mechanics",
    en: (
      <>
        <h3 className={h3}>Foley Authenticity: The Texture of Clay, Copper and Khaddar</h3>
        <p className={lead}>
          Pakistani films and serials have long suffered from an audible dissonance: a scene set in a rural Punjabi
          haveli often sounds like a suburban Californian living room, because editors under tight deadlines default to
          stock American and European sound libraries.
        </p>
        <p className={body}>
          A library footstep is a leather dress shoe on polished oak. It carries none of the granular friction of
          hand-stitched <em>khussa</em> crunching into Ravi silt. A ceramic cup clinks sharp and brittle; an unglazed
          Lahore clay <em>piyali</em> striking a wooden <em>takht</em> gives an earthy, low-mid thump.
        </p>
        <p className={body}>
          At Soundstage B-02 we built tactile pits of terracotta fragments, sun-baked clay, river sand and woven raw
          khaddar. Authentic cinema demands authentic material resonance.
        </p>
      </>
    ),
    ur: (
      <>
        <h3 className={h3ur}>دیسی فولے کا کمال: مٹی، تانبے اور کھدر کی ساخت</h3>
        <p className="text-[16px]">
          ہماری فلموں اور ڈراموں کا سب سے بڑا صوتی المیہ یہ رہا ہے کہ ایک روایتی پنجابی حویلی کے منظر میں بھی پس منظر کی آواز
          ہالی وڈ کے کسی اسٹوڈیو جیسی سنائی دیتی ہے۔
        </p>
        <p className="text-[14px] text-ink-soft">
          دیسی چمڑے کے کھسے کی چاپ راوی کی ریت پر بالکل الگ کھنک رکھتی ہے۔ اسی طرح چینی کے کپ اور مٹی کی کچی پیالی کی آواز میں
          زمین آسمان کا فرق ہے۔
        </p>
        <p className="text-[14px] text-ink-soft">
          ہم نے کالونی کے ساؤنڈ اسٹیج میں خاص دیسی فولے پٹ تیار کیے ہیں جہاں مٹی کی اینٹوں، خالص کھدر اور پرانے لکڑی کے
          دروازوں سے مقامی سنیما کی اصل آوازیں دوبارہ زندہ کی جا رہی ہیں۔
        </p>
      </>
    ),
  },
  {
    no: "Chapter 03 // باب سوم",
    tag: "Pure power & impedance floors",
    en: (
      <>
        <h3 className={h3}>Analog Warmth &amp; the Microgrid Voltage Floor</h3>
        <p className={lead}>
          There is a myth that vintage analog hardware — Fairchild limiters, Pultec equalizers, tube preamps — is
          naturally ‘noisy’. In Lahore the myth was reinforced by ungrounded wiring, brownouts and voltage swings that
          made transformers whine in the audible 100Hz–4kHz band.
        </p>
        <p className={body}>
          Plugged into unstable power, high-impedance ribbon microphones behave like antennas for municipal RF
          interference. Content Colony took Soundstage B-02 off the grid during critical tracking: an isolated
          pure-sine-wave inverter array feeds shielded balanced lines, dropping the noise floor to -112dBFS.
        </p>
      </>
    ),
    ur: (
      <>
        <h3 className={h3ur}>اینالاگ وارمتھ اور صاف بجلی کا معجزہ</h3>
        <p className="text-[16px]">
          ہمارے ہاں یہ مغالطہ عام تھا کہ اینالاگ آلات لازماً شور پیدا کرتے ہیں۔ درحقیقت قصور ان آلات کا نہیں بلکہ شہر کی بے
          قاعدہ بجلی کا تھا۔
        </p>
        <p className="text-[14px] text-ink-soft">
          کالونی کے اسٹوڈیو میں ہم نے مین گرڈ سے کٹ کر سولر مائیکرو گرڈ اور خالص سائن ویو انورٹرز کا نظام لگایا۔ جب تاروں کا
          شور صفر ہوا تو پرانے اینالاگ آلات کی مدھر گرمائش نے ثابت کیا کہ آواز کتنی پاکیزہ ہو سکتی ہے۔
        </p>
      </>
    ),
  },
  {
    no: "Chapter 04 // باب چہارم",
    tag: "Hybrid orchestration at dawn",
    en: (
      <>
        <h3 className={h3}>The 3:00 AM Scoring Session: Reclaiming Sonic Identity</h3>
        <p className={lead}>
          At three in the morning the silence over Johar Town is palpable. In the live room, Ustad Zeeshan tunes his
          110-year-old teak sarangi beside an analog modular rack humming a 38Hz sub-bass sine. When the bow meets gut
          strings, human micro-pitch bending meets modern low-end pressure.
        </p>
        <p className={body}>
          South Asian cinema music does not need to abandon its microtonal heritage — <em>shruti</em> and <em>meend</em>{" "}
          — to compete with Hollywood brass. Tracked in true isolation, a single rubab strum carries more atmosphere than
          an army of digital string libraries.
        </p>
      </>
    ),
    ur: (
      <>
        <h3 className={h3ur}>رات کے تین بجے: سارنگی، رباب اور سنتھیسائزر کا ملاپ</h3>
        <p className="text-[16px]">
          رات کے تین بجے جب پورا جوہر ٹاؤن سو رہا ہوتا ہے، اسٹوڈیو کا لائیو روم جاگ اٹھتا ہے۔ استاد ذیشان اپنی سو سال پرانی
          سارنگی ملاتے ہیں جبکہ ماڈیولر سنتھ سے ۳۸ ہرٹز کی گہری بیس گونجتی ہے۔
        </p>
        <p className="text-[14px] text-ink-soft">
          ہمارے سینیما کو عالمی معیار کے لیے مغربی فارمولوں کی نقل کی ضرورت نہیں۔ سچی خاموشی میں ریکارڈ کیا گیا ایک رباب ہزاروں
          ڈیجیٹل پلگ انز سے زیادہ پراثر ہے۔
        </p>
      </>
    ),
  },
];

const METRICS = [
  {
    label: "Ambient noise floor",
    chip: "NC-15 spec",
    value: "14.8 dBA",
    note: "Johar Town street outside: 78.4 dBA. Total attenuation: -63.6 dBA.",
    path: (
      <>
        <path d="M0,20 Q15,18 30,19 T60,8 T80,14 T100,5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M0,20 Q15,18 30,19 T60,8 T80,14 T100,5 L100,24 L0,24 Z" fill="currentColor" fillOpacity="0.08" />
      </>
    ),
  },
  {
    label: "Microgrid AC sine distortion",
    chip: "0.02% THD",
    value: "229.8 V",
    note: "Zero transformer hum; an isolated solar lithium bus feeds the preamps.",
    path: (
      <path
        d="M0,12 C10,2 15,2 25,12 C35,22 40,22 50,12 C60,2 65,2 75,12 C85,22 90,22 100,12"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    ),
  },
  {
    label: "Low-end decay time",
    chip: "RT60 @ 63Hz",
    value: "0.18 sec",
    note: "Tuned membrane bass traps remove flutter from brick enclosures.",
    path: (
      <>
        {[10, 14, 18, 22, 17, 12, 9, 6, 4].map((h, i) => (
          <rect key={i} x={i * 12} y={24 - h} width="8" height={h} fill="currentColor" fillOpacity={0.15 + h / 30} />
        ))}
      </>
    ),
  },
];

const PLATES = [
  {
    img: IMG.floor,
    fig: "Fig. 01",
    en: "Floating Floor & Decoupled Walls",
    ur: "تیرتا ہوا فرش اور ڈبل دیواریں",
    body: "Concrete slab isolated on neoprene pucks, cutting low-frequency rumble from the road outside.",
    spec: "Lab spec: STC 68 / zero contact",
  },
  {
    img: IMG.foley,
    fig: "Fig. 02",
    en: "Indigenous Foley Pit & Props",
    ur: "روایتی فولے پٹ: ریت، مٹی اور پرانی لکڑی",
    body: "Ravi mud, fired brick pavers and brass vessels for true-to-life South Asian cinema sound.",
    spec: "Prop vault: 180+ vernacular artifacts",
  },
  {
    img: IMG.mastering,
    fig: "Fig. 03",
    en: "Analog Mastering & Atmos Rig",
    ur: "اینالاگ ماسٹرنگ کنسول اور سینیما مکسنگ",
    body: "Calibrated 7.1.4 immersive monitoring with discrete Class-A analog summing.",
    spec: "Calibration: Room B",
  },
];

const DOSSIER: [string, string, string][] = [
  ["Lead authors", "Bilal Raza & Farhan Tareen", "Foley master & classical composer, Colony Sound Lab"],
  ["Location & rig", "Content Colony Soundstage B-02, Johar Town", "Genelec 8351B · Shure KSM44A · Neve 1073DPX"],
  ["Reading time", "14 min read", "چودہ منٹ مطالعہ"],
  ["Noise isolation", "STC 68 floating enclosure", "Attenuated to an NC-15 background floor"],
];

export default function ArchitectureOfSilencePage() {
  return (
    <div className="px-5 md:px-10 py-8 md:py-12">
      <div className="mx-auto max-w-[1280px]">
        {/* Issue banner */}
        <section className="border border-line mb-8">
          <div className="px-4 py-2 bg-mist flex flex-wrap items-center justify-between gap-2">
            <p className="gz-label">
              <Link href="/gazette" className="u-link">
                The Colony Gazette
              </Link>{" "}
              <span className="opacity-40">•</span> Vol. IV — Iss. 16 <span className="opacity-40">•</span> Johar Town,
              Lahore
            </p>
            <span className="gz-label px-2 py-0.5 bg-ink text-paper">Dispatch 03</span>
          </div>
          <div className="p-5 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="gz-label text-ink-soft mb-2">The broadsheet dispatch // Special monograph</p>
              <h1 className="font-news text-[38px] leading-[44px] md:text-[56px] md:leading-[64px] tracking-[-0.03em]">
                THE COLONY GAZETTE
              </h1>
            </div>
            <div className="md:text-right">
              <p lang="ur" dir="rtl" className="text-[20px]">
                دی کالونی گزٹ — جوہر ٹاؤن مراسلہ: شمارہ ۰۳
              </p>
              <p className="gz-label text-ink-soft mt-1">Cultural acoustics &amp; cinema sound edition</p>
            </div>
          </div>
        </section>

        {/* Hero */}
        <section className="relative w-full aspect-[4/5] sm:aspect-[16/9] md:aspect-[21/9] bg-ink overflow-hidden mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={IMG.hero}
            alt="A sound engineer at an analog mixing console in a Johar Town control room"
            className="w-full h-full object-cover grayscale contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          <div className="absolute top-4 inset-x-4 flex flex-wrap justify-between gap-2">
            <span className="gz-label px-2 py-1 bg-black/80 text-white">Plate No. 07-C | Soundstage B-02</span>
            <span className="gz-label px-2 py-1 bg-white/90 text-black">03:15 PKT | Lahore</span>
          </div>
          <div className="absolute bottom-5 inset-x-5 md:bottom-8 md:inset-x-8 flex flex-col md:flex-row md:items-end justify-between gap-3 text-white">
            <div className="max-w-3xl">
              <p lang="ur" dir="rtl" className="text-[22px] md:text-[28px] text-right md:text-left">
                خاموشی کی تلاش: لاہور کے شور میں سچی آواز کی گرفت
              </p>
              <p className="gz-label text-white/75 mt-1">
                The pursuit of acoustic sovereignty: capturing uncorrupted signal in a city of perpetual noise
              </p>
            </div>
            <p className="gz-label text-white/70 md:text-right shrink-0">
              Mono spec: 96kHz / 32-bit float
              <br />
              Archival calibration
            </p>
          </div>
        </section>

        {/* Title + dossier */}
        <section className="grid lg:grid-cols-12 gap-6 mb-14">
          <div className="lg:col-span-8 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <p className="flex flex-wrap items-center gap-2">
                <span className="gz-label px-2 py-0.5 bg-ink text-paper">Critical dispatch</span>
                <span className="gz-label text-ink-soft">Folio registry no. 441-B</span>
              </p>
              <h2 className="font-news text-[30px] leading-[38px] md:text-[40px] md:leading-[48px] tracking-[-0.02em]">
                The Architecture of Silence: Why South Asian Cinema’s Greatest Crisis is Acoustic Precarity
              </h2>
              <p lang="ur" dir="rtl" className="text-[18px] text-ink-soft">
                گونج، خاموشی اور دیسی آواز: لاہور کی گلیوں کا صوتی شعور اور سینیما اسکورنگ کا بحران
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-5 p-5 bg-mist border border-line">
              <div className="space-y-2">
                <p className="gz-label text-ink-soft">English premise</p>
                <blockquote className="font-news italic text-[18px] leading-[26px]">
                  “In South Asia, silence is not an aesthetic absence — it is an expensive infrastructural victory over
                  traffic horns, generator hum, and thin brick walls.”
                </blockquote>
                <p className="text-[12px] text-ink-soft">— Soundstage Journal Log, B-02</p>
              </div>
              <div lang="ur" dir="rtl" className="space-y-1">
                <p className="gz-label text-ink-soft">اردو نقطۂ نظر</p>
                <blockquote className="text-[16px]">
                  ”لاہور جیسے پرشور شہر میں مکمل خاموشی کوئی قدرتی نعمت نہیں، بلکہ جنریٹروں کے شور، سڑکوں کے ہارن اور اینٹوں کی گونج کے
                  خلاف ایک باقاعدہ انجینئرنگ جہاد ہے۔“
                </blockquote>
                <p className="text-[12px] text-ink-soft">— روزنامچہ ساؤنڈ اسٹیج، جوہر ٹاؤن</p>
              </div>
            </div>
          </div>
          <aside className="lg:col-span-4 border border-line p-5 flex flex-col justify-between gap-5">
            <div className="space-y-4">
              <p className="gz-label px-2 py-1 bg-mist flex justify-between">
                <span>Field dossier</span>
                <span>Verified entry</span>
              </p>
              {DOSSIER.map(([k, v, sub]) => (
                <div key={k} className="text-[12px] leading-[18px]">
                  <p className="gz-label text-ink-soft">{k}</p>
                  <p className="text-[14px] font-medium">{v}</p>
                  <p className="text-ink-soft">{sub}</p>
                </div>
              ))}
            </div>
            <div className="p-3 bg-mist">
              <p className="gz-label">Archival accession</p>
              <p className="font-mono text-[12px] text-ink-soft">CC-LHE-DISP-03-VOX</p>
            </div>
          </aside>
        </section>

        {/* Telemetry */}
        <section className="p-4 md:p-5 bg-mist border border-line mb-14">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <p className="gz-label">Soundstage B-02 // Isolation metrics</p>
            <p className="gz-label text-ink-soft">03:00 PKT baseline</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {METRICS.map((m) => (
              <div key={m.label} className="bg-paper border border-line p-4">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <span className="gz-label text-ink-soft">{m.label}</span>
                  <span className="gz-label px-1.5 py-0.5 bg-mist shrink-0">{m.chip}</span>
                </div>
                <p className="font-mono text-[28px] leading-9 my-1">{m.value}</p>
                <p className="text-[12px] leading-[18px] text-ink-soft mb-3">{m.note}</p>
                <svg viewBox="0 0 100 24" className="w-full h-8 text-ink overflow-visible" aria-hidden>
                  {m.path}
                </svg>
              </div>
            ))}
          </div>
        </section>

        {/* Chapters */}
        <section className="mb-14">
          <ChapterReader chapters={CHAPTERS} />
        </section>

        {/* Documentary plates */}
        <section className="mb-14">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 mb-4 bg-mist border border-line">
            <p className="gz-label">Documentary plates // تصاویری شواہد</p>
            <p className="gz-label text-ink-soft">Plates 08-A through 08-C</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {PLATES.map((p) => (
              <div key={p.fig} className="border border-line p-4 flex flex-col justify-between">
                <div>
                  <div className="relative aspect-[16/10] bg-mist overflow-hidden mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.img}
                      alt={p.en}
                      loading="lazy"
                      className="w-full h-full object-cover grayscale contrast-125 hover:scale-105 transition-transform duration-500"
                    />
                    <span className="gz-label absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/80 text-white">{p.fig}</span>
                  </div>
                  <h4 className="text-[16px] font-semibold">{p.en}</h4>
                  <p lang="ur" dir="rtl" className="text-[13px] text-ink-soft">
                    {p.ur}
                  </p>
                  <p className="text-[12px] leading-[18px] text-ink-soft mt-2">{p.body}</p>
                </div>
                <p className="gz-label text-ink-soft mt-3 px-2 py-1 bg-mist">{p.spec}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Residency application */}
        <section id="apply" className="border border-line p-5 md:p-10 mb-14 grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-4">
            <p className="flex flex-wrap items-center gap-2">
              <span className="gz-label px-2 py-0.5 bg-ink text-paper">Call for residents</span>
              <span className="gz-label text-ink-soft">Cohort V // Winter</span>
            </p>
            <h3 className="font-news text-[28px] leading-[36px] font-medium tracking-[-0.015em]">
              Claim a Soundstage Residency or Apply for Masterclass Cohort V
            </h3>
            <p lang="ur" dir="rtl" className="text-[17px] text-ink-soft">
              ساؤنڈ اسٹیج اور آڈیو ریزیڈنسی کی درخواست: کوہورٹ ۵ — موسمِ سرما
            </p>
            <p className="text-[14px] leading-[22px] text-ink-soft">
              The Colony Soundstage fellowship gives six independent audio designers, film composers and Foley artists
              24/7 access to Soundstage B-02, analog mastering racks and the indigenous sound library.
            </p>
            <ul className="space-y-2 p-4 bg-mist text-[13px]">
              <li className="flex items-center gap-2">
                <BadgeCheck size={16} /> Zero studio booking fees for accepted fellows
              </li>
              <li className="flex items-center gap-2">
                <AudioLines size={16} /> Mastering credits across Atmos &amp; film prints
              </li>
              <li className="flex items-center gap-2">
                <Zap size={16} /> Uninterrupted clean solar microgrid access
              </li>
            </ul>
          </div>
          <div className="lg:col-span-7 bg-mist p-5 md:p-6">
            <ResidencyForm />
          </div>
        </section>

        {/* Colophon */}
        <section className="p-5 bg-mist border border-line grid sm:grid-cols-2 md:grid-cols-4 gap-5 text-[12px] leading-[18px] text-ink-soft">
          <div>
            <p className="gz-label text-ink mb-1">Broadsheet typography</p>
            <p>Newsreader for headlines, Inter for text, Space Grotesk for labels, Noto Nastaliq for Urdu.</p>
          </div>
          <div>
            <p className="gz-label text-ink mb-1">Guild ethics</p>
            <p>No synthetic voice clones. Open sound samples under CC-BY. Foley artists credited on screen.</p>
          </div>
          <div>
            <p className="gz-label text-ink mb-1">Power standard</p>
            <p>100% microgrid clean wattage for every session at Soundstage B-02.</p>
          </div>
          <div className="flex flex-col justify-between gap-2">
            <div>
              <p className="gz-label text-ink mb-1">Postal stamp</p>
              <p>The Colony Gazette, Johar Town, Lahore</p>
            </div>
            <Link href="/gazette" className="gz-label text-ink u-link self-start">
              ← Back to the Gazette
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

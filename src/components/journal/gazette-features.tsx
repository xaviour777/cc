import Link from "next/link";

// The two bilingual long reads built from the Stitch designs. They live as
// their own pages under /journal, so list them here next to the CMS articles.
const FEATURES = [
  {
    href: "/journal/sovereign-freelancer",
    tag: "Essay 01 · Field report · 9 min",
    title: "The Sovereign Freelancer: Escaping Platform Peonage in South Asia",
    ur: "خود مختار فری لانسر: پلیٹ فارم کی غلامی سے تخلیقی خودمختاری تک",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCClJK5JnT_iud3OLYbxfQFe1OtCCk1TGRmBarkY50YPxxF7qz0HdfRcWQdl9XAI4WEmm7YziI_jKv80Uewyvr4OqHs0Qt3xjmvgdTS_6aupysr2O-fwiGO3G8S64FpEoHaSToanHUrlV4dZHKKe9mIfO9iKdTE8PAZ6_avvW6tckt16_vpa5Lis5XXkvRSJi_wpWWCcRe63_EZtjXtLkXL96vn00VgDvybm5TXhNtkdHonVF0lITTVyw",
  },
  {
    href: "/journal/architecture-of-silence",
    tag: "Dispatch 03 · Cinema sound · 14 min",
    title: "The Architecture of Silence: Why South Asian Cinema’s Greatest Crisis is Acoustic Precarity",
    ur: "خاموشی کی تلاش: لاہور کے شور میں سچی آواز کی گرفت",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBdNJea3W5zbeIE0G0IEPSjN08ouC3RSSt7U0grTGntin5zTlySZKRuQFkzifaDRmLxyK9dkAPSJYOLcc5zGhY4lO4gzONMIT_iHzTEphR4Gu73zXsSdSHvEhLLjMTcuXIuenyuMkYe4Dk5DHxh5WuPaLXoeESWnv_BWgHieK0DvMlsRnm9ppxP-Au5pUzOLkvQWSW33eVakgMIuWWCQe89BkpUfx8UV4J1fEh1MOXSNUaqs9OT922Lqw",
  },
];

export default function GazetteFeatures() {
  return (
    <section className="mt-10">
      <p className="gz-label text-ink-soft mb-4">The Colony Gazette // دو لسانی مضامین</p>
      <div className="grid md:grid-cols-2 gap-6">
        {FEATURES.map((f) => (
          <Link key={f.href} href={f.href} className="group block border border-line hover:border-ink transition-colors">
            <div className="relative aspect-[16/9] bg-ink overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.img}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover grayscale contrast-125 group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-5 md:p-6 space-y-2">
              <p className="gz-label text-ink-soft">{f.tag}</p>
              <h2 className="font-news text-[24px] leading-[30px] md:text-[28px] md:leading-[36px] tracking-[-0.015em]">
                {f.title}
              </h2>
              <p lang="ur" dir="rtl" className="text-[15px] text-ink-soft">
                {f.ur}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

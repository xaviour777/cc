import { config } from "dotenv";
config();
import { db, closeDb } from "./index";
import crypto from "crypto";
import {
  users,
  properties,
  accommodationTypes,
  rooms,
  beds,
  ratePlans,
  siteSettings,
  categories,
  tags,
  events,
  articles,
  articleTranslations,
  socialPosts,
  agreements,
} from "./schema";
import { IMG } from "../lib/images";


function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function nextWeekday(day: number): string {
  const d = new Date();
  const diff = (day - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log("Seeding Content Colony…");

  // ---------- Admin user ----------
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@contentcolony.pk";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "colony-admin-2025";
  const existingAdmin = await db.select().from(users).limit(1);
  if (existingAdmin.length === 0) {
    await db.insert(users).values({
      name: "Colony Admin",
      email: adminEmail,
      passwordHash: hashPassword(adminPassword),
      role: "ADMIN",
    });
    console.log(`  admin: ${adminEmail} / ${adminPassword}`);
  }

  // ---------- Property ----------
  const [property] = await db
    .insert(properties)
    .values({
      name: "Content Colony — Johar Town",
      slug: "johar-town",
      city: "Lahore",
      neighborhood: "Johar Town, H Block",
      address: null,
      addressApproved: false,
      mapEmbedUrl:
        "https://www.google.com/maps?q=Johar%20Town%20H%20Block%20Lahore%20Pakistan&output=embed",
      mapDirectionsUrl:
        "https://www.google.com/maps/dir/?api=1&destination=Johar+Town+H+Block+Lahore",
    })
    .onConflictDoNothing()
    .returning();
  const propertyId = property?.id ?? (await db.select().from(properties).limit(1))[0].id;

  // ---------- Accommodation products ----------
  const typeDefs = [
    {
      key: "SHARED_BUNK" as const,
      name: "Shared Bunk Bed",
      slug: "shared-bunk",
      tagline: "Your own bunk in a room of four future friends.",
      description:
        "A private-feeling bunk with a curtain, reading light, shelf and locker, in a shared room of four. You get full access to the coworking lounge, production studio, call pod, kitchen, entertainment area and every free community meetup.",
      image: IMG.bunkRoom,
      features: [
        "Personal bunk with privacy curtain",
        "Reading light, shelf & locker",
        "Shared room of four",
        "All community spaces included",
        "Free meetups + resident workshop discounts",
      ],
      capacityLabel: "1 guest per bunk · 8 bunks in the colony",
      sortOrder: 0,
    },
    {
      key: "PRIVATE_ROOM" as const,
      name: "Private Room",
      slug: "private-room",
      tagline: "A room of your own, a colony outside the door.",
      description:
        "Your own lockable, quiet room for deep work and deep sleep — with the entire colony (coworking, studio, call pod, kitchen, lounge, entertainment area, meetups) still included.",
      image: IMG.privateRoom,
      features: [
        "Lockable private room",
        "Work corner & natural light",
        "Up to 2 occupants (admin configurable)",
        "All community spaces included",
        "Free meetups + resident workshop discounts",
      ],
      capacityLabel: "3 rooms in the colony · up to 2 occupants each",
      sortOrder: 1,
    },
  ];

  const typeIds: Record<string, number> = {};
  for (const t of typeDefs) {
    const [row] = await db
      .insert(accommodationTypes)
      .values({ ...t, propertyId })
      .onConflictDoNothing()
      .returning();
    const id =
      row?.id ??
      (
        await db
          .select()
          .from(accommodationTypes)
          .orderBy(accommodationTypes.id)
          .limit(10)
      ).find((x) => x.key === t.key)!.id;
    typeIds[t.key] = id;
  }

  // ---------- Rooms & beds ----------
  const roomCount = (await db.select().from(rooms)).length;
  if (roomCount === 0) {
    const [hive1] = await db
      .insert(rooms)
      .values({ propertyId, name: "Hive One", type: "SHARED_BUNK", maxOccupants: 4 })
      .returning();
    const [hive2] = await db
      .insert(rooms)
      .values({ propertyId, name: "Hive Two", type: "SHARED_BUNK", maxOccupants: 4 })
      .returning();
    await db.insert(rooms).values([
      { propertyId, name: "Private Room 1", type: "PRIVATE_ROOM", maxOccupants: 2 },
      { propertyId, name: "Private Room 2", type: "PRIVATE_ROOM", maxOccupants: 2 },
      { propertyId, name: "Private Room 3", type: "PRIVATE_ROOM", maxOccupants: 2 },
    ]);
    const labels = [
      { roomId: hive1.id, labels: ["H1-A", "H1-B", "H1-C", "H1-D"] },
      { roomId: hive2.id, labels: ["H2-A", "H2-B", "H2-C", "H2-D"] },
    ];
    for (const r of labels)
      for (const label of r.labels) await db.insert(beds).values({ roomId: r.roomId, label });
  }

  // ---------- Rate plans (package-first) ----------
  const planCount = (await db.select().from(ratePlans)).length;
  if (planCount === 0) {
    await db.insert(ratePlans).values([
      { accommodationTypeId: typeIds.SHARED_BUNK, name: "Nightly", unitNights: 1, pricePkr: 2000, minBookingNights: 3, sortOrder: 2 },
      { accommodationTypeId: typeIds.SHARED_BUNK, name: "Weekly bundle", unitNights: 7, pricePkr: 12000, minBookingNights: 7, sortOrder: 1 },
      { accommodationTypeId: typeIds.SHARED_BUNK, name: "Monthly bundle", unitNights: 30, pricePkr: 42000, minBookingNights: 30, sortOrder: 0 },
      { accommodationTypeId: typeIds.PRIVATE_ROOM, name: "Nightly", unitNights: 1, pricePkr: 5000, minBookingNights: 3, sortOrder: 2 },
      { accommodationTypeId: typeIds.PRIVATE_ROOM, name: "Weekly bundle", unitNights: 7, pricePkr: 32000, minBookingNights: 7, sortOrder: 1 },
      { accommodationTypeId: typeIds.PRIVATE_ROOM, name: "Monthly bundle", unitNights: 30, pricePkr: 100000, minBookingNights: 30, sortOrder: 0 },
    ]);
  }

  // ---------- Site settings ----------
  const settings: Record<string, unknown> = {
    minStayNights: 3,
    residentDiscountPct: 25,
    tagline: "Your people are here.",
    secondaryTagline: "Come as a stranger. Create as a friend.",
    introLine:
      "A creative home in Lahore for people who build, create, explore, and never stop learning.",
    contactEmail: "hello@contentcolony.pk",
    whatsappNumber: "", // set from admin → settings once the owner confirms
    instagram: "",
    tiktok: "",
    youtube: "",
    facebook: "",
    linkedin: "",
    legalNotice:
      "Guest-house registration, Hotel Eye reporting and Punjab temporary-resident compliance are handled through our manual checklist until official integrations are authorised.",
  };
  for (const [key, value] of Object.entries(settings)) {
    await db.insert(siteSettings).values({ key, value: value as never }).onConflictDoNothing();
  }

  // ---------- Categories ----------
  const cats = [
    ["creator-stories", "Creator Stories", "کریئٹر کہانیاں"],
    ["ai-filmmaking", "AI Filmmaking", "اے آئی فلم سازی"],
    ["youtube-growth", "YouTube Growth", "یوٹیوب"],
    ["facebook-instagram", "Facebook & Instagram", "فیس بک اور انسٹاگرام"],
    ["tiktok", "TikTok", "ٹک ٹاک"],
    ["digital-nomad-life", "Digital Nomad Life", "ڈیجیٹل زندگی"],
    ["lahore-community", "Lahore Community", "لاہور کمیونٹی"],
    ["events-workshops", "Events & Workshops", "ورکشاپس"],
    ["case-studies", "Case Studies", "کیس سٹڈیز"],
    ["colony-updates", "Content Colony Updates", "کالونی اپڈیٹس"],
  ] as const;
  const catIds: Record<string, number> = {};
  for (const [slug, nameEn, nameUr] of cats) {
    const [row] = await db
      .insert(categories)
      .values({ slug, nameEn, nameUr })
      .onConflictDoNothing()
      .returning();
    const all = await db.select().from(categories);
    catIds[slug] = row?.id ?? all.find((c) => c.slug === slug)!.id;
  }

  // ---------- Tags ----------
  const tagDefs = ["community", "co-living", "creator-economy", "ai-film", "youtube", "lahore"];
  for (const t of tagDefs)
    await db.insert(tags).values({ name: t, slug: t }).onConflictDoNothing();

  // ---------- Events ----------
  const eventCount = (await db.select().from(events)).length;
  if (eventCount === 0) {
    await db.insert(events).values([
      {
        slug: "youtube-automation-abrar-nadir",
        title: "YouTube Automation with Abrar Nadir",
        kind: "WORKSHOP",
        category: "YouTube Automation",
        hostName: "Abrar Nadir",
        hostRole: "YouTube strategist & automation mentor",
        hostImage: IMG.director,
        image: IMG.broadcast,
        excerpt:
          "Build a YouTube channel that runs like a system: niches, viral research, AI scripts, production pipelines and monetisation.",
        description:
          "A hands-on workshop with Abrar Nadir covering the full YouTube automation workflow — from picking a niche you can win in, to repeatable content systems, AI-assisted scripting, production, publishing and monetisation. Dates, exact duration and seats are confirmed by the Colony team before each cohort opens.",
        outcomes: [
          "Find YouTube niches with real room to grow",
          "Research viral ideas with a repeatable method",
          "Build content workflows you can hand to a team",
          "Write scripts with AI without sounding like AI",
          "Set up production + publishing + monetisation strategy",
        ],
        schedule: [{ day: "Day plan", title: "Full-day intensive", detail: "Sessions, live research sprints and a channel strategy clinic." }],
        startDate: null,
        endDate: null,
        timeLabel: null,
        durationLabel: "1-day intensive",
        venue: "Content Colony, Johar Town, Lahore",
        capacity: 30,
        ticketPkr: 8000,
        residentDiscountPct: null,
        status: "PUBLISHED",
        featured: true,
        complianceNote: "Dates are announced once the host confirms each cohort.",
      },
      {
        slug: "ai-filmmaking-drama-method",
        title: "AI Filmmaking: The Drama Method",
        kind: "WORKSHOP",
        category: "AI Filmmaking",
        hostName: "Zahid Iqbal",
        hostRole: "Creator of the Drama Method",
        hostImage: IMG.studioSet,
        image: IMG.studioCrew,
        excerpt:
          "A 3-day intensive. Learn to create cinematic stories that people actually want to watch.",
        description:
          "Learn to create cinematic stories that people actually want to watch. In three days at the Colony you will go from idea to a finished AI drama — story, characters, visuals, sound, editing and publishing — inside Zahid Iqbal's Drama Method. The next cohort is planned for the upcoming weekend relative to launch; exact dates are confirmed by the team before publishing.",
        outcomes: [
          "Storytelling & emotional hooks",
          "AI character development",
          "Visual consistency across scenes",
          "Cinematic image generation",
          "AI video generation & scene continuity",
          "Sound design, voice & music",
          "Editing & pacing",
          "Publishing & distribution",
          "Ship a finished AI drama",
        ],
        schedule: [
          { day: "Day 1", title: "Story & characters", detail: "Hooks, structure, AI character development, visual consistency." },
          { day: "Day 2", title: "Cinematic generation", detail: "Image generation, AI video, scene continuity, sound design, voice & music." },
          { day: "Day 3", title: "Edit & ship", detail: "Editing, pacing, publishing, distribution — finish your AI drama." },
        ],
        startDate: null,
        endDate: null,
        timeLabel: null,
        durationLabel: "3 days",
        venue: "Content Colony, Johar Town, Lahore",
        capacity: 20,
        ticketPkr: 15000,
        residentDiscountPct: null,
        status: "PUBLISHED",
        featured: true,
        complianceNote: "Exact weekend dates are confirmed by the admin team before each cohort opens.",
      },
      {
        slug: "friday-movie-night",
        title: "Friday Movie Night",
        kind: "COMMUNITY",
        category: "Community",
        hostName: "The Colony",
        hostRole: "Community ritual",
        hostImage: null,
        image: IMG.movieNight,
        excerpt: "Projector on, chai out, arguments about the ending guaranteed.",
        description: "Our weekly wind-down. Bring a blanket and your strongest movie opinions.",
        outcomes: [],
        schedule: [],
        startDate: nextWeekday(5),
        endDate: null,
        timeLabel: "9:00 PM",
        durationLabel: "One evening",
        venue: "Community lounge",
        capacity: 40,
        ticketPkr: 0,
        residentDiscountPct: null,
        status: "PUBLISHED",
        featured: false,
      },
      {
        slug: "console-tournament-night",
        title: "Console Tournament Night",
        kind: "COMMUNITY",
        category: "Gaming",
        hostName: "The Colony",
        hostRole: "Community ritual",
        hostImage: null,
        image: IMG.gamingCouch,
        excerpt: "GTA V free-roam chaos, FIFA brackets, and the loser makes chai.",
        description:
          "Multiplayer console and PC night: GTA V sessions on our licensed copy, FIFA brackets and party games. GTA VI joins the line-up if and when it is legitimately released, licensed and supported on our platform.",
        outcomes: [],
        schedule: [],
        startDate: nextWeekday(6),
        endDate: null,
        timeLabel: "8:00 PM",
        durationLabel: "One evening",
        venue: "Entertainment area",
        capacity: 24,
        ticketPkr: 0,
        residentDiscountPct: null,
        status: "PUBLISHED",
        featured: false,
      },
    ]);
  }

  // ---------- Articles ----------
  const articleCount = (await db.select().from(articles)).length;
  if (articleCount === 0) {
    const [a1] = await db
      .insert(articles)
      .values({
        categoryId: catIds["colony-updates"],
        coverImage: IMG.welcome,
        authorName: "The Colony Team",
        authorRole: "Founding residents",
        status: "PUBLISHED",
        publishedAt: new Date(),
        featured: true,
        seoTitle: "Why we built a colony instead of a hotel",
        seoDescription: "Content Colony is a creative home in Lahore — not a hotel, not a hostel, a colony.",
        readingMinutes: 4,
      })
      .returning();
    await db.insert(articleTranslations).values([
      {
        articleId: a1.id,
        lang: "en",
        slug: "why-we-built-a-colony",
        title: "Why we built a colony instead of a hotel",
        excerpt: "Hotels give you a key. We wanted to give people a table to build at, and people to build with.",
        content: [
          "We kept asking a simple question: why does staying in a city for a month of work feel so lonely?",
          "",
          "Hotels give you a key and a checkout time. Hostels give you a bunk and a curfew of small talk. Neither gives you people who care about what you're making.",
          "",
          "## A home that behaves like a community",
          "",
          "Content Colony is built around a feeling, not a floor plan. Yes, there are eight bunks, three private rooms, a coworking lounge and a studio. But the real product is the dinner table on Fridays, the 2 AM edit session with someone you met that morning, the movie night where the projector is loud and the commentary is louder.",
          "",
          "> Come as a stranger. Create as a friend.",
          "",
          "## What we include — and what we don't pretend to",
          "",
          "Every resident gets the coworking lounge, high-speed Wi-Fi, the shared studio (bookable), the call pod, the kitchen and every free meetup. Paid workshops are optional, and residents always get a discount — because learning together is the point.",
          "",
          "We are not a hotel. We check IDs because a community is a responsibility. We write agreements because trust deserves paper. And we keep prices honest because creators have enough invoices already.",
          "",
          "If that sounds like your kind of place — your people are here.",
        ].join("\n"),
      },
      {
        articleId: a1.id,
        lang: "ur",
        slug: "why-we-built-a-colony",
        title: "ہم نے ہوٹل کی جگہ کالونی کیوں بنائی",
        excerpt: "ہوٹل آپ کو چابھی دیتے ہیں۔ ہم لوگوں کو ایک ایسی میز دینا چاہتے تھے جہاں ساتھ بنایا جائے، اور وہ لوگ جن کے ساتھ بنایا جائے۔",
        content: [
          "ہم بار بار ایک آسان سوال پوچھتے رہے: کسی شہر میں کام کے لیے ایک ماہ قیام اتنا تنہا کیوں محسوس ہوتا ہے؟",
          "",
          "ہوٹل آپ کو چابھی اور چیک آؤٹ کا وقت دیتے ہیں۔ ہاسٹل ایک پلنگ اور ادھیڑ بات چیت۔ دونوں میں سے کوئی بھی آپ کو وہ لوگ نہیں دیتا جنہیں آپ کی تخلیق کی پرواہ ہو۔",
          "",
          "## ایک ایسا گھر جو کمیونٹی کی طرح چلے",
          "",
          "کانٹینٹ کالونی ایک احساس کے گرد بنائی گئی ہے، نقشے کے گرد نہیں۔ ہاں، یہاں آٹھ بنک ہیں، تین نجی کمرے ہیں، کنو ورکنگ لاؤنج اور سٹوڈیو بھی۔ لیکن اصل چیز جمعے کی دعوت ہے، صبح ملے کسی دوست کے ساتھ رات دو بجے کی ایڈیٹنگ، اور مووی نائیٹ جہاں پروجیکٹر اور تبصرے دونوں بلند ہوتے ہیں۔",
          "",
          "> اجنبی بن کر آؤ۔ دوست بن کر تخلیق کرو۔",
          "",
          "اگر یہ آپ کے دل کی جگہ لگتی ہے — آپ کے لوگ یہاں موجود ہیں۔",
        ].join("\n"),
      },
    ]);

    const [a2] = await db
      .insert(articles)
      .values({
        categoryId: catIds["ai-filmmaking"],
        coverImage: IMG.clapper,
        authorName: "The Colony Team",
        authorRole: "Workshop notes",
        status: "PUBLISHED",
        publishedAt: new Date(),
        featured: false,
        seoTitle: "The beginner's workflow for your first AI drama",
        seoDescription: "A practical intro to AI filmmaking, from hook to final cut — and the 3-day Drama Method workshop at Content Colony.",
        readingMinutes: 5,
        relatedEventSlug: "ai-filmmaking-drama-method",
      })
      .returning();
    await db.insert(articleTranslations).values({
      articleId: a2.id,
      lang: "en",
      slug: "first-ai-drama-workflow",
      title: "The beginner's workflow for your first AI drama",
      excerpt: "Hooks, characters, continuity, sound — the order matters more than the tools.",
      content: [
        "Most first AI films fail before generation even starts: nobody wrote an ending anyone cares about.",
        "",
        "## Start with the hook, write backwards",
        "",
        "Open on the moment of maximum tension, then write backwards until the audience forgives you. Emotional hooks beat visual spectacle every single time.",
        "",
        "## Characters first, models second",
        "",
        "Lock character sheets before you touch a video model — face, wardrobe, lighting grammar. Consistency is a discipline, not a feature.",
        "",
        "- Write the scene list on paper first",
        "- Generate stills before motion",
        "- Cut on sound, not on spectacle",
        "",
        "## Want the full method?",
        "",
        "Zahid Iqbal's 3-day Drama Method intensive at the Colony takes you from idea to a finished AI drama. Seats are limited and residents get 25% off.",
      ].join("\n"),
    });

    const [a3] = await db
      .insert(articles)
      .values({
        categoryId: catIds["lahore-community"],
        coverImage: IMG.lahoreJuice,
        authorName: "The Colony Team",
        authorRole: null,
        status: "PUBLISHED",
        publishedAt: new Date(),
        featured: false,
        seoTitle: "لاہور کی کریئیٹر کمیونٹی: ایک تعارف",
        seoDescription: "جوہر ٹاؤن میں کریئیٹرز کا گھر — کمیونٹی، سیکھنا اور لاہور کی زندگی۔",
        readingMinutes: 3,
      })
      .returning();
    await db.insert(articleTranslations).values({
      articleId: a3.id,
      lang: "ur",
      slug: "lahore-creator-community-intro",
      title: "لاہور کی کریئیٹر کمیونٹی: ایک تعارف",
      excerpt: "جوہر ٹاؤن میں ایک ایسا گھر جہاں کریئیٹر رہتے، سیکھتے اور ساتھ بناتے ہیں۔",
      content: [
        "لاہور ہمیشہ سے کہانیوں کا شہر رہا ہے — بازاروں کی اونچی آوازیں، چائے کی دیرپا محفلیں، اور وہ لوگ جو کچھ نا کچھ بناتے رہتے ہیں۔",
        "",
        "کانٹینٹ کالونی اسی روایت کا نیا باب ہے۔ جوہر ٹاؤن کے ایچ بلاک میں ایک چھوٹا سا گھر، جہاں آٹھ بنک بیڈ، تین نجی کمرے، ایک سٹوڈیو اور ایک ایسی میز ہے جس پر ہر شام نئے خیال کھلے پڑتے ہیں۔",
        "",
        "## یہاں کیا ملتا ہے؟",
        "",
        "- تیز رفتار وائی فائی اور کنو ورکنگ لاؤنج",
        "- شیئرڈ پروڈکشن سٹوڈیو اور کال پوڈ",
        "- مفت کمیونٹی میٹ اپس اور ہفتہ وار ڈنر",
        "- ورکشاپس پر رہائشی رعایت",
        "",
        "چاہے آپ یوٹیوبر ہیں، فلم ساز، یا ابھی صرف ایک خیال رکھتے ہیں — آپ کے لوگ یہاں موجود ہیں۔",
      ].join("\n"),
    });
  }

  // ---------- Social posts (admin adds real permalinks at launch) ----------
  const postCount = (await db.select().from(socialPosts)).length;
  if (postCount === 0) {
    await db.insert(socialPosts).values([
      { platform: "INSTAGRAM", url: "", thumbnail: IMG.vlogWoman, creatorName: "Mahnoor", creatorHandle: "@mahnoor.makes", caption: "Shooting episode 4 in the studio — resident rate hits different.", category: "Studio", featured: true, sortOrder: 0 },
      { platform: "TIKTOK", url: "", thumbnail: IMG.gamingFaces, creatorName: "Danish", creatorHandle: "@danish.exe", caption: "Tournament night, round 3. The chai stakes were high.", category: "Gaming", featured: false, sortOrder: 1 },
      { platform: "YOUTUBE", url: "", thumbnail: IMG.studioCrew, creatorName: "Colony Studio", creatorHandle: "@contentcolony", caption: "Behind the scenes of the Drama Method cohort's first short.", category: "Filmmaking", featured: false, sortOrder: 2 },
      { platform: "INSTAGRAM", url: "", thumbnail: IMG.dinnerWide, creatorName: "Areeba", creatorHandle: "@areeba.edits", caption: "Friday dinner > everything. Weekend agenda: edit, eat, repeat.", category: "Community", featured: false, sortOrder: 3 },
      { platform: "FACEBOOK", url: "", thumbnail: IMG.coworkAlt, creatorName: "Colony HQ", creatorHandle: "Content Colony", caption: "Coworking lounge at 11 AM — cameras, code and three kinds of chai.", category: "Work", featured: false, sortOrder: 4 },
      { platform: "YOUTUBE", url: "", thumbnail: IMG.movieNight, creatorName: "Hamza", creatorHandle: "@hamza.streams", caption: "Movie night recap — the twist nobody saw coming.", category: "Community", featured: false, sortOrder: 5 },
    ]);
  }

  // ---------- Agreement template ----------
  const agreementCount = (await db.select().from(agreements)).length;
  if (agreementCount === 0) {
    await db.insert(agreements).values({
      version: 1,
      title: "Content Colony Resident Stay Agreement",
      body: [
        "RESIDENT STAY AGREEMENT — VERSION {{version}}",
        "",
        "This agreement is made between Content Colony (Johar Town, Lahore) and {{guest_name}} (the Resident) for booking reference {{reference}}.",
        "",
        "Stay: {{check_in}} to {{check_out}} ({{nights}} nights). Accommodation: {{accommodation}}. Total agreed price: {{total}}.",
        "",
        "1. COMMUNITY. The Colony is a shared creative home. Residents respect quiet hours (11 PM – 8 AM), shared spaces, equipment and each other.",
        "2. IDENTITY. The Resident provides a valid CNIC / NICOP / passport copy for legal registration, stored securely and visible only to authorised administration.",
        "3. PAYMENT. The total shown at booking is payable by the selected method. Longer-stay packages apply exactly as displayed.",
        "4. STUDIO & EQUIPMENT. The studio and call pod are booked by slot. Damage to shared equipment is chargeable.",
        "5. CANCELLATION. Cancellations before check-in are reviewed against our refund policy; confirmed payments are refunded per admin review.",
        "6. COMPLIANCE. Guest details are processed for Punjab temporary-resident / Hotel Eye reporting through our manual compliance workflow until official integrations are authorised.",
        "",
        "Signed digitally by {{guest_name}} at {{signed_at}}.",
      ].join("\n"),
      active: true,
    });
  }

  console.log("Seed complete.");
  await closeDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

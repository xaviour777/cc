import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ---------- Enums ----------
export const roleEnum = pgEnum("role", ["ADMIN", "USER"]);
export const accommodationKeyEnum = pgEnum("accommodation_key", [
  "SHARED_BUNK",
  "PRIVATE_ROOM",
]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "CHECKED_IN",
  "COMPLETED",
  "CANCELLED",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "CONFIRMED",
  "FAILED",
  "REFUNDED",
]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "BANK_TRANSFER",
  "RAAST",
  "CARD_LINK",
  "CASH_ON_ARRIVAL",
]);
export const kycStatusEnum = pgEnum("kyc_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);
export const eventStatusEnum = pgEnum("event_status", [
  "DRAFT",
  "PUBLISHED",
  "FULL",
  "COMPLETED",
  "CANCELLED",
]);
export const eventKindEnum = pgEnum("event_kind", [
  "WORKSHOP",
  "MEETUP",
  "COMMUNITY",
]);
export const registrationStatusEnum = pgEnum("registration_status", [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "CANCELLED",
]);
export const proposalStatusEnum = pgEnum("proposal_status", [
  "NEW",
  "REVIEWED",
  "APPROVED",
  "REJECTED",
]);
export const articleStatusEnum = pgEnum("article_status", [
  "DRAFT",
  "PUBLISHED",
  "SCHEDULED",
]);
export const studioResourceEnum = pgEnum("studio_resource", [
  "STUDIO",
  "CALL_POD",
]);
export const syncStatusEnum = pgEnum("sync_status", [
  "PENDING",
  "SENT",
  "FAILED",
  "SKIPPED",
]);
export const socialPlatformEnum = pgEnum("social_platform", [
  "INSTAGRAM",
  "TIKTOK",
  "YOUTUBE",
  "FACEBOOK",
  "LINKEDIN",
]);

// ---------- Identity & access ----------
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull().default("USER"),
    mfaSecret: text("mfa_secret"),
    mfaEnabled: boolean("mfa_enabled").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("users_email_idx").on(t.email)]
);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // opaque token
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------- Property & inventory ----------
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  city: text("city").notNull().default("Lahore"),
  neighborhood: text("neighborhood").notNull().default("Johar Town, H Block"),
  address: text("address"), // full address, only published when approved
  addressApproved: boolean("address_approved").notNull().default(false),
  mapEmbedUrl: text("map_embed_url"),
  mapDirectionsUrl: text("map_directions_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const accommodationTypes = pgTable("accommodation_types", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  key: accommodationKeyEnum("key").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  features: jsonb("features").$type<string[]>().notNull().default([]),
  capacityLabel: text("capacity_label").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: accommodationKeyEnum("type").notNull(),
  maxOccupants: integer("max_occupants").notNull().default(1),
  active: boolean("active").notNull().default(true),
});

export const beds = pgTable("beds", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  active: boolean("active").notNull().default(true),
});

export const ratePlans = pgTable("rate_plans", {
  id: serial("id").primaryKey(),
  accommodationTypeId: integer("accommodation_type_id")
    .notNull()
    .references(() => accommodationTypes.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // Nightly / Weekly package / Monthly package
  unitNights: integer("unit_nights").notNull(), // 1, 7, 30
  pricePkr: integer("price_pkr").notNull(), // price per unit
  minBookingNights: integer("min_booking_nights").notNull().default(3),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

// ---------- Bookings ----------
export const bookings = pgTable(
  "bookings",
  {
    id: serial("id").primaryKey(),
    reference: text("reference").notNull().unique(),
    propertyId: integer("property_id")
      .notNull()
      .references(() => properties.id),
    accommodationTypeId: integer("accommodation_type_id")
      .notNull()
      .references(() => accommodationTypes.id),
    roomId: integer("room_id").references(() => rooms.id),
    bedId: integer("bed_id").references(() => beds.id),
    guestName: text("guest_name").notNull(),
    guestEmail: text("guest_email").notNull(),
    guestPhone: text("guest_phone").notNull(),
    guestsCount: integer("guests_count").notNull().default(1),
    checkIn: date("check_in", { mode: "string" }).notNull(), // inclusive
    checkOut: date("check_out", { mode: "string" }).notNull(), // exclusive
    nights: integer("nights").notNull(),
    priceBreakdown: jsonb("price_breakdown")
      .$type<{ label: string; qty: number; unitPricePkr: number; subtotalPkr: number }[]>()
      .notNull()
      .default([]),
    totalPkr: integer("total_pkr").notNull(),
    currency: text("currency").notNull().default("PKR"),
    status: bookingStatusEnum("status").notNull().default("PENDING_PAYMENT"),
    minStayOverride: boolean("min_stay_override").notNull().default(false),
    minStayOverrideReason: text("min_stay_override_reason"),
    source: text("source").default("website"),
    utm: jsonb("utm").$type<Record<string, string>>(),
    notes: text("notes"),
    complianceHotelEye: boolean("compliance_hotel_eye").notNull().default(false),
    complianceTempResident: boolean("compliance_temp_resident").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("bookings_bed_dates_idx").on(t.bedId, t.checkIn, t.checkOut),
    index("bookings_room_dates_idx").on(t.roomId, t.checkIn, t.checkOut),
    index("bookings_status_idx").on(t.status),
    index("bookings_email_idx").on(t.guestEmail),
  ]
);

export const bookingGuests = pgTable("booking_guests", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  relationship: text("relationship"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const inventoryBlocks = pgTable(
  "inventory_blocks",
  {
    id: serial("id").primaryKey(),
    roomId: integer("room_id").references(() => rooms.id, { onDelete: "cascade" }),
    bedId: integer("bed_id").references(() => beds.id, { onDelete: "cascade" }),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    reason: text("reason").notNull(),
    createdBy: integer("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("blocks_dates_idx").on(t.startDate, t.endDate)]
);

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id, {
    onDelete: "set null",
  }),
  eventRegistrationId: integer("event_registration_id"),
  kind: text("kind").notNull().default("STAY"), // STAY | TICKET | DEPOSIT
  method: paymentMethodEnum("method").notNull(),
  amountPkr: integer("amount_pkr").notNull(),
  status: paymentStatusEnum("status").notNull().default("PENDING"),
  payerReference: text("payer_reference"),
  note: text("note"),
  confirmedBy: integer("confirmed_by"),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const refunds = pgTable("refunds", {
  id: serial("id").primaryKey(),
  paymentId: integer("payment_id")
    .notNull()
    .references(() => payments.id, { onDelete: "cascade" }),
  amountPkr: integer("amount_pkr").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("REQUESTED"), // REQUESTED | PROCESSED
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const deposits = pgTable("deposits", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  amountPkr: integer("amount_pkr").notNull(),
  status: text("status").notNull().default("HELD"), // HELD | RELEASED | FORFEITED
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------- KYC & agreements ----------
export const kycDocuments = pgTable("kyc_documents", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  docType: text("doc_type").notNull(), // CNIC | NICOP | PASSPORT
  idNumberLast4: text("id_number_last4"),
  filePath: text("file_path").notNull(),
  fileName: text("file_name").notNull(),
  mime: text("mime").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  status: kycStatusEnum("status").notNull().default("PENDING"),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewNote: text("review_note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const agreements = pgTable("agreements", {
  id: serial("id").primaryKey(),
  version: integer("version").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(), // template with {{placeholders}}
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const signedAgreements = pgTable("signed_agreements", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  agreementId: integer("agreement_id")
    .notNull()
    .references(() => agreements.id),
  agreementVersion: integer("agreement_version").notNull(),
  signerName: text("signer_name").notNull(),
  consent: boolean("consent").notNull().default(false),
  signedAt: timestamp("signed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  ipHash: text("ip_hash"),
  documentHtml: text("document_html").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const checkInOuts = pgTable("check_in_outs", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // CHECK_IN | CHECK_OUT
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  notes: text("notes"),
  byUserId: integer("by_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------- Events ----------
export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    kind: eventKindEnum("kind").notNull().default("WORKSHOP"),
    category: text("category").notNull(),
    hostName: text("host_name"),
    hostRole: text("host_role"),
    hostImage: text("host_image"),
    image: text("image"),
    excerpt: text("excerpt").notNull().default(""),
    description: text("description").notNull().default(""),
    outcomes: jsonb("outcomes").$type<string[]>().notNull().default([]),
    schedule: jsonb("schedule")
      .$type<{ day: string; title: string; detail: string }[]>()
      .notNull()
      .default([]),
    startDate: date("start_date", { mode: "string" }),
    endDate: date("end_date", { mode: "string" }),
    timeLabel: text("time_label"),
    durationLabel: text("duration_label"),
    venue: text("venue").notNull().default("Content Colony, Johar Town"),
    capacity: integer("capacity").notNull().default(30),
    ticketPkr: integer("ticket_pkr").notNull().default(0), // 0 = free
    residentDiscountPct: integer("resident_discount_pct"), // null = site default
    status: eventStatusEnum("status").notNull().default("DRAFT"),
    featured: boolean("featured").notNull().default(false),
    complianceNote: text("compliance_note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("events_status_idx").on(t.status), index("events_start_idx").on(t.startDate)]
);

export const eventRegistrations = pgTable(
  "event_registrations",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    isResident: boolean("is_resident").notNull().default(false),
    bookingReference: text("booking_reference"),
    discountPct: integer("discount_pct").notNull().default(0),
    pricePkr: integer("price_pkr").notNull().default(0),
    amountDuePkr: integer("amount_due_pkr").notNull().default(0),
    status: registrationStatusEnum("status").notNull().default("PENDING_PAYMENT"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("reg_event_idx").on(t.eventId), index("reg_email_idx").on(t.email)]
);

export const eventProposals = pgTable("event_proposals", {
  id: serial("id").primaryKey(),
  organizerName: text("organizer_name").notNull(),
  email: text("email").notNull(),
  whatsapp: text("whatsapp").notNull(),
  brand: text("brand"),
  socialUrl: text("social_url"),
  title: text("title").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  preferredDate: date("preferred_date", { mode: "string" }),
  expectedAttendees: integer("expected_attendees"),
  ticketSuggestion: text("ticket_suggestion"),
  requirements: text("requirements"),
  speakerBio: text("speaker_bio"),
  coverImage: text("cover_image"),
  status: proposalStatusEnum("status").notNull().default("NEW"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const studioReservations = pgTable("studio_reservations", {
  id: serial("id").primaryKey(),
  resource: studioResourceEnum("resource").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  slot: text("slot").notNull(),
  bookingId: integer("booking_id").references(() => bookings.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  purpose: text("purpose"),
  status: text("status").notNull().default("CONFIRMED"), // CONFIRMED | CANCELLED
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------- CMS ----------
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameUr: text("name_ur"),
  description: text("description"),
});

export const articles = pgTable(
  "articles",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    coverImage: text("cover_image"),
    authorName: text("author_name").notNull().default("Content Colony"),
    authorRole: text("author_role"),
    status: articleStatusEnum("status").notNull().default("DRAFT"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    featured: boolean("featured").notNull().default(false),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    ogImage: text("og_image"),
    readingMinutes: integer("reading_minutes").notNull().default(4),
    relatedEventSlug: text("related_event_slug"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("articles_status_idx").on(t.status)]
);

export const articleTranslations = pgTable(
  "article_translations",
  {
    id: serial("id").primaryKey(),
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    lang: text("lang").notNull(), // en | ur | roman-ur
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    content: text("content").notNull().default(""),
  },
  (t) => [uniqueIndex("translation_slug_lang").on(t.slug, t.lang)]
);

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const articleTags = pgTable("article_tags", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id")
    .notNull()
    .references(() => articles.id, { onDelete: "cascade" }),
  tagId: integer("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
});

// ---------- Social feed ----------
export const socialPosts = pgTable("social_posts", {
  id: serial("id").primaryKey(),
  platform: socialPlatformEnum("platform").notNull(),
  url: text("url").notNull().default(""),
  thumbnail: text("thumbnail").notNull(),
  creatorName: text("creator_name").notNull(),
  creatorHandle: text("creator_handle"),
  caption: text("caption").notNull().default(""),
  category: text("category"),
  featured: boolean("featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------- Settings / integrations ----------
export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const ghlSyncs = pgTable("ghl_syncs", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(), // booking | registration | proposal | contact
  entityId: integer("entity_id").notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  status: syncStatusEnum("status").notNull().default("PENDING"),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  channel: text("channel").notNull(), // EMAIL | WHATSAPP
  toRef: text("to_ref").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("QUEUED"), // QUEUED | SENT | SKIPPED
  entityType: text("entity_type"),
  entityId: integer("entity_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

// ---------- Types ----------
export type Booking = typeof bookings.$inferSelect;
export type RatePlan = typeof ratePlans.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type ArticleTranslation = typeof articleTranslations.$inferSelect;
export type SocialPost = typeof socialPosts.$inferSelect;
export type AccommodationType = typeof accommodationTypes.$inferSelect;
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;

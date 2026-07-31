import { sql } from "drizzle-orm";
import {
  bigserial,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const announcementKind = pgEnum("announcement_kind", ["need", "offer"]);
export const announcementStatus = pgEnum("announcement_status", [
  "pending",
  "active",
  "matched",
  "closed",
  "rejected",
]);
export const outboxStatus = pgEnum("outbox_status", [
  "pending",
  "sending",
  "sent",
  "failed",
]);
export const responseStatus = pgEnum("response_status", [
  "pending_verification",
  "verified",
]);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    firstName: varchar("first_name", { length: 80 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("profiles_email_lower_unique").on(sql`lower(${table.email})`),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
    index("sessions_profile_expiry_idx").on(table.profileId, table.expiresAt),
  ],
);

export const magicLinks = pgTable(
  "magic_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("magic_links_token_hash_unique").on(table.tokenHash),
    index("magic_links_email_created_idx").on(table.email, table.createdAt),
  ],
);

export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    kind: announcementKind("kind").notNull(),
    category: varchar("category", { length: 40 }).notNull(),
    title: varchar("title", { length: 100 }).notNull(),
    description: varchar("description", { length: 1_000 }).notNull(),
    firstName: varchar("first_name", { length: 80 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    commune: varchar("commune", { length: 120 }).notNull(),
    availability: varchar("availability", { length: 160 }).notNull(),
    status: announcementStatus("status").default("active").notNull(),
    moderationNote: text("moderation_note"),
    managementTokenHash: varchar("management_token_hash", {
      length: 64,
    }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true })
      .default(sql`now() + interval '90 days'`)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("announcements_management_token_unique").on(
      table.managementTokenHash,
    ),
    index("announcements_feed_idx").on(table.status, table.createdAt),
    index("announcements_kind_category_feed_idx").on(
      table.kind,
      table.category,
      table.status,
      table.createdAt,
    ),
    index("announcements_owner_idx").on(table.profileId, table.createdAt),
    check(
      "announcements_category_check",
      sql`${table.category} in ('Transport', 'Matériel', 'Nettoyage', 'Travaux', 'Hébergement', 'Animaux', 'Démarches', 'Autre')`,
    ),
  ],
);

export const responses = pgTable(
  "responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    announcementId: uuid("announcement_id")
      .notNull()
      .references(() => announcements.id, { onDelete: "cascade" }),
    firstName: varchar("first_name", { length: 80 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    message: varchar("message", { length: 1_200 }).notNull(),
    status: responseStatus("status").default("pending_verification").notNull(),
    verificationTokenHash: varchar("verification_token_hash", {
      length: 64,
    }).notNull(),
    verificationExpiresAt: timestamp("verification_expires_at", {
      withTimezone: true,
    }).notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("responses_announcement_created_idx").on(
      table.announcementId,
      table.status,
      table.createdAt,
    ),
    uniqueIndex("responses_verification_token_unique").on(
      table.verificationTokenHash,
    ),
  ],
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    announcementId: uuid("announcement_id")
      .notNull()
      .references(() => announcements.id, { onDelete: "cascade" }),
    reason: varchar("reason", { length: 40 }).notNull(),
    details: varchar("details", { length: 600 }),
    reporterKeyHash: varchar("reporter_key_hash", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("reports_announcement_created_idx").on(
      table.announcementId,
      table.createdAt,
    ),
    uniqueIndex("reports_announcement_reporter_unique").on(
      table.announcementId,
      table.reporterKeyHash,
    ),
  ],
);

export const emailOutbox = pgTable(
  "email_outbox",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: varchar("kind", { length: 40 }).notNull(),
    toEmail: varchar("to_email", { length: 320 }).notNull(),
    subject: varchar("subject", { length: 180 }).notNull(),
    textBody: text("text_body").notNull(),
    htmlBody: text("html_body").notNull(),
    status: outboxStatus("status").default("pending").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastError: varchar("last_error", { length: 800 }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("email_outbox_delivery_idx").on(
      table.status,
      table.nextAttemptAt,
      table.createdAt,
    ),
  ],
);

export const rateLimits = pgTable(
  "rate_limits",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    keyHash: varchar("key_hash", { length: 64 }).notNull(),
    action: varchar("action", { length: 40 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("rate_limits_lookup_idx").on(
      table.keyHash,
      table.action,
      table.createdAt,
    ),
  ],
);

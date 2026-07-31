import {
  and,
  count,
  desc,
  eq,
  gt,
  ilike,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { getDb } from "@/db";
import { announcements, responses } from "@/db/schema";
import type { Announcement, AnnouncementKind } from "@/lib/announcements";

function toPublicAnnouncement(
  row: typeof announcements.$inferSelect,
): Announcement {
  return {
    id: row.id,
    kind: row.kind,
    category: row.category,
    title: row.title,
    description: row.description,
    firstName: row.firstName,
    commune: row.commune,
    availability: row.availability,
    status:
      row.status === "matched" || row.status === "closed"
        ? row.status
        : "active",
    createdAt: row.createdAt.getTime(),
  };
}

export async function listPublicAnnouncements(options: {
  kind?: AnnouncementKind;
  category?: string;
  query?: string;
  limit?: number;
} = {}) {
  const db = getDb();
  const conditions: SQL[] = [
    eq(announcements.status, "active"),
    gt(announcements.expiresAt, new Date()),
  ];
  if (options.kind) conditions.push(eq(announcements.kind, options.kind));
  if (options.category && options.category !== "Toutes") {
    conditions.push(eq(announcements.category, options.category));
  }
  const normalizedQuery = options.query?.trim();
  if (normalizedQuery) {
    const term = `%${normalizedQuery.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
    const searchCondition = or(
      ilike(announcements.title, term),
      ilike(announcements.description, term),
      ilike(announcements.commune, term),
    );

    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }
  const where = and(...conditions);
  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(announcements)
      .where(where)
      .orderBy(desc(announcements.createdAt))
      .limit(Math.min(options.limit ?? 50, 100)),
    db.select({ value: count() }).from(announcements).where(where),
  ]);
  return {
    announcements: rows.map(toPublicAnnouncement),
    total: totalRows[0]?.value ?? 0,
  };
}

export async function announcementForManagement(tokenHash: string) {
  const db = getDb();
  const [announcement] = await db
    .select()
    .from(announcements)
    .where(eq(announcements.managementTokenHash, tokenHash))
    .limit(1);
  if (!announcement) return null;
  const replies = await db
    .select()
    .from(responses)
    .where(
      and(
        eq(responses.announcementId, announcement.id),
        eq(responses.status, "verified"),
      ),
    )
    .orderBy(desc(responses.createdAt));
  return { announcement, responses: replies };
}

export async function dashboardForProfile(profile: {
  id: string;
  email: string;
}) {
  const db = getDb();
  const ownedAnnouncements = await db
    .select()
    .from(announcements)
    .where(
      or(
        eq(announcements.profileId, profile.id),
        sql`lower(${announcements.email}) = ${profile.email.toLowerCase()}`,
      ),
    )
    .orderBy(desc(announcements.createdAt));

  if (ownedAnnouncements.length === 0) {
    return { announcements: [], responses: [] };
  }

  const ids = ownedAnnouncements.map((item) => item.id);
  const ownedResponses = await db
    .select()
    .from(responses)
    .where(
      and(
        sql`${responses.announcementId} = any(${ids}::uuid[])`,
        eq(responses.status, "verified"),
      ),
    )
    .orderBy(desc(responses.createdAt));

  return { announcements: ownedAnnouncements, responses: ownedResponses };
}

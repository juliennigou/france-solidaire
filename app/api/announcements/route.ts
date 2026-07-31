import { NextResponse } from "next/server";
import {
  categories,
  seedAnnouncements,
  type Announcement,
  type AnnouncementKind,
} from "@/lib/announcements";

export const dynamic = "force-dynamic";

async function ensureDatabase() {
  const { env } = await import("cloudflare:workers");
  if (!env.DB) return null;

  await env.DB.batch([
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL CHECK (kind IN ('need', 'offer')),
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        first_name TEXT NOT NULL,
        email TEXT NOT NULL,
        commune TEXT NOT NULL,
        availability TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at INTEGER NOT NULL
      )
    `),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS responses (
        id TEXT PRIMARY KEY,
        announcement_id TEXT NOT NULL,
        first_name TEXT NOT NULL,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE
      )
    `),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        announcement_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE
      )
    `),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS announcements_kind_category_idx ON announcements(kind, category)",
    ),
  ]);

  const count = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM announcements",
  ).first<{ count: number }>();

  if ((count?.count ?? 0) === 0) {
    await env.DB.batch(
      seedAnnouncements.map((item) =>
        env.DB.prepare(`
          INSERT INTO announcements (
            id, kind, category, title, description, first_name, email,
            commune, availability, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          item.id,
          item.kind,
          item.category,
          item.title,
          item.description,
          item.firstName,
          "demo@france-solidaire.fr",
          item.commune,
          item.availability,
          item.status,
          item.createdAt,
        ),
      ),
    );
  }

  return env.DB;
}

export async function GET() {
  const db = await ensureDatabase();
  if (!db) return NextResponse.json({ announcements: seedAnnouncements });

  const result = await db
    .prepare(`
      SELECT
        id, kind, category, title, description, first_name AS firstName,
        commune, availability, status, created_at AS createdAt
      FROM announcements
      WHERE status != 'closed'
      ORDER BY created_at DESC
      LIMIT 100
    `)
    .all<Announcement>();

  return NextResponse.json({ announcements: result.results });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const kind = body.kind as AnnouncementKind;
  const category = String(body.category ?? "").trim();
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const firstName = String(body.firstName ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const commune = String(body.commune ?? "").trim();
  const availability = String(body.availability ?? "").trim();

  if (
    !["need", "offer"].includes(kind) ||
    !categories.includes(category as (typeof categories)[number]) ||
    title.length < 5 ||
    description.length < 15 ||
    firstName.length < 2 ||
    !email.includes("@") ||
    commune.length < 2 ||
    availability.length < 2
  ) {
    return NextResponse.json(
      { error: "Merci de vérifier les informations saisies." },
      { status: 400 },
    );
  }

  const announcement: Announcement = {
    id: crypto.randomUUID(),
    kind,
    category,
    title,
    description,
    firstName,
    commune,
    availability,
    status: "active",
    createdAt: Date.now(),
  };

  const db = await ensureDatabase();
  if (db) {
    await db
      .prepare(`
        INSERT INTO announcements (
          id, kind, category, title, description, first_name, email,
          commune, availability, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        announcement.id,
        announcement.kind,
        announcement.category,
        announcement.title,
        announcement.description,
        announcement.firstName,
        email,
        announcement.commune,
        announcement.availability,
        announcement.status,
        announcement.createdAt,
      )
      .run();
  }

  return NextResponse.json({ announcement }, { status: 201 });
}

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const announcementId = String(body.announcementId ?? "").trim();
  const firstName = String(body.firstName ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const message = String(body.message ?? "").trim();

  if (
    !announcementId ||
    firstName.length < 2 ||
    !email.includes("@") ||
    message.length < 10
  ) {
    return NextResponse.json(
      { error: "Merci de compléter votre message." },
      { status: 400 },
    );
  }

  const { env } = await import("cloudflare:workers");
  if (env.DB) {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS responses (
        id TEXT PRIMARY KEY,
        announcement_id TEXT NOT NULL,
        first_name TEXT NOT NULL,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE
      )
    `).run();

    await env.DB.prepare(`
      INSERT INTO responses (
        id, announcement_id, first_name, email, message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `)
      .bind(
        crypto.randomUUID(),
        announcementId,
        firstName,
        email,
        message,
        Date.now(),
      )
      .run();
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

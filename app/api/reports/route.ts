import { count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  announcements,
  emailOutbox,
  reports,
} from "@/db/schema";
import { apiError } from "@/lib/api";
import { emailLayout, queuedEmail } from "@/lib/email";
import { logger, requestId } from "@/lib/logger";
import { consumeRateLimit } from "@/lib/rate-limit";
import { clientKey, escapeHtml } from "@/lib/security";
import { readJson, reportInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const id = requestId(request);
  try {
    if (!(await consumeRateLimit(request, "report.create", 6, 3_600))) {
      return NextResponse.json(
        { error: "Trop de signalements récents.", requestId: id },
        { status: 429 },
      );
    }
    const input = reportInputSchema.parse(await readJson(request));
    const reporterKeyHash = clientKey(request);
    const db = getDb();
    const [announcement] = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, input.announcementId))
      .limit(1);
    if (!announcement) {
      return NextResponse.json(
        { error: "Annonce introuvable.", requestId: id },
        { status: 404 },
      );
    }

    await db.transaction(async (transaction) => {
      await transaction.insert(reports).values({
        announcementId: announcement.id,
        reason: input.reason,
        details: input.details,
        reporterKeyHash,
      });
      const [reportCount] = await transaction
        .select({ value: count() })
        .from(reports)
        .where(eq(reports.announcementId, announcement.id));
      if ((reportCount?.value ?? 0) >= 3) {
        await transaction
          .update(announcements)
          .set({
            status: "pending",
            moderationNote: "Masquée automatiquement après trois signalements.",
            updatedAt: new Date(),
          })
          .where(eq(announcements.id, announcement.id));
      }
      if (process.env.MODERATION_EMAIL) {
        await transaction.insert(emailOutbox).values(
          queuedEmail({
            kind: "moderation-report",
            to: process.env.MODERATION_EMAIL,
            subject: `Signalement : ${announcement.title}`,
            text: `Motif : ${input.reason}\n\n${input.details}`,
            html: emailLayout(
              "Une annonce a été signalée",
              `<p><strong>${escapeHtml(announcement.title)}</strong></p><p>Motif : ${escapeHtml(input.reason)}</p><p>${escapeHtml(input.details)}</p>`,
            ),
          }),
        );
      }
    });
    logger.warn("announcement.reported", {
      requestId: id,
      announcementId: announcement.id,
      reason: input.reason,
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const databaseError = error as { code?: string };
    if (databaseError.code === "23505") {
      return NextResponse.json(
        { error: "Vous avez déjà signalé cette annonce.", requestId: id },
        { status: 409 },
      );
    }
    return apiError(error, { requestId: id, event: "report.create.failed" });
  }
}

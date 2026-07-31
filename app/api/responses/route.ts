import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  announcements,
  emailOutbox,
  responses,
} from "@/db/schema";
import { apiError } from "@/lib/api";
import { emailLayout, queuedEmail } from "@/lib/email";
import { logger, requestId } from "@/lib/logger";
import { consumeRateLimit } from "@/lib/rate-limit";
import {
  appUrl,
  escapeHtml,
  hashToken,
  randomToken,
} from "@/lib/security";
import { readJson, responseInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const id = requestId(request);
  try {
    if (!(await consumeRateLimit(request, "response.create", 10, 3_600))) {
      return NextResponse.json(
        {
          error: "Trop de messages récents. Réessayez dans une heure.",
          requestId: id,
        },
        { status: 429, headers: { "Retry-After": "3600" } },
      );
    }
    const input = responseInputSchema.parse(await readJson(request));
    const db = getDb();
    const [announcement] = await db
      .select()
      .from(announcements)
      .where(
        and(
          eq(announcements.id, input.announcementId),
          eq(announcements.status, "active"),
          gt(announcements.expiresAt, new Date()),
        ),
      )
      .limit(1);
    if (!announcement) {
      return NextResponse.json(
        { error: "Cette annonce n’est plus disponible.", requestId: id },
        { status: 404 },
      );
    }

    const verificationToken = randomToken();
    const verificationUrl = `${appUrl()}/responses/verify?token=${encodeURIComponent(verificationToken)}`;
    const [reply] = await db.transaction(async (transaction) => {
      const created = await transaction
        .insert(responses)
        .values({
          announcementId: announcement.id,
          firstName: input.firstName,
          email: input.email,
          message: input.message,
          verificationTokenHash: hashToken(verificationToken),
          verificationExpiresAt: new Date(Date.now() + 30 * 60 * 1_000),
        })
        .returning();
      await transaction.insert(emailOutbox).values(
        queuedEmail({
          kind: "response-verification",
          to: input.email,
          subject: "Confirmez votre message France Solidaire",
          text: `Confirmez votre adresse pour transmettre votre message : ${verificationUrl}`,
          html: emailLayout(
            "Confirmez votre message",
            `<p>Vous souhaitez répondre à « ${escapeHtml(announcement.title)} ».</p><p><a href="${verificationUrl}" style="display:inline-block;background:#263d38;color:#fff;padding:12px 18px;border-radius:12px;text-decoration:none">Confirmer et transmettre</a></p><p>Ce lien expire dans 30 minutes. Tant que vous ne cliquez pas, votre message reste invisible.</p>`,
          ),
        }),
      );
      return created;
    });

    logger.info("response.verification_queued", {
      requestId: id,
      responseId: reply.id,
      announcementId: announcement.id,
    });
    return NextResponse.json(
      { ok: true, verification: "queued" },
      { status: 202 },
    );
  } catch (error) {
    return apiError(error, { requestId: id, event: "response.create.failed" });
  }
}

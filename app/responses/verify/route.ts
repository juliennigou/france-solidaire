import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  announcements,
  emailOutbox,
  responses,
} from "@/db/schema";
import { emailLayout, queuedEmail } from "@/lib/email";
import { logger, requestId } from "@/lib/logger";
import { appUrl, escapeHtml, hashToken } from "@/lib/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const id = requestId(request);
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (token.length < 20) {
    return NextResponse.redirect(`${appUrl()}/?reponse=invalide`);
  }
  try {
    const db = getDb();
    const result = await db.transaction(async (transaction) => {
      const [reply] = await transaction
        .select({
          response: responses,
          announcement: announcements,
        })
        .from(responses)
        .innerJoin(
          announcements,
          eq(announcements.id, responses.announcementId),
        )
        .where(
          and(
            eq(responses.verificationTokenHash, hashToken(token)),
            eq(responses.status, "pending_verification"),
            gt(responses.verificationExpiresAt, new Date()),
            eq(announcements.status, "active"),
            gt(announcements.expiresAt, new Date()),
          ),
        )
        .limit(1);
      if (!reply) throw new Error("RESPONSE_VERIFICATION_INVALID");

      await transaction
        .update(responses)
        .set({ status: "verified", verifiedAt: new Date() })
        .where(eq(responses.id, reply.response.id));

      const dashboardUrl = `${appUrl()}/tableau-de-bord`;
      await transaction.insert(emailOutbox).values(
        queuedEmail({
          kind: "announcement-response",
          to: reply.announcement.email,
          subject: `Une réponse à votre annonce « ${reply.announcement.title} »`,
          text: `${reply.response.firstName} (${reply.response.email}) vous propose son aide :\n\n${reply.response.message}\n\nRetrouvez vos réponses : ${dashboardUrl}`,
          html: emailLayout(
            "Une personne vous a répondu",
            `<p><strong>${escapeHtml(reply.response.firstName)}</strong> répond à « ${escapeHtml(reply.announcement.title)} ».</p><blockquote style="border-left:4px solid #267362;padding-left:14px">${escapeHtml(reply.response.message)}</blockquote><p>Vous pouvez lui répondre à <a href="mailto:${escapeHtml(reply.response.email)}">${escapeHtml(reply.response.email)}</a>.</p><p><a href="${dashboardUrl}">Retrouver toutes mes réponses</a></p>`,
          ),
        }),
      );
      return reply.response.id;
    });
    logger.info("response.verified", { requestId: id, responseId: result });
    return NextResponse.redirect(`${appUrl()}/?reponse=confirmee`);
  } catch (error) {
    logger.warn("response.verify.failed", {
      requestId: id,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.redirect(`${appUrl()}/?reponse=expiree`);
  }
}

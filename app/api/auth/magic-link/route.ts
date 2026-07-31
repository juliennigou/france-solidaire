import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { emailOutbox, magicLinks } from "@/db/schema";
import { apiError } from "@/lib/api";
import { emailLayout, queuedEmail } from "@/lib/email";
import { logger, requestId } from "@/lib/logger";
import { consumeRateLimit } from "@/lib/rate-limit";
import {
  appUrl,
  hashToken,
  randomToken,
} from "@/lib/security";
import { magicLinkInputSchema, readJson } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const id = requestId(request);
  try {
    if (!(await consumeRateLimit(request, "magic-link.request", 4, 3_600))) {
      return NextResponse.json(
        {
          error: "Trop de liens demandés. Réessayez dans une heure.",
          requestId: id,
        },
        { status: 429 },
      );
    }
    const input = magicLinkInputSchema.parse(await readJson(request, 4_096));
    const token = randomToken();
    const verificationUrl = `${appUrl()}/auth/verify?token=${encodeURIComponent(token)}`;
    const db = getDb();
    await db.transaction(async (transaction) => {
      await transaction.insert(magicLinks).values({
        email: input.email,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 15 * 60 * 1_000),
      });
      await transaction.insert(emailOutbox).values(
        queuedEmail({
          kind: "magic-link",
          to: input.email,
          subject: "Votre lien de connexion France Solidaire",
          text: `Ce lien est valable 15 minutes : ${verificationUrl}`,
          html: emailLayout(
            "Votre lien de connexion",
            `<p>Ce lien personnel est valable 15 minutes.</p><p><a href="${verificationUrl}" style="display:inline-block;background:#263d38;color:#fff;padding:12px 18px;border-radius:12px;text-decoration:none">Accéder à mon espace</a></p><p>Si vous n’avez rien demandé, ignorez cet email.</p>`,
          ),
        }),
      );
    });
    logger.info("auth.magic_link.queued", {
      requestId: id,
      emailHash: hashToken(input.email),
    });
    return NextResponse.json(
      { ok: true, delivery: "queued" },
      { status: 202 },
    );
  } catch (error) {
    return apiError(error, {
      requestId: id,
      event: "auth.magic_link.failed",
    });
  }
}

import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  magicLinks,
  profiles,
  sessions,
} from "@/db/schema";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";
import { logger, requestId } from "@/lib/logger";
import { appUrl, hashToken, randomToken } from "@/lib/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const id = requestId(request);
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (token.length < 20) {
    return NextResponse.redirect(`${appUrl()}/?connexion=invalide`);
  }
  try {
    const db = getDb();
    const sessionToken = randomToken();
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1_000);

    await db.transaction(async (transaction) => {
      const [magicLink] = await transaction
        .select()
        .from(magicLinks)
        .where(
          and(
            eq(magicLinks.tokenHash, hashToken(token)),
            gt(magicLinks.expiresAt, new Date()),
            isNull(magicLinks.consumedAt),
          ),
        )
        .limit(1);
      if (!magicLink) throw new Error("MAGIC_LINK_INVALID");

      await transaction
        .update(magicLinks)
        .set({ consumedAt: new Date() })
        .where(eq(magicLinks.id, magicLink.id));

      let [profile] = await transaction
        .select()
        .from(profiles)
        .where(sql`lower(${profiles.email}) = ${magicLink.email.toLowerCase()}`)
        .limit(1);
      if (!profile) {
        [profile] = await transaction
          .insert(profiles)
          .values({ email: magicLink.email })
          .returning();
      }
      await transaction.insert(sessions).values({
        profileId: profile.id,
        tokenHash: hashToken(sessionToken),
        expiresAt: sessionExpiresAt,
      });
    });

    (await cookies()).set(
      SESSION_COOKIE,
      sessionToken,
      sessionCookieOptions(sessionExpiresAt),
    );
    logger.info("auth.session.created", { requestId: id });
    return NextResponse.redirect(`${appUrl()}/tableau-de-bord`);
  } catch (error) {
    logger.warn("auth.verify.failed", {
      requestId: id,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.redirect(`${appUrl()}/?connexion=expiree`);
  }
}

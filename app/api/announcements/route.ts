import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { announcements, emailOutbox } from "@/db/schema";
import { listPublicAnnouncements } from "@/lib/announcement-repository";
import { categories, seedAnnouncements } from "@/lib/announcements";
import { apiError } from "@/lib/api";
import { currentProfileFromRequest } from "@/lib/auth";
import { emailLayout, queuedEmail } from "@/lib/email";
import { logger, requestId } from "@/lib/logger";
import { consumeRateLimit } from "@/lib/rate-limit";
import {
  appUrl,
  escapeHtml,
  hashToken,
  randomToken,
} from "@/lib/security";
import {
  announcementInputSchema,
  dangerousWorkIssue,
  publicContentIssue,
  readJson,
} from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const id = requestId(request);
  try {
    const url = new URL(request.url);
    const kindValue = url.searchParams.get("kind");
    const category = url.searchParams.get("category") ?? undefined;
    if (category && category !== "Toutes" && !categories.includes(category as never)) {
      return NextResponse.json(
        { error: "Catégorie inconnue.", requestId: id },
        { status: 400 },
      );
    }
    const result = await listPublicAnnouncements({
      kind:
        kindValue === "need" || kindValue === "offer" ? kindValue : undefined,
      category,
      query: url.searchParams.get("q") ?? undefined,
      limit: Number(url.searchParams.get("limit") ?? 50),
    });
    return NextResponse.json(result);
  } catch (error) {
    if (
      process.env.DEMO_MODE === "true" ||
      (process.env.NODE_ENV === "development" && !process.env.DATABASE_URL)
    ) {
      return NextResponse.json({
        announcements: seedAnnouncements,
        total: seedAnnouncements.length,
        demo: true,
      });
    }
    return apiError(error, { requestId: id, event: "announcements.list.failed" });
  }
}

export async function POST(request: Request) {
  const id = requestId(request);
  try {
    if (!(await consumeRateLimit(request, "announcement.create", 5, 3_600))) {
      return NextResponse.json(
        {
          error: "Trop de publications récentes. Réessayez dans une heure.",
          requestId: id,
        },
        { status: 429, headers: { "Retry-After": "3600" } },
      );
    }
    const input = announcementInputSchema.parse(await readJson(request));
    const publicIssue = publicContentIssue(input.title, input.description);
    if (publicIssue) {
      return NextResponse.json(
        {
          error: `Retirez ${publicIssue} du texte public. Vos coordonnées seront transmises de manière privée.`,
          requestId: id,
        },
        { status: 422 },
      );
    }
    if (input.category === "Travaux") {
      const dangerousIssue = dangerousWorkIssue(input.title, input.description);
      if (dangerousIssue) {
        return NextResponse.json(
          { error: dangerousIssue, requestId: id },
          { status: 422 },
        );
      }
    }

    const profile = await currentProfileFromRequest(request);
    const managementToken = randomToken();
    const manageUrl = `${appUrl()}/gerer/${managementToken}`;
    const db = getDb();
    const [announcement] = await db.transaction(async (transaction) => {
      const created = await transaction
        .insert(announcements)
        .values({
          profileId: profile?.id,
          kind: input.kind,
          category: input.category,
          title: input.title,
          description: input.description,
          firstName: input.firstName,
          email: input.email,
          commune: input.commune,
          availability: input.availability,
          managementTokenHash: hashToken(managementToken),
        })
        .returning();

      await transaction.insert(emailOutbox).values(
        queuedEmail({
          kind: "announcement-management",
          to: input.email,
          subject: "Gérez votre annonce France Solidaire",
          text: `Votre annonce est publiée. Gérez-la, consultez les réponses ou fermez-la ici : ${manageUrl}`,
          html: emailLayout(
            "Votre annonce est publiée",
            `<p>Votre annonce « ${escapeHtml(input.title)} » est visible.</p><p><a href="${manageUrl}" style="display:inline-block;background:#263d38;color:#fff;padding:12px 18px;border-radius:12px;text-decoration:none">Gérer mon annonce</a></p><p>Ce lien est personnel : ne le partagez pas.</p>`,
          ),
        }),
      );
      return created;
    });

    logger.info("announcement.created", {
      requestId: id,
      announcementId: announcement.id,
      kind: announcement.kind,
      category: announcement.category,
    });
    return NextResponse.json(
      {
        announcement: {
          id: announcement.id,
          kind: announcement.kind,
          category: announcement.category,
          title: announcement.title,
          description: announcement.description,
          firstName: announcement.firstName,
          commune: announcement.commune,
          availability: announcement.availability,
          status: "active",
          createdAt: announcement.createdAt.getTime(),
        },
        managementEmail: "queued",
      },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error, {
      requestId: id,
      event: "announcement.create.failed",
    });
  }
}

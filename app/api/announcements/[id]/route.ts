import { and, eq, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { announcements } from "@/db/schema";
import { apiError } from "@/lib/api";
import { currentProfile } from "@/lib/auth";
import { logger, requestId } from "@/lib/logger";
import { manageInputSchema, readJson } from "@/lib/validation";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ id: string }> };

async function ownerCondition(id: string) {
  const profile = await currentProfile();
  if (!profile) return null;
  return and(
    eq(announcements.id, id),
    or(
      eq(announcements.profileId, profile.id),
      sql`lower(${announcements.email}) = ${profile.email.toLowerCase()}`,
    ),
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  const id = requestId(request);
  try {
    const params = await context.params;
    const condition = await ownerCondition(params.id);
    if (!condition) {
      return NextResponse.json(
        { error: "Connexion requise.", requestId: id },
        { status: 401 },
      );
    }
    const input = manageInputSchema.parse(await readJson(request, 2_048));
    if (input.action === "delete") {
      return NextResponse.json(
        { error: "Utilisez la suppression explicite.", requestId: id },
        { status: 400 },
      );
    }
    const [updated] = await getDb()
      .update(announcements)
      .set({
        status: input.action === "close" ? "closed" : "active",
        updatedAt: new Date(),
      })
      .where(condition)
      .returning({ id: announcements.id, status: announcements.status });
    if (!updated) {
      return NextResponse.json(
        { error: "Annonce introuvable.", requestId: id },
        { status: 404 },
      );
    }
    logger.info("announcement.owner_managed", {
      requestId: id,
      announcementId: updated.id,
      action: input.action,
    });
    return NextResponse.json({ announcement: updated });
  } catch (error) {
    return apiError(error, { requestId: id, event: "owner.update.failed" });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const id = requestId(request);
  try {
    const params = await context.params;
    const condition = await ownerCondition(params.id);
    if (!condition) {
      return NextResponse.json(
        { error: "Connexion requise.", requestId: id },
        { status: 401 },
      );
    }
    const [deleted] = await getDb()
      .delete(announcements)
      .where(condition)
      .returning({ id: announcements.id });
    if (!deleted) {
      return NextResponse.json(
        { error: "Annonce introuvable.", requestId: id },
        { status: 404 },
      );
    }
    logger.info("announcement.owner_deleted", {
      requestId: id,
      announcementId: deleted.id,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, { requestId: id, event: "owner.delete.failed" });
  }
}

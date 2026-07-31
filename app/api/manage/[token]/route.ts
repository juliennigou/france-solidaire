import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { announcements } from "@/db/schema";
import { apiError } from "@/lib/api";
import { logger, requestId } from "@/lib/logger";
import { hashToken } from "@/lib/security";
import { manageInputSchema, readJson } from "@/lib/validation";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ token: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const id = requestId(request);
  try {
    const { token } = await context.params;
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
      .where(eq(announcements.managementTokenHash, hashToken(token)))
      .returning({ id: announcements.id, status: announcements.status });
    if (!updated) {
      return NextResponse.json(
        { error: "Lien de gestion invalide.", requestId: id },
        { status: 404 },
      );
    }
    logger.info("announcement.managed", {
      requestId: id,
      announcementId: updated.id,
      action: input.action,
    });
    return NextResponse.json({ announcement: updated });
  } catch (error) {
    return apiError(error, { requestId: id, event: "manage.update.failed" });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const id = requestId(request);
  try {
    const { token } = await context.params;
    const [deleted] = await getDb()
      .delete(announcements)
      .where(eq(announcements.managementTokenHash, hashToken(token)))
      .returning({ id: announcements.id });
    if (!deleted) {
      return NextResponse.json(
        { error: "Lien de gestion invalide.", requestId: id },
        { status: 404 },
      );
    }
    logger.info("announcement.deleted", {
      requestId: id,
      announcementId: deleted.id,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, { requestId: id, event: "manage.delete.failed" });
  }
}

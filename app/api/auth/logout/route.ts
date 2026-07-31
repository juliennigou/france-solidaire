import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { sessions } from "@/db/schema";
import { SESSION_COOKIE } from "@/lib/auth";
import { hashToken } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      await getDb()
        .delete(sessions)
        .where(eq(sessions.tokenHash, hashToken(token)));
    } catch {
      // The cookie is still cleared when the database is unavailable.
    }
  }
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}

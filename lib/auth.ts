import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { profiles, sessions } from "@/db/schema";
import { hashToken } from "@/lib/security";

export const SESSION_COOKIE = "france_solidaire_session";

export type CurrentProfile = {
  id: string;
  email: string;
  firstName: string | null;
};

async function profileForToken(token: string | undefined) {
  if (!token) return null;
  const db = getDb();
  const [profile] = await db
    .select({
      id: profiles.id,
      email: profiles.email,
      firstName: profiles.firstName,
    })
    .from(sessions)
    .innerJoin(profiles, eq(profiles.id, sessions.profileId))
    .where(
      and(
        eq(sessions.tokenHash, hashToken(token)),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return profile ?? null;
}

export async function currentProfile(): Promise<CurrentProfile | null> {
  return profileForToken((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function currentProfileFromRequest(
  request: Request,
): Promise<CurrentProfile | null> {
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${SESSION_COOKIE}=`));
  return profileForToken(cookie?.slice(SESSION_COOKIE.length + 1));
}

export function sessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires,
    priority: "high" as const,
  };
}

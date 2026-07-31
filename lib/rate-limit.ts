import { and, count, eq, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { rateLimits } from "@/db/schema";
import { clientKey } from "@/lib/security";

export async function consumeRateLimit(
  request: Request,
  action: string,
  maximum: number,
  windowSeconds: number,
) {
  const db = getDb();
  const keyHash = clientKey(request);
  const since = new Date(Date.now() - windowSeconds * 1_000);

  return db.transaction(async (transaction) => {
    const [result] = await transaction
      .select({ value: count() })
      .from(rateLimits)
      .where(
        and(
          eq(rateLimits.keyHash, keyHash),
          eq(rateLimits.action, action),
          gt(rateLimits.createdAt, since),
        ),
      );
    if ((result?.value ?? 0) >= maximum) return false;
    await transaction.insert(rateLimits).values({ keyHash, action });
    return true;
  });
}

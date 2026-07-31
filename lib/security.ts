import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function safeTokenEquals(value: string, expectedHash: string) {
  const actual = Buffer.from(hashToken(value), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return (
    actual.length === expected.length && timingSafeEqual(actual, expected)
  );
}

export function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const address =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const secret =
    process.env.RATE_LIMIT_SECRET ??
    (process.env.NODE_ENV === "production" ? "" : "development-only-secret");
  if (!secret) throw new Error("RATE_LIMIT_SECRET est absente.");
  return hashToken(`${secret}:${address}`);
}

export function appUrl() {
  const configured = process.env.APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_URL est absente.");
  }
  return "http://localhost:3000";
}

export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}

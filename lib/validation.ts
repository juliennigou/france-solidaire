import { z } from "zod";
import { categories } from "@/lib/announcements";

const email = z
  .email("L’adresse email n’est pas valide.")
  .max(320)
  .transform((value) => value.trim().toLowerCase());

const cleanText = (minimum: number, maximum: number, label: string) =>
  z
    .string()
    .trim()
    .min(minimum, `${label} est trop court.`)
    .max(maximum, `${label} est trop long.`);

export const announcementInputSchema = z.object({
  kind: z.enum(["need", "offer"]),
  category: z.enum(categories),
  title: cleanText(5, 100, "Le titre"),
  description: cleanText(15, 1_000, "La description"),
  firstName: cleanText(2, 80, "Le prénom"),
  email,
  commune: cleanText(2, 120, "La commune"),
  availability: cleanText(2, 160, "La disponibilité"),
  website: z.string().max(0).optional().default(""),
});

export const responseInputSchema = z.object({
  announcementId: z.uuid(),
  firstName: cleanText(2, 80, "Le prénom"),
  email,
  message: cleanText(10, 1_200, "Le message"),
  website: z.string().max(0).optional().default(""),
});

export const reportInputSchema = z.object({
  announcementId: z.uuid(),
  reason: z.enum([
    "fraude",
    "coordonnees",
    "danger",
    "commerce",
    "harcelement",
    "autre",
  ]),
  details: z.string().trim().max(600).optional().default(""),
  website: z.string().max(0).optional().default(""),
});

export const magicLinkInputSchema = z.object({
  email,
  website: z.string().max(0).optional().default(""),
});

export const manageInputSchema = z.object({
  action: z.enum(["close", "reopen", "delete"]),
});

const publicContactPatterns = [
  {
    label: "une adresse email",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  },
  {
    label: "un numéro de téléphone",
    pattern: /(?:\+33|0)\s*[1-9](?:[\s.-]*\d{2}){4}\b/,
  },
  {
    label: "un lien internet",
    pattern: /\b(?:https?:\/\/|www\.)\S+/i,
  },
  {
    label: "une adresse précise",
    pattern:
      /\b\d{1,4}\s+(?:rue|avenue|av\.?|boulevard|bd\.?|chemin|route|impasse|allée|place)\b/i,
  },
];

const dangerousWorkPatterns = [
  /\b(?:amiante|désamiantage)\b/i,
  /\b(?:gaz|chaudière)\b/i,
  /\b(?:tableau électrique|haute tension|raccordement électrique)\b/i,
  /\b(?:toiture|charpente|mur porteur)\b/i,
  /\b(?:tronçonneuse|élagage en hauteur)\b/i,
];

export function publicContentIssue(...values: string[]) {
  const content = values.join(" ");
  return publicContactPatterns.find(({ pattern }) => pattern.test(content))
    ?.label;
}

export function dangerousWorkIssue(...values: string[]) {
  const content = values.join(" ");
  return dangerousWorkPatterns.find((pattern) => pattern.test(content))
    ? "Cette intervention doit être confiée à un professionnel assuré."
    : null;
}

export async function readJson(
  request: Request,
  maximumBytes = 16_384,
): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    throw new RequestBodyError("Le contenu doit être envoyé en JSON.", 415);
  }
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > maximumBytes) {
    throw new RequestBodyError("La requête est trop volumineuse.", 413);
  }
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > maximumBytes) {
    throw new RequestBodyError("La requête est trop volumineuse.", 413);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new RequestBodyError("Le JSON envoyé est invalide.", 400);
  }
}

export class RequestBodyError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export function firstZodError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Les informations sont invalides.";
}

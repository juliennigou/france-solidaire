import assert from "node:assert/strict";
import test from "node:test";
import {
  announcementInputSchema,
  dangerousWorkIssue,
  publicContentIssue,
  readJson,
  RequestBodyError,
  responseInputSchema,
} from "../lib/validation";

const validAnnouncement = {
  kind: "need",
  category: "Transport",
  title: "Besoin d’une remorque samedi",
  description:
    "Nous cherchons un véhicule pour déplacer quelques meubles dans la commune.",
  firstName: "Nadia",
  email: "NADIA@example.fr",
  commune: "Sainte-Hélène",
  availability: "Samedi matin",
  website: "",
};

test("normalise et valide une annonce complète", () => {
  const result = announcementInputSchema.parse(validAnnouncement);
  assert.equal(result.email, "nadia@example.fr");
  assert.equal(result.category, "Transport");
});

test("refuse les textes et emails trop longs ou invalides", () => {
  assert.equal(
    announcementInputSchema.safeParse({
      ...validAnnouncement,
      title: "x".repeat(101),
    }).success,
    false,
  );
  assert.equal(
    responseInputSchema.safeParse({
      announcementId: crypto.randomUUID(),
      firstName: "Léa",
      email: "invalide",
      message: "Je peux vous aider demain matin.",
    }).success,
    false,
  );
});

test("détecte les coordonnées qui seraient rendues publiques", () => {
  assert.equal(
    publicContentIssue("Appelez-moi au 06 12 34 56 78"),
    "un numéro de téléphone",
  );
  assert.equal(
    publicContentIssue("Rendez-vous au 12 rue Victor Hugo"),
    "une adresse précise",
  );
  assert.equal(publicContentIssue("Besoin d’aide dans la commune"), undefined);
});

test("écarte les travaux devant être réalisés par un professionnel", () => {
  assert.ok(dangerousWorkIssue("Réparer la toiture"));
  assert.equal(dangerousWorkIssue("Monter une étagère"), null);
});

test("readJson renvoie des erreurs HTTP stables", async () => {
  await assert.rejects(
    readJson(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "{}",
      }),
    ),
    (error) => error instanceof RequestBodyError && error.status === 415,
  );
  await assert.rejects(
    readJson(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      }),
    ),
    (error) => error instanceof RequestBodyError && error.status === 400,
  );
});

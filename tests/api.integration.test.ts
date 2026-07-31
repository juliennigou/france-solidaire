import assert from "node:assert/strict";
import test from "node:test";
import { eq } from "drizzle-orm";
import { getDb, getSql } from "../db";
import {
  announcements,
  emailOutbox,
  rateLimits,
  responses,
} from "../db/schema";
import { GET, POST as createAnnouncement } from "../app/api/announcements/route";
import { POST as createResponse } from "../app/api/responses/route";
import { GET as verifyResponse } from "../app/responses/verify/route";

const integration = process.env.RUN_DATABASE_TESTS === "true";
const headers = {
  "Content-Type": "application/json",
  "x-forwarded-for": "203.0.113.42",
};

test(
  "publie, relit puis répond sans perdre de données",
  { skip: !integration },
  async () => {
    const db = getDb();
    await db.delete(rateLimits);
    await db.delete(emailOutbox);
    await db.delete(responses);
    await db.delete(announcements);

    const createResult = await createAnnouncement(
      new Request("http://localhost/api/announcements", {
        method: "POST",
        headers,
        body: JSON.stringify({
          kind: "need",
          category: "Transport",
          title: "Besoin d’une remorque samedi",
          description:
            "Nous cherchons un véhicule pour déplacer quelques meubles dans la commune.",
          firstName: "Nadia",
          email: "nadia@example.fr",
          commune: "Sainte-Hélène",
          availability: "Samedi matin",
          website: "",
        }),
      }),
    );
    assert.equal(createResult.status, 201);
    const created = (await createResult.json()) as {
      announcement: { id: string };
      managementEmail: string;
    };
    assert.equal(created.managementEmail, "queued");

    const listResult = await GET(
      new Request("http://localhost/api/announcements?kind=need"),
    );
    assert.equal(listResult.status, 200);
    const list = (await listResult.json()) as {
      announcements: Array<{ id: string }>;
    };
    assert.ok(
      list.announcements.some((item) => item.id === created.announcement.id),
    );

    const responseResult = await createResponse(
      new Request("http://localhost/api/responses", {
        method: "POST",
        headers: { ...headers, "x-forwarded-for": "203.0.113.43" },
        body: JSON.stringify({
          announcementId: created.announcement.id,
          firstName: "Lucas",
          email: "lucas@example.fr",
          message: "Bonjour, je peux venir avec ma remorque samedi matin.",
          website: "",
        }),
      }),
    );
    assert.equal(responseResult.status, 202);
    const [persisted] = await db
      .select()
      .from(responses)
      .where(eq(responses.announcementId, created.announcement.id));
    assert.equal(persisted.email, "lucas@example.fr");
    assert.equal(persisted.status, "pending_verification");

    let queued = await db.select().from(emailOutbox);
    assert.equal(queued.length, 2);
    const verificationEmail = queued.find(
      (email) => email.kind === "response-verification",
    );
    const verificationUrl = verificationEmail?.textBody.match(
      /https?:\/\/\S+/,
    )?.[0];
    assert.ok(verificationUrl);
    const verificationResult = await verifyResponse(
      new Request(verificationUrl),
    );
    assert.equal(verificationResult.status, 307);

    const [verified] = await db
      .select()
      .from(responses)
      .where(eq(responses.id, persisted.id));
    assert.equal(verified.status, "verified");
    queued = await db.select().from(emailOutbox);
    assert.equal(queued.length, 3);
    await getSql().end();
  },
);

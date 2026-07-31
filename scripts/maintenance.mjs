import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL est absente.");
const sql = postgres(databaseUrl, { max: 1, prepare: false });
let stopping = false;
let wakeMaintenance = () => {};

async function maintain() {
  const [result] = await sql.begin(async (transaction) => {
    const expiredSessions =
      await transaction`delete from sessions where expires_at < now() returning id`;
    const expiredLinks = await transaction`
      delete from magic_links
      where expires_at < now() - interval '1 day' or consumed_at < now() - interval '1 day'
      returning id
    `;
    const oldRateLimits =
      await transaction`delete from rate_limits where created_at < now() - interval '24 hours' returning id`;
    const unverifiedResponses = await transaction`
      delete from responses
      where status = 'pending_verification' and verification_expires_at < now() - interval '1 day'
      returning id
    `;
    const oldAnnouncements = await transaction`
      delete from announcements
      where expires_at < now() - interval '30 days'
         or (status in ('closed', 'rejected') and updated_at < now() - interval '30 days')
      returning id
    `;
    const oldEmails = await transaction`
      delete from email_outbox
      where (status = 'sent' and sent_at < now() - interval '30 days')
         or (status = 'failed' and attempts >= 10 and updated_at < now() - interval '30 days')
      returning id
    `;
    return [
      {
        expiredSessions: expiredSessions.length,
        expiredLinks: expiredLinks.length,
        oldRateLimits: oldRateLimits.length,
        unverifiedResponses: unverifiedResponses.length,
        oldAnnouncements: oldAnnouncements.length,
        oldEmails: oldEmails.length,
      },
    ];
  });
  console.info(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      event: "maintenance.completed",
      ...result,
    }),
  );
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopping = true;
    wakeMaintenance();
  });
}

try {
  while (!stopping) {
    await maintain();
    if (stopping) break;
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 6 * 60 * 60 * 1_000);
      wakeMaintenance = () => {
        clearTimeout(timer);
        resolve();
      };
    });
  }
} finally {
  await sql.end();
}

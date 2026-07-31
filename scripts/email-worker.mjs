import nodemailer from "nodemailer";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL est absente.");

const logTransport = process.env.EMAIL_TRANSPORT === "log";
if (!logTransport && !process.env.SMTP_URL) {
  throw new Error(
    "SMTP_URL est absente. Utilisez EMAIL_TRANSPORT=log uniquement en développement.",
  );
}

const sql = postgres(databaseUrl, {
  max: 2,
  prepare: false,
  connect_timeout: 15,
});
const transporter = logTransport
  ? nodemailer.createTransport({ jsonTransport: true })
  : nodemailer.createTransport(process.env.SMTP_URL, {
      pool: true,
      maxConnections: 3,
      requireTLS: !process.env.SMTP_URL?.startsWith("smtps:"),
      disableFileAccess: true,
      disableUrlAccess: true,
    });
const from = process.env.EMAIL_FROM ?? "France Solidaire <noreply@localhost>";
let stopping = false;

function log(level, event, data = {}) {
  console[level](
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      event,
      ...data,
    }),
  );
}

async function claimEmail() {
  return sql.begin(async (transaction) => {
    const [row] = await transaction`
      select id, kind, to_email, subject, text_body, html_body, attempts
      from email_outbox
      where status in ('pending', 'failed')
        and attempts < 10
        and next_attempt_at <= now()
      order by created_at
      for update skip locked
      limit 1
    `;
    if (!row) return null;
    await transaction`
      update email_outbox
      set status = 'sending', updated_at = now()
      where id = ${row.id}
    `;
    return row;
  });
}

async function deliver(row) {
  try {
    const result = await transporter.sendMail({
      from,
      to: row.to_email,
      subject: row.subject,
      text: row.text_body,
      html: row.html_body,
    });
    if (logTransport) {
      log("info", "email.preview", {
        emailId: row.id,
        envelope: result.envelope,
        message: result.message?.toString(),
      });
    }
    await sql`
      update email_outbox
      set status = 'sent', attempts = attempts + 1, sent_at = now(),
          last_error = null, updated_at = now()
      where id = ${row.id}
    `;
    log("info", "email.sent", { emailId: row.id, kind: row.kind });
  } catch (error) {
    const attempts = Number(row.attempts) + 1;
    const delayMinutes = Math.min(360, 2 ** attempts);
    await sql`
      update email_outbox
      set status = 'failed', attempts = attempts + 1,
          last_error = ${String(error).slice(0, 800)},
          next_attempt_at = now() + (${delayMinutes} * interval '1 minute'),
          updated_at = now()
      where id = ${row.id}
    `;
    log("error", "email.failed", {
      emailId: row.id,
      kind: row.kind,
      attempts,
      error: String(error),
    });
  }
}

async function run() {
  await sql`
    update email_outbox
    set status = 'failed', next_attempt_at = now(), updated_at = now(),
        last_error = 'Envoi interrompu puis repris'
    where status = 'sending' and updated_at < now() - interval '15 minutes'
  `;
  if (!logTransport) await transporter.verify();
  log("info", "email.worker.started", { transport: logTransport ? "log" : "smtp" });
  while (!stopping) {
    const row = await claimEmail();
    if (row) {
      await deliver(row);
      continue;
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopping = true;
  });
}

try {
  await run();
} catch (error) {
  log("error", "email.worker.crashed", { error: String(error) });
  process.exitCode = 1;
} finally {
  transporter.close();
  await sql.end();
}

import { escapeHtml } from "@/lib/security";

export function queuedEmail(message: {
  kind: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  return {
    kind: message.kind,
    toEmail: message.to,
    subject: message.subject,
    textBody: message.text,
    htmlBody: message.html,
  };
}

export function emailLayout(title: string, content: string) {
  return `<!doctype html>
<html lang="fr"><body style="margin:0;background:#f6f2e8;font-family:Arial,sans-serif;color:#263d38">
<main style="max-width:620px;margin:0 auto;padding:32px 20px">
<div style="background:#fff;border-radius:20px;padding:28px;border:1px solid #e7e1d4">
<p style="color:#c94434;font-weight:700;margin-top:0">France Solidaire</p>
<h1 style="font-size:24px">${escapeHtml(title)}</h1>
${content}
<p style="font-size:12px;color:#5d6d67;margin-top:28px">Ne transmettez jamais d’argent et ne communiquez votre adresse exacte qu’après avoir échangé en confiance.</p>
</div></main></body></html>`;
}

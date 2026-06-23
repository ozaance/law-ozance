// Envoi d'emails transactionnels via Resend (API HTTP, sans dépendance).
// Sans RESEND_API_KEY, l'envoi est ignoré (on retombe sur le lien à copier).

type SendResult = { sent: boolean; error?: string };

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

export async function sendInvitationEmail(opts: {
  to: string;
  cabinetNom: string;
  roleLabel: string;
  url: string;
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, error: "no_api_key" };

  const from = process.env.EMAIL_FROM ?? "Ozance <onboarding@resend.dev>";
  const cabinet = escapeHtml(opts.cabinetNom);
  const role = escapeHtml(opts.roleLabel);
  const url = opts.url;

  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111827">
    <h2 style="font-size:20px;margin:0 0 12px">Rejoignez ${cabinet} sur Ozance</h2>
    <p style="font-size:14px;line-height:1.6;color:#566072;margin:0 0 20px">
      Vous avez été invité à rejoindre <strong>${cabinet}</strong> en tant que <strong>${role}</strong>.
      Cliquez ci-dessous pour créer votre compte ou vous connecter et accéder à l'espace du cabinet.
    </p>
    <a href="${url}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:10px">
      Rejoindre le cabinet
    </a>
    <p style="font-size:12px;color:#9099a8;margin:22px 0 0">
      Ou copiez ce lien : <br><span style="word-break:break-all">${url}</span>
    </p>
    <p style="font-size:12px;color:#9099a8;margin:16px 0 0">Ce lien est valable 14 jours.</p>
  </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: opts.to,
        subject: `Invitation à rejoindre ${opts.cabinetNom} sur Ozance`,
        html,
      }),
    });
    if (!res.ok) return { sent: false, error: await res.text() };
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : "send_failed" };
  }
}

// Notifie l'équipe d'une nouvelle demande « Parler à un conseiller ».
export async function sendLeadEmail(lead: {
  nom: string;
  cabinet: string | null;
  email: string;
  telephone: string | null;
  message: string | null;
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, error: "no_api_key" };

  const from = process.env.EMAIL_FROM ?? "Ozance <onboarding@resend.dev>";
  const to = process.env.CONTACT_EMAIL ?? "contact@ozance.fr";

  const row = (label: string, value: string | null) =>
    value
      ? `<tr><td style="padding:4px 12px 4px 0;color:#9099a8">${label}</td><td style="padding:4px 0;font-weight:600">${escapeHtml(value)}</td></tr>`
      : "";

  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#111827">
    <h2 style="font-size:18px;margin:0 0 16px">Nouvelle demande de conseiller</h2>
    <table style="font-size:14px;border-collapse:collapse">
      ${row("Nom", lead.nom)}
      ${row("Cabinet", lead.cabinet)}
      ${row("Email", lead.email)}
      ${row("Téléphone", lead.telephone)}
    </table>
    ${lead.message ? `<p style="font-size:14px;line-height:1.6;color:#566072;margin:16px 0 0;white-space:pre-wrap">${escapeHtml(lead.message)}</p>` : ""}
  </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: lead.email,
        subject: `Conseiller — ${lead.nom}${lead.cabinet ? ` (${lead.cabinet})` : ""}`,
        html,
      }),
    });
    if (!res.ok) return { sent: false, error: await res.text() };
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : "send_failed" };
  }
}

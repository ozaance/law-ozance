// Envoi d'emails transactionnels via Resend (API HTTP, sans dépendance).
// Sans RESEND_API_KEY, l'envoi est ignoré (on retombe sur le lien à copier).

type SendResult = { sent: boolean; error?: string };

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

// --- Palette de marque Ozance ---------------------------------------------
const BRAND = {
  navy: "#0B1220",
  ink: "#111827",
  muted: "#6B7280",
  faint: "#9AA3B2",
  gold: "#B08D57",
  line: "#E7E9EE",
  bg: "#F4F5F7",
  card: "#FFFFFF",
};

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// Gabarit d'email responsive et compatible clients mail (tables + styles inline).
function emailLayout(opts: {
  preview: string;
  bodyHtml: string;
  footerNote?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(opts.preview)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <!-- En-tête / wordmark -->
          <tr>
            <td style="padding:4px 8px 20px;">
              <span style="font-family:${FONT};font-size:20px;font-weight:700;letter-spacing:0.18em;color:${BRAND.navy};text-transform:uppercase;">Ozance</span>
              <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${BRAND.gold};margin-left:2px;vertical-align:2px;"></span>
            </td>
          </tr>
          <!-- Carte -->
          <tr>
            <td style="background:${BRAND.card};border:1px solid ${BRAND.line};border-radius:16px;padding:36px 36px 32px;font-family:${FONT};">
              ${opts.bodyHtml}
            </td>
          </tr>
          <!-- Pied -->
          <tr>
            <td style="padding:22px 12px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${BRAND.faint};">
              ${opts.footerNote ? `<p style="margin:0 0 8px;">${opts.footerNote}</p>` : ""}
              <p style="margin:0;">Ozance — la plateforme de gestion des cabinets d'avocats.</p>
              <p style="margin:4px 0 0;">Cet email vous a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Bouton d'action principal (style « bulletproof »).
function button(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 6px;">
    <tr><td style="border-radius:12px;background:${BRAND.navy};">
      <a href="${url}" style="display:inline-block;padding:14px 30px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;">${escapeHtml(label)}</a>
    </td></tr>
  </table>`;
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;font-weight:700;color:${BRAND.ink};">${escapeHtml(text)}</h1>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${BRAND.muted};">${text}</p>`;
}

function fallbackLink(url: string): string {
  return `<p style="margin:22px 0 0;padding-top:18px;border-top:1px solid ${BRAND.line};font-size:12px;line-height:1.6;color:${BRAND.faint};">
    Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :<br>
    <span style="word-break:break-all;color:${BRAND.muted};">${url}</span>
  </p>`;
}

async function send(payload: Record<string, unknown>): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, error: "no_api_key" };
  const from = process.env.EMAIL_FROM ?? "Ozance <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, ...payload }),
    });
    if (!res.ok) return { sent: false, error: await res.text() };
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : "send_failed" };
  }
}

// --- Email de bienvenue (après création du cabinet) ------------------------
export async function sendWelcomeEmail(opts: {
  to: string;
  prenom?: string | null;
  cabinetNom: string;
  appUrl: string;
}): Promise<SendResult> {
  const prenom = opts.prenom?.trim().split(" ")[0];
  const hello = prenom ? `Bonjour ${escapeHtml(prenom)},` : "Bonjour,";
  const cabinet = escapeHtml(opts.cabinetNom);

  const body = `
    ${h1("Bienvenue sur Ozance 👋")}
    ${p(`${hello}`)}
    ${p(`Votre cabinet <strong style="color:${BRAND.ink}">${cabinet}</strong> est créé. Vous pouvez dès maintenant centraliser vos clients, dossiers, échéances, temps passé et votre facturation sur un seul espace.`)}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 4px;width:100%;">
      <tr><td style="font-size:14px;line-height:1.7;color:${BRAND.muted};">
        ✦ Créez vos premiers clients et dossiers<br>
        ✦ Suivez vos échéances dans l'agenda<br>
        ✦ Chronométrez votre temps et facturez en quelques clics<br>
        ✦ Invitez vos collaborateurs
      </td></tr>
    </table>
    ${button(opts.appUrl, "Accéder à mon espace")}
    ${p(`<span style="font-size:13px;">Une question ? Répondez simplement à cet email, notre équipe vous accompagne.</span>`)}
  `;

  return send({
    to: opts.to,
    subject: `Bienvenue sur Ozance, ${cabinet} est prêt`,
    html: emailLayout({
      preview: "Votre cabinet est créé — démarrez sur Ozance.",
      bodyHtml: body,
    }),
  });
}

// --- Invitation d'un collaborateur ----------------------------------------
export async function sendInvitationEmail(opts: {
  to: string;
  cabinetNom: string;
  roleLabel: string;
  url: string;
}): Promise<SendResult> {
  const cabinet = escapeHtml(opts.cabinetNom);
  const role = escapeHtml(opts.roleLabel);

  const body = `
    ${h1(`Rejoignez ${cabinet}`)}
    ${p(`Vous avez été invité à rejoindre <strong style="color:${BRAND.ink}">${cabinet}</strong> sur Ozance en tant que <strong style="color:${BRAND.ink}">${role}</strong>.`)}
    ${p("Cliquez ci-dessous pour créer votre compte ou vous connecter et accéder à l'espace du cabinet.")}
    ${button(opts.url, "Rejoindre le cabinet")}
    ${p(`<span style="font-size:13px;">Ce lien est valable 14 jours.</span>`)}
    ${fallbackLink(opts.url)}
  `;

  return send({
    to: opts.to,
    subject: `Invitation à rejoindre ${opts.cabinetNom} sur Ozance`,
    html: emailLayout({
      preview: `${opts.cabinetNom} vous invite sur Ozance.`,
      bodyHtml: body,
    }),
  });
}

// --- Notification interne : nouvelle demande « Parler à un conseiller » -----
export async function sendLeadEmail(lead: {
  nom: string;
  cabinet: string | null;
  email: string;
  telephone: string | null;
  message: string | null;
}): Promise<SendResult> {
  const to = process.env.CONTACT_EMAIL ?? "contact@ozance.fr";

  const row = (label: string, value: string | null) =>
    value
      ? `<tr><td style="padding:6px 16px 6px 0;color:${BRAND.faint};font-size:14px;">${label}</td><td style="padding:6px 0;font-weight:600;font-size:14px;color:${BRAND.ink};">${escapeHtml(value)}</td></tr>`
      : "";

  const body = `
    ${h1("Nouvelle demande de conseiller")}
    <table role="presentation" cellpadding="0" cellspacing="0" style="font-family:${FONT};margin:6px 0;">
      ${row("Nom", lead.nom)}
      ${row("Cabinet", lead.cabinet)}
      ${row("Email", lead.email)}
      ${row("Téléphone", lead.telephone)}
    </table>
    ${
      lead.message
        ? `<p style="margin:16px 0 0;padding:14px 16px;background:${BRAND.bg};border-radius:10px;font-size:14px;line-height:1.6;color:${BRAND.muted};white-space:pre-wrap;">${escapeHtml(lead.message)}</p>`
        : ""
    }
  `;

  return send({
    to,
    reply_to: lead.email,
    subject: `Conseiller — ${lead.nom}${lead.cabinet ? ` (${lead.cabinet})` : ""}`,
    html: emailLayout({
      preview: `Demande de ${lead.nom}`,
      bodyHtml: body,
    }),
  });
}

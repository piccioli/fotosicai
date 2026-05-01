const nodemailer = require('nodemailer');

let _transport = null;

function getTransport() {
  if (_transport) return _transport;

  const host = process.env.SMTP_HOST;
  if (!host) return null;

  const secure = process.env.SMTP_SECURE === 'true';
  const port = parseInt(process.env.SMTP_PORT || (secure ? '465' : '587'), 10);

  const auth =
    process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
      : undefined;

  _transport = nodemailer.createTransport({ host, port, secure, auth });
  return _transport;
}

async function sendVerificationEmail({ to, photoId, token, titolo }) {
  const transport = getTransport();
  if (!transport) {
    console.warn('[mailer] SMTP_HOST non configurato — email di verifica non inviata');
    return;
  }

  const PUBLIC_BASE = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
  const verifyUrl = `${PUBLIC_BASE}/api/verify/${token}`;
  const from = process.env.MAIL_FROM || 'Foto SICAI <noreply@fotosicai.it>';

  const text = `Ciao,

hai caricato la foto "${titolo}" su FotoSICAI.

Per confermare la tua email, clicca il link qui sotto:
${verifyUrl}

Il link è valido per ${process.env.EMAIL_VERIFICATION_TTL_HOURS || 24} ore.

Dopo la conferma, la foto verrà sottoposta a validazione da parte di un amministratore prima di essere pubblicata sulla mappa.

Una volta verificata, la tua email sarà ricordata per ${process.env.EMAIL_VERIFICATION_TRUST_DAYS || 30} giorni: nelle prossime foto che caricherai non dovrai ripetere questo passaggio.

— Il team di Foto SICAI`;

  const html = `<p>Ciao,</p>
<p>hai caricato la foto <strong>"${titolo}"</strong> su FotoSICAI.</p>
<p>Per confermare la tua email, clicca il pulsante qui sotto:</p>
<p style="margin:24px 0">
  <a href="${verifyUrl}" style="background:#2e7d32;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
    Conferma la tua email
  </a>
</p>
<p style="font-size:13px;color:#666">
  Oppure copia questo link nel browser:<br>
  <a href="${verifyUrl}">${verifyUrl}</a>
</p>
<p style="font-size:13px;color:#666">
  Il link è valido per ${process.env.EMAIL_VERIFICATION_TTL_HOURS || 24} ore.<br>
  Dopo la conferma, la foto verrà sottoposta a validazione da parte di un amministratore prima di essere pubblicata sulla mappa.<br>
  Una volta verificata, la tua email sarà ricordata per ${process.env.EMAIL_VERIFICATION_TRUST_DAYS || 30} giorni:
  nelle prossime foto che caricherai non dovrai ripetere questo passaggio.
</p>
<hr style="border:none;border-top:1px solid #eee;margin:24px 0">
<p style="font-size:11px;color:#aaa">Foto SICAI — Sentiero Italia CAI</p>`;

  await transport.sendMail({ from, to, subject: 'Conferma la tua foto su FotoSICAI', text, html });
}

module.exports = { sendVerificationEmail };

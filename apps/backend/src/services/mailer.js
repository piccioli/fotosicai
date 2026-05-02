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

async function sendVerificationEmail({
  to, token,
  autoreNome, socioCai, sezioneCai, ruoloCai,
  referenteSicai, referenteSicaiAmbito, marketingConsent,
}) {
  const transport = getTransport();
  if (!transport) {
    console.warn('[mailer] SMTP_HOST non configurato — email di verifica non inviata');
    return;
  }

  const PUBLIC_BASE = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
  const verifyUrl = `${PUBLIC_BASE}/api/verify/${token}`;
  const from = process.env.MAIL_FROM || 'Foto SICAI <noreply@fotosicai.it>';
  const ttlHours = process.env.EMAIL_VERIFICATION_TTL_HOURS || 24;
  const trustDays = process.env.EMAIL_VERIFICATION_TRUST_DAYS || 30;

  // Build user profile summary
  const profileLines = [];
  profileLines.push(`Nome / Autore: ${autoreNome || '—'}`);
  if (socioCai) {
    profileLines.push(`Socio CAI: Sì`);
    if (sezioneCai) profileLines.push(`Sezione CAI: ${sezioneCai}`);
    if (ruoloCai)   profileLines.push(`Ruolo / Titolo: ${ruoloCai}`);
    if (referenteSicai) {
      profileLines.push(`Referente SICAI: Sì${referenteSicaiAmbito ? ` (${referenteSicaiAmbito})` : ''}`);
    }
  } else {
    profileLines.push(`Socio CAI: No`);
  }

  const consentLines = [];
  consentLines.push('✓ Consenso alla pubblicazione con licenza CC BY 4.0 e cessione diritti al CAI: accettato');
  consentLines.push(`${marketingConsent ? '✓' : '✗'} Autorizzazione a essere ricontattato da Montagna Servizi SCPA: ${marketingConsent ? 'accettata' : 'non accettata'}`);

  const profileBlock = profileLines.join('\n');
  const consentBlock = consentLines.join('\n');

  const profileHtml = profileLines.map((l) => `<li>${l}</li>`).join('');
  const consentHtml = consentLines.map((l) => `<li>${l}</li>`).join('');

  const text = `Ciao ${autoreNome || ''},

grazie per aver caricato le tue foto su FotoSICAI, la piattaforma fotografica del Sentiero Italia CAI.

Per confermare la tua email e inviare tutte le foto in approvazione, clicca il link qui sotto:
${verifyUrl}

Il link è valido per ${ttlHours} ore.
Cliccando il link verranno confermate tutte le foto caricate con questa email.
Dopo la conferma, le foto verranno sottoposte a validazione da parte del team SICAI prima di essere pubblicate.

Una volta verificata, la tua email sarà ricordata per ${trustDays} giorni: nelle prossime foto che caricherai non dovrai ripetere questo passaggio.

---
I TUOI DATI (step 1)
${profileBlock}

CONSENSI
${consentBlock}
---

— Il team di Foto SICAI

---
Foto SICAI — Sentiero Italia CAI — Montagna Servizi SCPA
Servizi affidati per il Piano Progetto Sentiero Italia CAI (CIG B165634123, 2024–2026)`;

  const html = `
<p>Ciao <strong>${autoreNome || ''}</strong>,</p>
<p>grazie per aver caricato le tue foto su <strong>FotoSICAI</strong>, la piattaforma fotografica del <strong>Sentiero Italia CAI</strong>.</p>

<p>Per confermare la tua email e inviare tutte le foto in approvazione, clicca il pulsante qui sotto:</p>
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
  Il link è valido per ${ttlHours} ore.<br>
  Cliccando il link verranno confermate tutte le foto caricate con questa email.<br>
  Dopo la conferma, le foto verranno sottoposte a validazione da parte del <strong>team SICAI</strong>
  prima di essere pubblicate sulla mappa.<br>
  Una volta verificata, la tua email sarà ricordata per ${trustDays} giorni:
  nelle prossime foto che caricherai non dovrai ripetere questo passaggio.
</p>

<hr style="border:none;border-top:1px solid #eee;margin:24px 0">

<p style="font-size:13px;color:#444"><strong>I tuoi dati (step 1)</strong></p>
<ul style="font-size:13px;color:#444;line-height:1.8;margin:0 0 16px 0;padding-left:20px">
  ${profileHtml}
</ul>

<p style="font-size:13px;color:#444"><strong>Consensi accettati</strong></p>
<ul style="font-size:13px;color:#444;line-height:1.8;margin:0 0 16px 0;padding-left:20px">
  ${consentHtml}
</ul>

<hr style="border:none;border-top:1px solid #eee;margin:24px 0">
<p style="font-size:11px;color:#aaa">
  Foto SICAI — Sentiero Italia CAI — Montagna Servizi SCPA<br>
  Servizi affidati per il Piano Progetto Sentiero Italia CAI (CIG B165634123, 2024–2026)
</p>`;

  await transport.sendMail({ from, to, subject: 'Conferma la tua email su FotoSICAI', text, html });
}

module.exports = { sendVerificationEmail };

const crypto = require('crypto');

function getSessionSecret() {
  if (process.env.ADMIN_SESSION_SECRET) return process.env.ADMIN_SESSION_SECRET;
  if (!global._ephemeralSessionSecret) {
    global._ephemeralSessionSecret = crypto.randomBytes(32).toString('hex');
    console.warn('[auth] ADMIN_SESSION_SECRET non impostato — uso segreto effimero (le sessioni scadono al riavvio)');
  }
  return global._ephemeralSessionSecret;
}

function signSessionToken(username) {
  const exp = Date.now() + 8 * 60 * 60 * 1000; // 8 hours
  const payload = Buffer.from(JSON.stringify({ sub: username, exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
  return { token: `${payload}.${sig}`, expiresAt: new Date(exp).toISOString() };
}

function verifySessionToken(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const dot = raw.lastIndexOf('.');
  if (dot < 1) return null;
  const payload = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expectedSig = crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
  } catch { return null; }
  let parsed;
  try { parsed = JSON.parse(Buffer.from(payload, 'base64url').toString()); } catch { return null; }
  if (!parsed.sub || !parsed.exp || Date.now() > parsed.exp) return null;
  return parsed;
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = header.slice(7);

  // Legacy ADMIN_TOKEN
  const staticToken = process.env.ADMIN_TOKEN;
  if (staticToken) {
    try {
      if (token.length === staticToken.length &&
          crypto.timingSafeEqual(Buffer.from(token), Buffer.from(staticToken))) {
        return next();
      }
    } catch { /* length mismatch — fall through */ }
  }

  // Session token
  const parsed = verifySessionToken(token);
  if (parsed) { req.adminUser = parsed.sub; return next(); }

  return res.status(401).json({ error: 'Unauthorized' });
}

module.exports = { requireAdmin, signSessionToken, verifySessionToken };

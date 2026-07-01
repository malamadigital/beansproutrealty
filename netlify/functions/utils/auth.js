import crypto from "node:crypto";

const MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours

export const COOKIE_NAMES = {
  admin: "bs_admin_auth",
  client: "bs_client_auth"
};

function getSecret() {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "change-me-please";
}

// extra is the clientId for client-role tokens, empty string for admin.
export function signToken(role, extra = "") {
  const payload = `${role}|${extra}|${Date.now()}`;
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return `${encoded}.${sig}`;
}

// Returns { role, clientId } if valid and matches expectedRole, otherwise null.
export function verifyToken(token, expectedRole) {
  if (!token) return null;
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return null;

  const encoded = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);

  let payload;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch (e) {
    return null;
  }

  const expectedSig = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");

  if (sig !== expectedSig) return null;

  const parts = payload.split("|");
  if (parts.length !== 3) return null;
  const [role, extra, ts] = parts;

  if (role !== expectedRole) return null;

  const age = Date.now() - Number(ts);
  if (!(age >= 0 && age < MAX_AGE_MS)) return null;

  return { role, clientId: extra || null };
}

export function getCookie(req, name) {
  const header = req.headers.get("cookie") || "";
  const match = header
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(name + "="));
  return match ? match.split("=")[1] : null;
}

export function buildSetCookie(cookieName, token) {
  const maxAgeSeconds = Math.floor(MAX_AGE_MS / 1000);
  return `${cookieName}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAgeSeconds}`;
}

export function buildClearCookie(cookieName) {
  return `${cookieName}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

// Returns { role: 'admin', clientId: null } or { role: 'client', clientId: '...' } or null.
export function getAuthContext(req) {
  const adminToken = getCookie(req, COOKIE_NAMES.admin);
  const adminResult = verifyToken(adminToken, "admin");
  if (adminResult) return { role: "admin", clientId: null };

  const clientToken = getCookie(req, COOKIE_NAMES.client);
  const clientResult = verifyToken(clientToken, "client");
  if (clientResult) return { role: "client", clientId: clientResult.clientId };

  return null;
}

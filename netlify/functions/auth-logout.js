import { buildClearCookie, COOKIE_NAMES } from "./utils/auth.js";

export default async (req) => {
  const url = new URL(req.url);
  const role = url.searchParams.get("role");

  if (role !== "admin" && role !== "client") {
    return new Response(JSON.stringify({ error: "Missing or invalid role" }), { status: 400 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": buildClearCookie(COOKIE_NAMES[role])
    }
  });
};

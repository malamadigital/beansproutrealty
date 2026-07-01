import { getAuthContext } from "./utils/auth.js";

export default async (req) => {
  const url = new URL(req.url);
  const role = url.searchParams.get("role");

  if (role !== "admin" && role !== "client") {
    return new Response(JSON.stringify({ error: "Missing or invalid role" }), { status: 400 });
  }

  const ctx = getAuthContext(req);
  const authenticated = !!ctx && ctx.role === role;

  return new Response(JSON.stringify({ authenticated }), {
    headers: { "Content-Type": "application/json" }
  });
};

import { getStore } from "@netlify/blobs";
import { signToken, buildSetCookie, COOKIE_NAMES } from "./utils/auth.js";
import { verifyPassword } from "./utils/password.js";

const CLIENTS_STORE = "clients-directory";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400 });
  }

  const { role } = body;

  if (role === "admin") {
    const correctPassword = process.env.ADMIN_PASSWORD;

    if (!correctPassword) {
      return new Response(
        JSON.stringify({ error: "Server not configured — set ADMIN_PASSWORD in Netlify env vars" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!body.password || body.password !== correctPassword) {
      return new Response(JSON.stringify({ error: "Incorrect password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const token = signToken("admin", "");
    return new Response(JSON.stringify({ ok: true, role: "admin" }), {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": buildSetCookie(COOKIE_NAMES.admin, token)
      }
    });
  }

  if (role === "client") {
    const { username, password } = body;

    if (!username || !password) {
      return new Response(JSON.stringify({ error: "Username and password are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const store = getStore({ name: CLIENTS_STORE, consistency: "strong" });
    let clients = [];
    try {
      clients = (await store.get("index", { type: "json" })) || [];
    } catch (e) {
      clients = [];
    }

    const usernameLower = username.trim().toLowerCase();
    const client = clients.find((c) => c.username.toLowerCase() === usernameLower);

    if (!client || !verifyPassword(password, client.salt, client.hash)) {
      return new Response(JSON.stringify({ error: "Incorrect username or password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const token = signToken("client", client.id);
    return new Response(JSON.stringify({ ok: true, role: "client", name: client.name }), {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": buildSetCookie(COOKIE_NAMES.client, token)
      }
    });
  }

  return new Response(JSON.stringify({ error: "Invalid role" }), { status: 400 });
};

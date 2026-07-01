import { getStore } from "@netlify/blobs";
import { getAuthContext } from "./utils/auth.js";
import { hashPassword } from "./utils/password.js";

const STORE_NAME = "clients-directory";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const ctx = getAuthContext(req);
  if (!ctx || ctx.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400 });
  }

  const { name, username, password } = body;

  if (!name || !username || !password) {
    return new Response(JSON.stringify({ error: "Name, username, and password are all required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const store = getStore({ name: STORE_NAME, consistency: "strong" });
  let clients = [];
  try {
    clients = (await store.get("index", { type: "json" })) || [];
  } catch (e) {
    clients = [];
  }

  const usernameLower = username.trim().toLowerCase();
  if (clients.some((c) => c.username.toLowerCase() === usernameLower)) {
    return new Response(JSON.stringify({ error: "That username is already taken" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { salt, hash } = hashPassword(password);
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  clients.push({
    id,
    name: name.trim(),
    username: username.trim(),
    salt,
    hash,
    createdAt: new Date().toISOString()
  });

  await store.setJSON("index", clients);

  return new Response(JSON.stringify({ ok: true, id }), {
    headers: { "Content-Type": "application/json" }
  });
};

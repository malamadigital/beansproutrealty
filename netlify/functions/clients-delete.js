import { getStore } from "@netlify/blobs";
import { getAuthContext } from "./utils/auth.js";

const STORE_NAME = "clients-directory";

export default async (req) => {
  if (req.method !== "POST" && req.method !== "DELETE") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const ctx = getAuthContext(req);
  if (!ctx || ctx.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  let id;
  try {
    const body = await req.json();
    id = body.id;
  } catch (e) {
    const url = new URL(req.url);
    id = url.searchParams.get("id");
  }

  if (!id) {
    return new Response(JSON.stringify({ error: "Missing id" }), { status: 400 });
  }

  const store = getStore({ name: STORE_NAME, consistency: "strong" });
  let clients = [];
  try {
    clients = (await store.get("index", { type: "json" })) || [];
  } catch (e) {
    clients = [];
  }

  clients = clients.filter((c) => c.id !== id);
  await store.setJSON("index", clients);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" }
  });
};

import { getStore } from "@netlify/blobs";
import { getAuthContext } from "./utils/auth.js";

const STORE_NAME = "client-files";
const CLIENTS_STORE = "clients-directory";
const MAX_BYTES = 5 * 1024 * 1024; // 5MB per file

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const ctx = getAuthContext(req);
  if (!ctx || ctx.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized — please log in" }), {
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

  const { name, size, type, dataBase64, clientId } = body;

  if (!name || !dataBase64) {
    return new Response(JSON.stringify({ error: "Missing file name or data" }), { status: 400 });
  }

  if (!clientId) {
    return new Response(JSON.stringify({ error: "Please select a client to assign this file to" }), {
      status: 400
    });
  }

  if (size && size > MAX_BYTES) {
    return new Response(JSON.stringify({ error: "File exceeds 5MB limit" }), { status: 400 });
  }

  // Validate the client actually exists, and grab their name for display.
  const clientsStore = getStore({ name: CLIENTS_STORE, consistency: "strong" });
  let clients = [];
  try {
    clients = (await clientsStore.get("index", { type: "json" })) || [];
  } catch (e) {
    clients = [];
  }
  const client = clients.find((c) => c.id === clientId);
  if (!client) {
    return new Response(JSON.stringify({ error: "Selected client no longer exists" }), { status: 400 });
  }

  const store = getStore({ name: STORE_NAME, consistency: "strong" });

  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const buffer = Buffer.from(dataBase64, "base64");

  if (buffer.length > MAX_BYTES) {
    return new Response(JSON.stringify({ error: "File exceeds 5MB limit" }), { status: 400 });
  }

  await store.set(id, buffer, {
    metadata: { name, contentType: type || "application/octet-stream" }
  });

  let index = [];
  try {
    index = (await store.get("index", { type: "json" })) || [];
  } catch (e) {
    index = [];
  }

  index.push({
    id,
    name,
    size: size || buffer.length,
    type: type || "application/octet-stream",
    date: new Date().toISOString(),
    clientId: client.id,
    clientName: client.name
  });

  await store.setJSON("index", index);

  return new Response(JSON.stringify({ ok: true, id }), {
    headers: { "Content-Type": "application/json" }
  });
};

import { getStore } from "@netlify/blobs";

const STORE_NAME = "client-files";
const MAX_BYTES = 5 * 1024 * 1024; // 5MB per file

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

  const { name, size, type, dataBase64 } = body;

  if (!name || !dataBase64) {
    return new Response(JSON.stringify({ error: "Missing file name or data" }), { status: 400 });
  }

  if (size && size > MAX_BYTES) {
    return new Response(JSON.stringify({ error: "File exceeds 5MB limit" }), { status: 400 });
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
    date: new Date().toISOString()
  });

  await store.setJSON("index", index);

  return new Response(JSON.stringify({ ok: true, id }), {
    headers: { "Content-Type": "application/json" }
  });
};

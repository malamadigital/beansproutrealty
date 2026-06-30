import { getStore } from "@netlify/blobs";

const STORE_NAME = "client-files";

export default async (req) => {
  if (req.method !== "POST" && req.method !== "DELETE") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
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

  await store.delete(id);

  let index = [];
  try {
    index = (await store.get("index", { type: "json" })) || [];
  } catch (e) {
    index = [];
  }

  index = index.filter((f) => f.id !== id);
  await store.setJSON("index", index);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" }
  });
};

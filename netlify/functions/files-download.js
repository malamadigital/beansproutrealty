import { getStore } from "@netlify/blobs";
import { getAuthContext } from "./utils/auth.js";

const STORE_NAME = "client-files";

export default async (req) => {
  const ctx = getAuthContext(req);
  if (!ctx) {
    return new Response("Unauthorized — please log in", { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  const store = getStore({ name: STORE_NAME, consistency: "strong" });

  // Ownership check: a client can only download their own files.
  if (ctx.role === "client") {
    let index = [];
    try {
      index = (await store.get("index", { type: "json" })) || [];
    } catch (e) {
      index = [];
    }
    const record = index.find((f) => f.id === id);
    if (!record || record.clientId !== ctx.clientId) {
      return new Response("File not found", { status: 404 });
    }
  }

  const result = await store.getWithMetadata(id, { type: "arrayBuffer" });
  if (!result) {
    return new Response("File not found", { status: 404 });
  }

  const { data, metadata } = result;

  return new Response(data, {
    headers: {
      "Content-Type": metadata?.contentType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${metadata?.name || "file"}"`
    }
  });
};

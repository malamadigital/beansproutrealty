import { getStore } from "@netlify/blobs";
import { getAuthContext } from "./utils/auth.js";

const STORE_NAME = "clients-directory";

export default async (req) => {
  const ctx = getAuthContext(req);
  if (!ctx || ctx.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
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

  // Never expose password hashes/salts to the browser
  const safe = clients.map(({ id, name, username, createdAt }) => ({ id, name, username, createdAt }));

  return new Response(JSON.stringify(safe), {
    headers: { "Content-Type": "application/json" }
  });
};

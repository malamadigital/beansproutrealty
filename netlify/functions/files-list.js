import { getStore } from "@netlify/blobs";
import { getAuthContext } from "./utils/auth.js";

const STORE_NAME = "client-files";

export default async (req) => {
  const ctx = getAuthContext(req);
  if (!ctx) {
    return new Response(JSON.stringify({ error: "Unauthorized — please log in" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const store = getStore({ name: STORE_NAME, consistency: "strong" });
  let index = [];
  try {
    index = (await store.get("index", { type: "json" })) || [];
  } catch (e) {
    index = [];
  }

  // Admins see everything; clients only see files assigned to them.
  const visible = ctx.role === "admin" ? index : index.filter((f) => f.clientId === ctx.clientId);

  return new Response(JSON.stringify(visible), {
    headers: { "Content-Type": "application/json" }
  });
};

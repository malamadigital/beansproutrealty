import { getStore } from "@netlify/blobs";

const STORE_NAME = "client-files";

export default async () => {
  const store = getStore({ name: STORE_NAME, consistency: "strong" });

  let index = [];
  try {
    index = (await store.get("index", { type: "json" })) || [];
  } catch (e) {
    index = [];
  }

  return new Response(JSON.stringify(index), {
    headers: { "Content-Type": "application/json" }
  });
};

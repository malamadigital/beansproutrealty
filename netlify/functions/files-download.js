import { getStore } from "@netlify/blobs";

const STORE_NAME = "client-files";

export default async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  const store = getStore({ name: STORE_NAME, consistency: "strong" });

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

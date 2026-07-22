import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// gte-small: 384-dim sentence embeddings, runs natively in the edge runtime
const session = new Supabase.ai.Session("gte-small");

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }
  let texts: unknown;
  try {
    ({ texts } = await req.json());
  } catch {
    return new Response(JSON.stringify({ error: "invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!Array.isArray(texts) || texts.length === 0 || texts.length > 64) {
    return new Response(
      JSON.stringify({ error: "texts must be a non-empty array of strings (max 64)" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  const embeddings: number[][] = [];
  for (const t of texts) {
    const vec = await session.run(String(t).slice(0, 4000), {
      mean_pool: true,
      normalize: true,
    });
    embeddings.push(Array.from(vec as Iterable<number>));
  }
  return new Response(JSON.stringify({ embeddings }), {
    headers: { "Content-Type": "application/json" },
  });
});

const EMBED_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/embed`;
const BATCH_SIZE = 32;

/** Embed texts via the Supabase Edge Function (gte-small, 384 dims). */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const res = await fetch(EMBED_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ texts: batch }),
    });
    if (!res.ok) {
      throw new Error(`Embedding service error (${res.status}): ${await res.text()}`);
    }
    const { embeddings } = (await res.json()) as { embeddings: number[][] };
    out.push(...embeddings);
  }
  return out;
}

export async function embedQuery(text: string): Promise<number[]> {
  const [vec] = await embedTexts([text]);
  return vec;
}

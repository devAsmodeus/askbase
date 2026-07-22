const TARGET_CHARS = 1200;
const OVERLAP_CHARS = 200;
const MIN_CHUNK_CHARS = 40;

/**
 * Paragraph-aware chunker: packs paragraphs up to ~TARGET_CHARS, carrying an
 * overlap tail into the next chunk so answers don't lose cross-paragraph context.
 */
export function chunkText(raw: string): string[] {
  const text = raw.replace(/\r\n/g, "\n").replace(/\t/g, " ").trim();
  if (!text) return [];

  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .flatMap((p) => (p.length > TARGET_CHARS ? splitLong(p) : [p]));

  const chunks: string[] = [];
  let current = "";
  for (const p of paragraphs) {
    if (current && current.length + p.length + 2 > TARGET_CHARS) {
      chunks.push(current.trim());
      current = current.slice(-OVERLAP_CHARS) + "\n\n";
    }
    current += (current.endsWith("\n\n") || current === "" ? "" : "\n\n") + p;
  }
  if (current.trim().length >= MIN_CHUNK_CHARS || chunks.length === 0) {
    if (current.trim()) chunks.push(current.trim());
  }
  return chunks;
}

function splitLong(p: string): string[] {
  // Split an oversized paragraph on sentence boundaries, hard-wrap as fallback.
  const sentences = p.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? [p];
  const parts: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if (cur && cur.length + s.length > TARGET_CHARS) {
      parts.push(cur.trim());
      cur = "";
    }
    if (s.length > TARGET_CHARS) {
      for (let i = 0; i < s.length; i += TARGET_CHARS) {
        parts.push(s.slice(i, i + TARGET_CHARS).trim());
      }
    } else {
      cur += s;
    }
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts.filter(Boolean);
}

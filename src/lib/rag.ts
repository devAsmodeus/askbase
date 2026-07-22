import Anthropic from "@anthropic-ai/sdk";

export interface ChunkMatch {
  content: string;
  document_name: string;
  similarity: number;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface Source {
  document: string;
  similarity: number;
}

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";
const MIN_SIMILARITY = 0.72;

export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function sourcesFromMatches(matches: ChunkMatch[]): Source[] {
  const seen = new Map<string, number>();
  for (const m of matches) {
    const prev = seen.get(m.document_name);
    if (prev === undefined || m.similarity > prev) seen.set(m.document_name, m.similarity);
  }
  return [...seen.entries()].map(([document, similarity]) => ({
    document,
    similarity: Math.round(similarity * 100) / 100,
  }));
}

/**
 * Produce a streaming answer. With ANTHROPIC_API_KEY set, generates with
 * Claude over the retrieved context; otherwise falls back to demo mode that
 * returns the most relevant passages verbatim.
 */
export function answerStream(opts: {
  botName: string;
  customPrompt: string;
  question: string;
  history: ChatTurn[];
  matches: ChunkMatch[];
}): ReadableStream<Uint8Array> {
  return aiEnabled() ? aiStream(opts) : demoStream(opts);
}

function aiStream({
  botName,
  customPrompt,
  question,
  history,
  matches,
}: Parameters<typeof answerStream>[0]): ReadableStream<Uint8Array> {
  const client = new Anthropic();
  const encoder = new TextEncoder();

  const context = matches
    .map((m, i) => `<passage index="${i + 1}" source="${m.document_name}">\n${m.content}\n</passage>`)
    .join("\n\n");

  const system = [
    `You are "${botName}", a helpful support assistant embedded on a company's website.`,
    `Answer the visitor's question using ONLY the knowledge-base passages below.`,
    `If the passages don't contain the answer, say you don't know and suggest contacting the team — never invent facts.`,
    `Be concise and friendly. Use Markdown when it helps (lists, bold, code).`,
    customPrompt ? `Additional instructions from the bot owner:\n${customPrompt}` : "",
    `\n<knowledge_base>\n${context || "(no relevant passages found)"}\n</knowledge_base>`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const messages: Anthropic.MessageParam[] = [
    ...history.slice(-10).map((t) => ({ role: t.role, content: t.content })),
    { role: "user" as const, content: question },
  ];

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: MODEL,
          max_tokens: 1024,
          system,
          messages,
        });
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            "\n\nSorry — I hit an error generating the answer. Please try again."
          )
        );
        console.error("Anthropic stream error:", err);
      } finally {
        controller.close();
      }
    },
  });
}

function demoStream({
  matches,
}: Parameters<typeof answerStream>[0]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const good = matches.filter((m) => m.similarity >= MIN_SIMILARITY).slice(0, 3);
  const shown = good.length > 0 ? good : matches.slice(0, 2);

  let text: string;
  if (shown.length === 0) {
    text =
      "I couldn't find anything relevant in the knowledge base yet. Try uploading documents that cover this topic.";
  } else {
    text =
      "**Demo mode** — no AI key configured, so here are the most relevant passages from the docs:\n\n" +
      shown
        .map(
          (m) =>
            `> ${m.content.slice(0, 600).replace(/\n/g, "\n> ")}\n> \n> — *${m.document_name}*`
        )
        .join("\n\n") +
      "\n\n*Add an `ANTHROPIC_API_KEY` to get full AI-generated answers.*";
  }

  // Simulate streaming so the UI behaves identically in both modes.
  const words = text.split(/(?<=\s)/);
  return new ReadableStream({
    async start(controller) {
      for (let i = 0; i < words.length; i += 8) {
        controller.enqueue(encoder.encode(words.slice(i, i + 8).join("")));
        await new Promise((r) => setTimeout(r, 30));
      }
      controller.close();
    },
  });
}

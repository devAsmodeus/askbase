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

/** OpenAI-compatible fallback (Ollama, OpenWebUI, vLLM, LM Studio, …). */
const LOCAL_LLM_BASE_URL = process.env.LOCAL_LLM_BASE_URL?.replace(/\/$/, "");
const LOCAL_LLM_MODEL = process.env.LOCAL_LLM_MODEL || "llama3.1";

export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || LOCAL_LLM_BASE_URL);
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
 * Produce a streaming answer. Provider priority:
 * 1. ANTHROPIC_API_KEY → Claude
 * 2. LOCAL_LLM_BASE_URL → any OpenAI-compatible server (Ollama, OpenWebUI, vLLM…)
 * 3. neither → demo mode (most relevant passages verbatim)
 */
export function answerStream(opts: {
  botName: string;
  customPrompt: string;
  question: string;
  history: ChatTurn[];
  matches: ChunkMatch[];
}): ReadableStream<Uint8Array> {
  if (process.env.ANTHROPIC_API_KEY) return aiStream(opts);
  if (LOCAL_LLM_BASE_URL) return localStream(opts);
  return demoStream(opts);
}

function buildSystemPrompt({
  botName,
  customPrompt,
  matches,
}: Pick<Parameters<typeof answerStream>[0], "botName" | "customPrompt" | "matches">): string {
  const context = matches
    .map((m, i) => `<passage index="${i + 1}" source="${m.document_name}">\n${m.content}\n</passage>`)
    .join("\n\n");

  return [
    `You are "${botName}", a helpful support assistant embedded on a company's website.`,
    `Answer the visitor's question using ONLY the knowledge-base passages below.`,
    `If the passages don't contain the answer, say you don't know and suggest contacting the team — never invent facts.`,
    `Be concise and friendly. Use Markdown when it helps (lists, bold, code).`,
    customPrompt ? `Additional instructions from the bot owner:\n${customPrompt}` : "",
    `\n<knowledge_base>\n${context || "(no relevant passages found)"}\n</knowledge_base>`,
  ]
    .filter(Boolean)
    .join("\n\n");
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

  const system = buildSystemPrompt({ botName, customPrompt, matches });

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

/** Streams from any OpenAI-compatible /chat/completions endpoint (Ollama, OpenWebUI, vLLM, LM Studio). */
function localStream({
  botName,
  customPrompt,
  question,
  history,
  matches,
}: Parameters<typeof answerStream>[0]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const messages = [
    { role: "system", content: buildSystemPrompt({ botName, customPrompt, matches }) },
    ...history.slice(-10),
    { role: "user", content: question },
  ];

  return new ReadableStream({
    async start(controller) {
      try {
        const res = await fetch(`${LOCAL_LLM_BASE_URL}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(process.env.LOCAL_LLM_API_KEY
              ? { Authorization: `Bearer ${process.env.LOCAL_LLM_API_KEY}` }
              : {}),
          },
          body: JSON.stringify({
            model: LOCAL_LLM_MODEL,
            messages,
            stream: true,
            max_tokens: 1024,
          }),
        });
        if (!res.ok || !res.body) {
          throw new Error(`local LLM responded ${res.status}: ${await res.text()}`);
        }

        const reader = res.body.getReader();
        let buffer = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const data = line.trim().replace(/^data:\s*/, "");
            if (!data || data === "[DONE]" || !line.startsWith("data:")) continue;
            try {
              const delta: string | undefined =
                JSON.parse(data).choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {
              // Ignore malformed keep-alive lines.
            }
          }
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            "\n\nSorry — I hit an error generating the answer. Please try again."
          )
        );
        console.error("Local LLM stream error:", err);
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
            `> ${m.content.slice(0, 1200).replace(/\n/g, "\n> ")}\n> \n> — *${m.document_name}*`
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

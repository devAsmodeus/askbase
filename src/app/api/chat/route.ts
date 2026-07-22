import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embedQuery } from "@/lib/embeddings";
import {
  answerStream,
  aiEnabled,
  sourcesFromMatches,
  type ChunkMatch,
  type ChatTurn,
} from "@/lib/rag";

export const maxDuration = 120;

/**
 * Playground chat (dashboard). Streams: first line = JSON meta
 * {sources, mode}, then the raw answer text.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.botId || typeof body.question !== "string" || !body.question.trim()) {
    return NextResponse.json({ error: "botId and question are required" }, { status: 400 });
  }
  const question = body.question.trim().slice(0, 4000);
  const history: ChatTurn[] = Array.isArray(body.history)
    ? body.history
        .filter(
          (t: ChatTurn) =>
            (t.role === "user" || t.role === "assistant") && typeof t.content === "string"
        )
        .slice(-10)
    : [];

  const { data: bot } = await supabase
    .from("bots")
    .select("id, public_id, name, system_prompt")
    .eq("id", body.botId)
    .single();
  if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

  let matches: ChunkMatch[] = [];
  try {
    const vec = await embedQuery(question);
    const { data, error } = await supabase.rpc("match_chunks", {
      p_public_id: bot.public_id,
      p_query: JSON.stringify(vec),
      p_count: 6,
    });
    if (error) throw new Error(error.message);
    matches = (data ?? []) as ChunkMatch[];
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Retrieval failed" },
      { status: 500 }
    );
  }

  const meta = JSON.stringify({
    sources: sourcesFromMatches(matches),
    mode: aiEnabled() ? "ai" : "demo",
  });

  const answer = answerStream({
    botName: bot.name,
    customPrompt: bot.system_prompt ?? "",
    question,
    history,
    matches,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(meta + "\n"));
      const reader = answer.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        controller.enqueue(value);
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

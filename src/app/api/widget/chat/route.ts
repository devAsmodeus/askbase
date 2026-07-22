import { NextRequest, NextResponse } from "next/server";
import { createAnonClient } from "@/lib/supabase/server";
import { embedQuery } from "@/lib/embeddings";
import {
  answerStream,
  aiEnabled,
  sourcesFromMatches,
  type ChunkMatch,
  type ChatTurn,
} from "@/lib/rag";

export const maxDuration = 120;

interface WidgetBot {
  name: string;
  welcome_message: string;
  accent_color: string;
  allowed_domains: string[];
  show_branding: boolean;
}

/**
 * Public chat endpoint used by the embeddable widget iframe.
 * Streams: first line = JSON meta {conversationId, sources, mode}, then answer text.
 */
export async function POST(req: NextRequest) {
  const supabase = createAnonClient();

  const body = await req.json().catch(() => null);
  const publicId = typeof body?.publicId === "string" ? body.publicId : "";
  const question =
    typeof body?.question === "string" ? body.question.trim().slice(0, 2000) : "";
  if (!publicId || !question) {
    return NextResponse.json({ error: "publicId and question are required" }, { status: 400 });
  }
  const history: ChatTurn[] = Array.isArray(body.history)
    ? body.history
        .filter(
          (t: ChatTurn) =>
            (t.role === "user" || t.role === "assistant") && typeof t.content === "string"
        )
        .slice(-8)
    : [];

  const { data: botData } = await supabase.rpc("widget_get_bot", {
    p_public_id: publicId,
  });
  const bot = botData as WidgetBot | null;
  if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

  // Domain allowlist (MVP: based on the embedding page origin reported by the loader)
  const parentOrigin = typeof body?.parentOrigin === "string" ? body.parentOrigin : "";
  if (bot.allowed_domains.length > 0) {
    const host = safeHost(parentOrigin);
    const ok =
      host !== null &&
      bot.allowed_domains.some(
        (d) => host === normalizeDomain(d) || host.endsWith("." + normalizeDomain(d))
      );
    // Allow the app's own origin so "Preview" and the landing demo always work
    const own = safeHost(process.env.NEXT_PUBLIC_APP_URL ?? "");
    if (!ok && host !== own) {
      return NextResponse.json(
        { error: "This chatbot is not enabled for this website." },
        { status: 403 }
      );
    }
  }

  // Monthly quota
  const { data: quota } = await supabase.rpc("consume_widget_message", {
    p_public_id: publicId,
  });
  if (!quota?.allowed) {
    const msg =
      quota?.reason === "quota_exceeded"
        ? "This chatbot has reached its monthly message limit."
        : "Chatbot unavailable.";
    return NextResponse.json({ error: msg, code: quota?.reason }, { status: 429 });
  }

  let matches: ChunkMatch[] = [];
  try {
    const vec = await embedQuery(question);
    const { data, error } = await supabase.rpc("match_chunks", {
      p_public_id: publicId,
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

  // Conversation logging
  let conversationId: string | null =
    typeof body?.conversationId === "string" && body.conversationId ? body.conversationId : null;
  if (!conversationId) {
    const { data } = await supabase.rpc("widget_start_conversation", {
      p_public_id: publicId,
      p_visitor_id: typeof body?.visitorId === "string" ? body.visitorId.slice(0, 64) : null,
    });
    conversationId = (data as string | null) ?? null;
  }
  if (conversationId) {
    await supabase.rpc("widget_log_message", {
      p_public_id: publicId,
      p_conversation: conversationId,
      p_role: "user",
      p_content: question,
    });
  }

  const sources = sourcesFromMatches(matches);
  const meta = JSON.stringify({
    conversationId,
    sources,
    mode: aiEnabled() ? "ai" : "demo",
  });

  const answer = answerStream({
    botName: bot.name,
    customPrompt: "",
    question,
    history,
    matches,
  });

  const encoder = new TextEncoder();
  let fullAnswer = "";
  const decoder = new TextDecoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(meta + "\n"));
      const reader = answer.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        fullAnswer += decoder.decode(value, { stream: true });
        controller.enqueue(value);
      }
      controller.close();
      if (conversationId && fullAnswer) {
        await supabase.rpc("widget_log_message", {
          p_public_id: publicId,
          p_conversation: conversationId,
          p_role: "assistant",
          p_content: fullAnswer,
          p_sources: sources,
        });
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

function safeHost(origin: string): string | null {
  try {
    return new URL(origin).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function normalizeDomain(d: string): string {
  return d
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
}

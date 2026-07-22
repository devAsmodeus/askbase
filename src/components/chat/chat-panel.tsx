"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SendHorizonal, FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChatSource {
  document: string;
  similarity: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  pending?: boolean;
}

interface ChatPanelProps {
  botName: string;
  welcomeMessage: string;
  accentColor: string;
  showBranding?: boolean;
  placeholder?: string;
  /** Sends a question; must return the streaming Response (meta line + text). */
  send: (
    question: string,
    history: { role: "user" | "assistant"; content: string }[],
    conversationId: string | null
  ) => Promise<Response>;
  className?: string;
  emptyHint?: React.ReactNode;
}

export function ChatPanel({
  botName,
  welcomeMessage,
  accentColor,
  showBranding = false,
  placeholder = "Ask a question…",
  send,
  className,
  emptyHint,
}: ChatPanelProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const conversationRef = React.useRef<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const question = input.trim();
    if (!question || busy) return;
    setInput("");
    setBusy(true);

    const history = messages
      .filter((m) => !m.pending)
      .map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [
      ...prev,
      { role: "user", content: question },
      { role: "assistant", content: "", pending: true },
    ]);

    try {
      const res = await send(question, history, conversationRef.current);
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Something went wrong" }));
        setMessages((prev) =>
          prev.slice(0, -1).concat({
            role: "assistant",
            content: `⚠️ ${err.error ?? "Something went wrong. Please try again."}`,
          })
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let metaParsed = false;
      let sources: ChatSource[] = [];
      let answer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        if (!metaParsed) {
          const nl = buffer.indexOf("\n");
          if (nl === -1) continue;
          try {
            const meta = JSON.parse(buffer.slice(0, nl));
            sources = meta.sources ?? [];
            if (meta.conversationId) conversationRef.current = meta.conversationId;
          } catch {
            // tolerate malformed meta
          }
          buffer = buffer.slice(nl + 1);
          metaParsed = true;
        }
        answer = buffer;
        setMessages((prev) =>
          prev.slice(0, -1).concat({ role: "assistant", content: answer, pending: true })
        );
      }

      setMessages((prev) =>
        prev.slice(0, -1).concat({
          role: "assistant",
          content: answer || "…",
          sources: sources.length ? sources : undefined,
        })
      );
    } catch {
      setMessages((prev) =>
        prev.slice(0, -1).concat({
          role: "assistant",
          content: "⚠️ Network error. Please try again.",
        })
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("flex h-full flex-col bg-background", className)}>
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        <Bubble role="assistant" accentColor={accentColor}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{welcomeMessage}</ReactMarkdown>
        </Bubble>

        {messages.length === 0 && emptyHint}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <Bubble key={i} role="user" accentColor={accentColor}>
              {m.content}
            </Bubble>
          ) : (
            <Bubble key={i} role="assistant" accentColor={accentColor}>
              {m.pending && !m.content ? (
                <TypingDots />
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
              )}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 border-t pt-2">
                  {m.sources.map((s) => (
                    <span
                      key={s.document}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                      title={`similarity ${Math.round(s.similarity * 100)}%`}
                    >
                      <FileText className="size-3" />
                      {s.document}
                    </span>
                  ))}
                </div>
              )}
            </Bubble>
          )
        )}
      </div>

      <form onSubmit={handleSend} className="border-t p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder={placeholder}
            className="max-h-32 flex-1 resize-none rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2"
            style={{ ["--tw-ring-color" as string]: accentColor }}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Send"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white transition-opacity disabled:opacity-40"
            style={{ backgroundColor: accentColor }}
          >
            <SendHorizonal className="size-4" />
          </button>
        </div>
        {showBranding && (
          <a
            href="/"
            target="_blank"
            className="mt-2 flex items-center justify-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <Sparkles className="size-3" />
            Powered by AskBase
          </a>
        )}
      </form>
    </div>
  );
}

function Bubble({
  role,
  accentColor,
  children,
}: {
  role: "user" | "assistant";
  accentColor: string;
  children: React.ReactNode;
}) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md px-3.5 py-2.5 text-sm text-white"
          style={{ backgroundColor: accentColor }}
        >
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="prose prose-sm dark:prose-invert max-w-[90%] rounded-2xl rounded-bl-md border bg-muted/40 px-3.5 py-2.5 text-sm [&_p]:my-1.5 [&_pre]:my-2 [&_ul]:my-1.5 [&_ol]:my-1.5">
        {children}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}

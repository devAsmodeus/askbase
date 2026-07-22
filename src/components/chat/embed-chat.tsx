"use client";

import * as React from "react";
import { X } from "lucide-react";
import { ChatPanel } from "@/components/chat/chat-panel";

interface EmbedChatProps {
  publicId: string;
  name: string;
  welcomeMessage: string;
  accentColor: string;
  showBranding: boolean;
}

export function EmbedChat({
  publicId,
  name,
  welcomeMessage,
  accentColor,
  showBranding,
}: EmbedChatProps) {
  const [parentOrigin] = React.useState(() =>
    typeof window === "undefined"
      ? ""
      : (new URLSearchParams(window.location.search).get("parent") ?? "")
  );
  const [visitorId] = React.useState(() => {
    if (typeof window === "undefined") return "";
    let vid = localStorage.getItem("askbase_visitor_id");
    if (!vid) {
      vid = crypto.randomUUID();
      localStorage.setItem("askbase_visitor_id", vid);
    }
    return vid;
  });

  React.useEffect(() => {
    // Tint the launcher bubble on the host page
    window.parent?.postMessage({ type: "askbase:accent", color: accentColor }, "*");
  }, [accentColor]);

  const send = React.useCallback(
    (
      question: string,
      history: { role: "user" | "assistant"; content: string }[],
      conversationId: string | null
    ) =>
      fetch("/api/widget/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicId,
          question,
          history,
          conversationId,
          parentOrigin,
          visitorId,
        }),
      }),
    [publicId, parentOrigin, visitorId]
  );

  return (
    <div className="flex h-dvh flex-col">
      <header
        className="flex items-center justify-between px-4 py-3 text-white"
        style={{ backgroundColor: accentColor }}
      >
        <div>
          <div className="text-sm font-semibold">{name}</div>
          <div className="text-[11px] opacity-80">Usually replies instantly</div>
        </div>
        <button
          aria-label="Close chat"
          className="rounded-full p-1.5 transition-colors hover:bg-white/15"
          onClick={() => window.parent?.postMessage({ type: "askbase:close" }, "*")}
        >
          <X className="size-4" />
        </button>
      </header>
      <ChatPanel
        botName={name}
        welcomeMessage={welcomeMessage}
        accentColor={accentColor}
        showBranding={showBranding}
        send={send}
        className="flex-1"
      />
    </div>
  );
}

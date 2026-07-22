import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chunkText } from "@/lib/chunking";
import { embedTexts } from "@/lib/embeddings";
import { PLANS, type PlanId } from "@/lib/plans";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let botId: string;
  let name: string;
  let text: string;
  let sizeBytes: number;
  let sourceType: "file" | "text";

  const contentType = req.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      botId = String(form.get("botId") ?? "");
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }
      name = file.name;
      sizeBytes = file.size;
      sourceType = "file";
      const buf = new Uint8Array(await file.arrayBuffer());
      if (file.name.toLowerCase().endsWith(".pdf")) {
        const { extractText, getDocumentProxy } = await import("unpdf");
        const pdf = await getDocumentProxy(buf);
        const extracted = await extractText(pdf, { mergePages: true });
        text = extracted.text;
      } else {
        text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
      }
    } else {
      const body = await req.json();
      botId = String(body.botId ?? "");
      name = String(body.name ?? "Pasted text").slice(0, 120);
      text = String(body.text ?? "");
      sizeBytes = new TextEncoder().encode(text).length;
      sourceType = "text";
    }
  } catch {
    return NextResponse.json({ error: "Could not read the uploaded content" }, { status: 400 });
  }

  if (!botId) return NextResponse.json({ error: "botId is required" }, { status: 400 });
  if (!text.trim()) {
    return NextResponse.json(
      { error: "The document appears to be empty (no extractable text)" },
      { status: 400 }
    );
  }

  // Ownership check (RLS also enforces this on every query below)
  const { data: bot } = await supabase
    .from("bots")
    .select("id")
    .eq("id", botId)
    .single();
  if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

  // Plan limits
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();
  const plan = PLANS[(profile?.plan ?? "free") as PlanId];
  if (sizeBytes > plan.maxDocBytes) {
    return NextResponse.json(
      { error: `File exceeds the ${Math.round(plan.maxDocBytes / 1024 / 1024)} MB limit of your ${plan.name} plan`, code: "plan_limit" },
      { status: 402 }
    );
  }
  const { count } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("bot_id", botId);
  if ((count ?? 0) >= plan.maxDocsPerBot) {
    return NextResponse.json(
      { error: `Your ${plan.name} plan allows ${plan.maxDocsPerBot} documents per bot. Upgrade to add more.`, code: "plan_limit" },
      { status: 402 }
    );
  }

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({
      bot_id: botId,
      owner_id: user.id,
      name,
      source_type: sourceType,
      size_bytes: sizeBytes,
      status: "processing",
    })
    .select()
    .single();
  if (docError || !doc) {
    return NextResponse.json({ error: docError?.message ?? "Insert failed" }, { status: 500 });
  }

  try {
    const chunks = chunkText(text);
    if (chunks.length === 0) throw new Error("No text chunks produced");
    const embeddings = await embedTexts(chunks);

    const rows = chunks.map((content, idx) => ({
      document_id: doc.id,
      bot_id: botId,
      owner_id: user.id,
      idx,
      content,
      embedding: JSON.stringify(embeddings[idx]),
    }));
    // Insert in batches to stay under request size limits
    for (let i = 0; i < rows.length; i += 50) {
      const { error } = await supabase.from("chunks").insert(rows.slice(i, i + 50));
      if (error) throw new Error(error.message);
    }

    await supabase
      .from("documents")
      .update({ status: "ready", chunk_count: chunks.length })
      .eq("id", doc.id);

    return NextResponse.json({ id: doc.id, status: "ready", chunks: chunks.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed";
    await supabase
      .from("documents")
      .update({ status: "error", error: message })
      .eq("id", doc.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

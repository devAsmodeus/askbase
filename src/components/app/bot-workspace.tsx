"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Plan } from "@/lib/plans";
import { formatBytes } from "@/lib/plans";
import { ChatPanel } from "@/components/chat/chat-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  ClipboardCopy,
  ExternalLink,
  FileText,
  FileUp,
  Loader2,
  MessagesSquare,
  Trash2,
  TriangleAlert,
} from "lucide-react";

interface BotRow {
  id: string;
  public_id: string;
  name: string;
  description: string;
  system_prompt: string;
  welcome_message: string;
  accent_color: string;
  allowed_domains: string[];
}

interface DocumentRow {
  id: string;
  name: string;
  source_type: string;
  size_bytes: number;
  status: string;
  error: string | null;
  chunk_count: number;
  created_at: string;
}

export function BotWorkspace({
  bot,
  initialDocuments,
  plan,
  appUrl,
}: {
  bot: BotRow;
  initialDocuments: DocumentRow[];
  plan: Plan;
  appUrl: string;
}) {
  const [documents, setDocuments] = React.useState(initialDocuments);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href="/app" aria-label="Back to chatbots">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <span
          className="flex size-9 items-center justify-center rounded-lg text-white"
          style={{ backgroundColor: bot.accent_color }}
        >
          <MessagesSquare className="size-4" />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight">{bot.name}</h1>
          <p className="truncate text-xs text-muted-foreground">
            {documents.filter((d) => d.status === "ready").length} documents ready ·{" "}
            {documents.reduce((n, d) => n + d.chunk_count, 0)} knowledge chunks
          </p>
        </div>
      </div>

      <Tabs defaultValue="knowledge">
        <TabsList>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="playground">Playground</TabsTrigger>
          <TabsTrigger value="embed">Embed</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge" className="mt-4">
          <KnowledgeTab
            bot={bot}
            documents={documents}
            setDocuments={setDocuments}
            plan={plan}
          />
        </TabsContent>
        <TabsContent value="playground" className="mt-4">
          <PlaygroundTab bot={bot} hasDocs={documents.some((d) => d.status === "ready")} />
        </TabsContent>
        <TabsContent value="embed" className="mt-4">
          <EmbedTab bot={bot} appUrl={appUrl} />
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <SettingsTab bot={bot} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------------------------- Knowledge ---------------------------------- */

function KnowledgeTab({
  bot,
  documents,
  setDocuments,
  plan,
}: {
  bot: BotRow;
  documents: DocumentRow[];
  setDocuments: React.Dispatch<React.SetStateAction<DocumentRow[]>>;
  plan: Plan;
}) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [pasteOpen, setPasteOpen] = React.useState(false);
  const [pasteName, setPasteName] = React.useState("");
  const [pasteText, setPasteText] = React.useState("");

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase
      .from("documents")
      .select("id, name, source_type, size_bytes, status, error, chunk_count, created_at")
      .eq("bot_id", bot.id)
      .order("created_at", { ascending: false });
    if (data) setDocuments(data);
    router.refresh();
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > plan.maxDocBytes) {
      toast.error(
        `“${file.name}” is larger than the ${formatBytes(plan.maxDocBytes)} limit of your ${plan.name} plan.`
      );
      return;
    }
    setUploading(true);
    const toastId = toast.loading(`Processing “${file.name}”…`);
    try {
      const form = new FormData();
      form.set("botId", bot.id);
      form.set("file", file);
      const res = await fetch("/api/ingest", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      toast.success(`“${file.name}” ready — ${json.chunks} chunks indexed`, { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed", { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      refresh();
    }
  }

  async function handlePaste(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);
    const toastId = toast.loading("Indexing text…");
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botId: bot.id,
          name: pasteName.trim() || "Pasted text",
          text: pasteText,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Indexing failed");
      toast.success(`Text indexed — ${json.chunks} chunks`, { id: toastId });
      setPasteOpen(false);
      setPasteName("");
      setPasteText("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Indexing failed", { id: toastId });
    } finally {
      setUploading(false);
      refresh();
    }
  }

  async function handleDelete(doc: DocumentRow) {
    const supabase = createClient();
    const { error } = await supabase.from("documents").delete().eq("id", doc.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`“${doc.name}” removed`);
    refresh();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add knowledge</CardTitle>
          <CardDescription>
            Upload PDF, Markdown or plain-text files — or paste text directly.{" "}
            {documents.length}/{plan.maxDocsPerBot} documents used, up to{" "}
            {formatBytes(plan.maxDocBytes)} each.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,.markdown,.csv,.json,.html"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || documents.length >= plan.maxDocsPerBot}
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileUp className="size-4" />
            )}
            Upload file
          </Button>
          <Dialog open={pasteOpen} onOpenChange={setPasteOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                disabled={uploading || documents.length >= plan.maxDocsPerBot}
              >
                <FileText className="size-4" />
                Paste text
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Paste text</DialogTitle>
                <DialogDescription>
                  FAQ answers, product descriptions, policies — anything your bot should know.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handlePaste} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="paste-name">Title</Label>
                  <Input
                    id="paste-name"
                    placeholder="e.g. Shipping FAQ"
                    maxLength={120}
                    value={pasteName}
                    onChange={(e) => setPasteName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="paste-text">Text</Label>
                  <Textarea
                    id="paste-text"
                    rows={8}
                    className="max-h-60"
                    required
                    placeholder="Paste your content here…"
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={uploading || !pasteText.trim()}>
                    {uploading && <Loader2 className="size-4 animate-spin" />}
                    Index text
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          {documents.length >= plan.maxDocsPerBot && (
            <Button asChild variant="ghost" className="text-muted-foreground">
              <Link href="/app/billing">Upgrade for more documents →</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {documents.length > 0 && (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Chunks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="max-w-64">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate font-medium">{doc.name}</span>
                    </div>
                    {doc.status === "error" && doc.error && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                        <TriangleAlert className="size-3" /> {doc.error}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatBytes(doc.size_bytes)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{doc.chunk_count}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        doc.status === "ready"
                          ? "secondary"
                          : doc.status === "error"
                            ? "destructive"
                            : "outline"
                      }
                    >
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${doc.name}`}
                      onClick={() => handleDelete(doc)}
                    >
                      <Trash2 className="size-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

/* ---------------------------------- Playground ---------------------------------- */

function PlaygroundTab({ bot, hasDocs }: { bot: BotRow; hasDocs: boolean }) {
  const send = React.useCallback(
    (
      question: string,
      history: { role: "user" | "assistant"; content: string }[]
    ) =>
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId: bot.id, question, history }),
      }),
    [bot.id]
  );

  return (
    <Card className="overflow-hidden py-0">
      <div className="h-[560px]">
        <ChatPanel
          botName={bot.name}
          welcomeMessage={bot.welcome_message}
          accentColor={bot.accent_color}
          send={send}
          placeholder="Test your bot — ask something from your docs…"
          emptyHint={
            !hasDocs ? (
              <p className="px-2 text-center text-xs text-muted-foreground">
                This bot has no ready documents yet — add knowledge first, then test it here.
              </p>
            ) : undefined
          }
        />
      </div>
    </Card>
  );
}

/* ---------------------------------- Embed ---------------------------------- */

function EmbedTab({ bot, appUrl }: { bot: BotRow; appUrl: string }) {
  const snippet = `<script src="${appUrl}/widget.js" data-bot-id="${bot.public_id}" async></script>`;
  const [copied, setCopied] = React.useState(false);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add to your website</CardTitle>
          <CardDescription>
            Paste this one line before the closing <code>&lt;/body&gt;</code> tag. The chat
            bubble appears in the bottom-right corner of every page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
            <code>{snippet}</code>
          </pre>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={async () => {
                await navigator.clipboard.writeText(snippet);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? <Check className="size-4" /> : <ClipboardCopy className="size-4" />}
              {copied ? "Copied" : "Copy snippet"}
            </Button>
            <Button asChild variant="outline">
              <a href={`/embed/${bot.public_id}`} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                Open chat preview
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">How it works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ol className="list-decimal space-y-1.5 pl-4">
            <li>The script renders a floating chat button on your site.</li>
            <li>Visitors ask questions; answers come only from your uploaded documents.</li>
            <li>
              Restrict which sites can use the widget in{" "}
              <span className="font-medium text-foreground">Settings → Allowed domains</span>.
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------------------------- Settings ---------------------------------- */

function SettingsTab({ bot }: { bot: BotRow }) {
  const router = useRouter();
  const [form, setForm] = React.useState({
    name: bot.name,
    description: bot.description,
    welcome_message: bot.welcome_message,
    system_prompt: bot.system_prompt,
    accent_color: bot.accent_color,
    allowed_domains: bot.allowed_domains.join(", "),
  });
  const [saving, setSaving] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("bots")
      .update({
        name: form.name.trim(),
        description: form.description.trim(),
        welcome_message: form.welcome_message.trim(),
        system_prompt: form.system_prompt.trim(),
        accent_color: form.accent_color,
        allowed_domains: form.allowed_domains
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean),
      })
      .eq("id", bot.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Settings saved");
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("bots").delete().eq("id", bot.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`“${bot.name}” deleted`);
    router.push("/app");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bot settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="s-name">Name</Label>
                <Input
                  id="s-name"
                  required
                  maxLength={60}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-color">Accent color</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="s-color"
                    type="color"
                    className="size-9 cursor-pointer rounded-md border bg-background p-1"
                    value={form.accent_color}
                    onChange={(e) => set("accent_color", e.target.value)}
                  />
                  <Input
                    aria-label="Accent color hex"
                    className="w-28"
                    value={form.accent_color}
                    onChange={(e) => set("accent_color", e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-desc">Description</Label>
              <Input
                id="s-desc"
                maxLength={200}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-welcome">Welcome message</Label>
              <Textarea
                id="s-welcome"
                rows={2}
                required
                value={form.welcome_message}
                onChange={(e) => set("welcome_message", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-prompt">Custom instructions (optional)</Label>
              <Textarea
                id="s-prompt"
                rows={3}
                placeholder="e.g. Always answer in French. Direct refund questions to billing@acme.com."
                value={form.system_prompt}
                onChange={(e) => set("system_prompt", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Added to the AI prompt when generating answers.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-domains">Allowed domains (optional)</Label>
              <Input
                id="s-domains"
                placeholder="acme.com, docs.acme.com — leave empty to allow all"
                value={form.allowed_domains}
                onChange={(e) => set("allowed_domains", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated. When set, the widget only answers on these websites.
              </p>
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Danger zone</CardTitle>
          <CardDescription>
            Deleting a bot removes its documents, knowledge and conversations permanently.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="size-4" />
                Delete this bot
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Delete “{bot.name}”?</DialogTitle>
                <DialogDescription>
                  This cannot be undone. The embedded widget will stop working immediately.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting && <Loader2 className="size-4 animate-spin" />}
                  Delete permanently
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}

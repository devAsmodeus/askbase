"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

export function CreateBotDialog({
  botCount,
  maxBots,
}: {
  botCount: number;
  maxBots: number;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const atLimit = botCount >= maxBots;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("bots")
      .insert({ owner_id: user!.id, name: name.trim(), description: description.trim() })
      .select("id")
      .single();
    setBusy(false);
    if (error) {
      toast.error(
        error.message.includes("plan_limit")
          ? "Plan limit reached — upgrade to create more bots."
          : error.message
      );
      return;
    }
    setOpen(false);
    router.push(`/app/bots/${data.id}`);
    router.refresh();
  }

  if (atLimit) {
    return (
      <Button asChild variant="outline">
        <Link href="/app/billing">
          <Plus className="size-4" />
          Upgrade to add bots
        </Link>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New chatbot
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a chatbot</DialogTitle>
          <DialogDescription>
            Give it a name — you&apos;ll add knowledge in the next step.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bot-name">Name</Label>
            <Input
              id="bot-name"
              required
              maxLength={60}
              placeholder="e.g. Acme Support"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bot-desc">Description (optional)</Label>
            <Textarea
              id="bot-desc"
              rows={2}
              maxLength={200}
              placeholder="What will this bot help with?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy || !name.trim()}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              Create chatbot
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PLANS, type PlanId } from "@/lib/plans";
import { BotWorkspace } from "@/components/app/bot-workspace";

export default async function BotPage({
  params,
}: {
  params: Promise<{ botId: string }>;
}) {
  const { botId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: bot }, { data: profile }] = await Promise.all([
    supabase.from("bots").select("*").eq("id", botId).single(),
    supabase.from("profiles").select("plan").eq("id", user!.id).single(),
  ]);
  if (!bot) notFound();

  const { data: documents } = await supabase
    .from("documents")
    .select("id, name, source_type, size_bytes, status, error, chunk_count, created_at")
    .eq("bot_id", botId)
    .order("created_at", { ascending: false });

  const plan = PLANS[(profile?.plan ?? "free") as PlanId];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <BotWorkspace
      bot={bot}
      initialDocuments={documents ?? []}
      plan={plan}
      appUrl={appUrl}
    />
  );
}

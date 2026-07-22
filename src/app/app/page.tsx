import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PLANS, type PlanId } from "@/lib/plans";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateBotDialog } from "@/components/app/create-bot-dialog";
import { Bot, FileText, MessagesSquare } from "lucide-react";

export default async function BotsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: bots }, { data: profile }, { data: usage }] = await Promise.all([
    supabase
      .from("bots")
      .select("id, name, description, accent_color, created_at, documents(count)")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("plan").eq("id", user!.id).single(),
    supabase
      .from("usage_counters")
      .select("messages")
      .eq("period", new Date().toISOString().slice(0, 7))
      .maybeSingle(),
  ]);

  const plan = PLANS[(profile?.plan ?? "free") as PlanId];
  const botList = bots ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Chatbots</h1>
          <p className="text-sm text-muted-foreground">
            {botList.length} of {plan.maxBots} bots on the {plan.name} plan ·{" "}
            {usage?.messages ?? 0}/{plan.maxMessagesPerMonth} widget messages this month
          </p>
        </div>
        <CreateBotDialog botCount={botList.length} maxBots={plan.maxBots} />
      </div>

      {botList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950">
              <Bot className="size-6 text-indigo-500" />
            </span>
            <div>
              <p className="font-medium">Create your first chatbot</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Upload your docs, FAQs or guides — AskBase turns them into a chatbot
                you can embed on any website in one line of code.
              </p>
            </div>
            <CreateBotDialog botCount={0} maxBots={plan.maxBots} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {botList.map((bot) => {
            const docCount =
              (bot.documents as unknown as { count: number }[])?.[0]?.count ?? 0;
            return (
              <Link key={bot.id} href={`/app/bots/${bot.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex size-9 items-center justify-center rounded-lg text-white"
                        style={{ backgroundColor: bot.accent_color }}
                      >
                        <MessagesSquare className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{bot.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {bot.description || "No description"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="gap-1 font-normal">
                        <FileText className="size-3" />
                        {docCount} {docCount === 1 ? "document" : "documents"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

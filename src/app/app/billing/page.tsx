import { createClient } from "@/lib/supabase/server";
import { PLANS, type PlanId } from "@/lib/plans";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PlanGrid } from "@/components/app/plan-grid";
import { Badge } from "@/components/ui/badge";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const period = new Date().toISOString().slice(0, 7);
  const [{ data: profile }, { data: usage }, { count: botCount }, { data: events }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("plan, billing_period_ends_at")
        .eq("id", user!.id)
        .single(),
      supabase
        .from("usage_counters")
        .select("messages")
        .eq("owner_id", user!.id)
        .eq("period", period)
        .maybeSingle(),
      supabase.from("bots").select("id", { count: "exact", head: true }),
      supabase
        .from("billing_events")
        .select("id, event_type, plan, amount_cents, card_last4, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const planId = (profile?.plan ?? "free") as PlanId;
  const plan = PLANS[planId];
  const used = usage?.messages ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Plan &amp; Billing</h1>
        <p className="text-sm text-muted-foreground">
          You&apos;re on the <span className="font-medium text-foreground">{plan.name}</span>{" "}
          plan
          {profile?.billing_period_ends_at && (
            <>
              {" "}
              · renews{" "}
              {new Date(profile.billing_period_ends_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </>
          )}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Widget messages this month</CardDescription>
            <CardTitle className="text-2xl">
              {used}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / {plan.maxMessagesPerMonth}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={Math.min(100, (used / plan.maxMessagesPerMonth) * 100)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Chatbots</CardDescription>
            <CardTitle className="text-2xl">
              {botCount ?? 0}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / {plan.maxBots}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={Math.min(100, ((botCount ?? 0) / plan.maxBots) * 100)} />
          </CardContent>
        </Card>
      </div>

      <PlanGrid currentPlan={planId} />

      {events && events.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Billing history</CardTitle>
            <CardDescription>
              Demo billing — no real charges are made in this MVP.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {events.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {e.event_type}
                  </Badge>
                  <span className="capitalize">{e.plan} plan</span>
                  {e.card_last4 && (
                    <span className="text-muted-foreground">•••• {e.card_last4}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>${(e.amount_cents / 100).toFixed(2)}/mo</span>
                  <span>
                    {new Date(e.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

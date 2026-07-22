import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PLANS, type PlanId } from "@/lib/plans";

/**
 * Mock billing: switches the plan and records a billing event.
 * No real charge happens — this simulates a successful checkout.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const plan = body?.plan as PlanId | undefined;
  if (!plan || !PLANS[plan]) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  }
  const cardLast4 =
    typeof body?.cardLast4 === "string" && /^\d{4}$/.test(body.cardLast4)
      ? body.cardLast4
      : null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();
  const currentPlan = (profile?.plan ?? "free") as PlanId;
  if (currentPlan === plan) {
    return NextResponse.json({ error: "You are already on this plan" }, { status: 400 });
  }
  if (plan !== "free" && !cardLast4) {
    return NextResponse.json({ error: "Payment card is required" }, { status: 400 });
  }

  const isUpgrade = PLANS[plan].priceMonthly > PLANS[currentPlan].priceMonthly;
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      plan,
      plan_started_at: now.toISOString(),
      billing_period_ends_at: plan === "free" ? null : periodEnd.toISOString(),
    })
    .eq("id", user.id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await supabase.from("billing_events").insert({
    owner_id: user.id,
    event_type: plan === "free" ? "cancel" : isUpgrade ? "upgrade" : "downgrade",
    plan,
    amount_cents: PLANS[plan].priceMonthly * 100,
    card_last4: cardLast4,
  });

  return NextResponse.json({ ok: true, plan });
}

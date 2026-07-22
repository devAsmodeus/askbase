"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PLANS, type Plan, type PlanId } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Check, Loader2, Lock } from "lucide-react";

export function PlanGrid({ currentPlan }: { currentPlan: PlanId }) {
  const router = useRouter();
  const [checkoutPlan, setCheckoutPlan] = React.useState<Plan | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function switchPlan(plan: Plan, cardLast4?: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.id, cardLast4 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not switch plan");
      toast.success(
        plan.id === "free"
          ? "Downgraded to Free"
          : `Welcome to ${plan.name}! Your new limits are active.`
      );
      setCheckoutPlan(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not switch plan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        {Object.values(PLANS).map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isUpgrade = plan.priceMonthly > PLANS[currentPlan].priceMonthly;
          return (
            <Card
              key={plan.id}
              className={plan.id === "pro" ? "border-indigo-400 shadow-sm" : undefined}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{plan.name}</span>
                  {plan.id === "pro" && <Badge>Most popular</Badge>}
                  {isCurrent && <Badge variant="secondary">Current plan</Badge>}
                </div>
                <div>
                  <span className="text-3xl font-semibold">${plan.priceMonthly}</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground">{plan.tagline}</p>
              </CardHeader>
              <CardContent className="flex h-full flex-col justify-between gap-4">
                <ul className="space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-indigo-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={isCurrent ? "outline" : isUpgrade ? "default" : "outline"}
                  disabled={isCurrent || busy}
                  onClick={() =>
                    plan.id === "free" ? switchPlan(plan) : setCheckoutPlan(plan)
                  }
                >
                  {isCurrent
                    ? "Current plan"
                    : plan.id === "free"
                      ? "Downgrade to Free"
                      : `Upgrade to ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <CheckoutDialog
        plan={checkoutPlan}
        busy={busy}
        onClose={() => setCheckoutPlan(null)}
        onConfirm={(last4) => checkoutPlan && switchPlan(checkoutPlan, last4)}
      />
    </>
  );
}

function CheckoutDialog({
  plan,
  busy,
  onClose,
  onConfirm,
}: {
  plan: Plan | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: (cardLast4: string) => void;
}) {
  const [card, setCard] = React.useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = React.useState("12/28");
  const [cvc, setCvc] = React.useState("123");

  const digits = card.replace(/\D/g, "");
  const valid = digits.length === 16 && /^\d{2}\/\d{2}$/.test(expiry) && /^\d{3,4}$/.test(cvc);

  return (
    <Dialog open={plan !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upgrade to {plan?.name}</DialogTitle>
          <DialogDescription>
            ${plan?.priceMonthly}/month, billed monthly. Cancel anytime.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onConfirm(digits.slice(-4));
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="cc-num">Card number</Label>
            <Input
              id="cc-num"
              inputMode="numeric"
              autoComplete="off"
              value={card}
              onChange={(e) => setCard(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cc-exp">Expiry</Label>
              <Input
                id="cc-exp"
                placeholder="MM/YY"
                autoComplete="off"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cc-cvc">CVC</Label>
              <Input
                id="cc-cvc"
                inputMode="numeric"
                autoComplete="off"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
              />
            </div>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3" />
            Demo checkout — no real payment is processed. Any test card works.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid || busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              Pay ${plan?.priceMonthly}/month
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

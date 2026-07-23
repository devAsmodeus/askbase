import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PLANS, type PlanId } from "@/lib/plans";
import { MessageSquareText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "@/components/app/user-menu";
import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();
  const plan = PLANS[(profile?.plan ?? "free") as PlanId];

  return (
    <div className="min-h-dvh bg-gradient-to-br from-indigo-100/60 via-background to-fuchsia-100/50 dark:from-indigo-950/40 dark:via-background dark:to-fuchsia-950/30">
      <header className="sticky top-3 z-40 px-4">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full border border-white/40 bg-background/60 px-5 shadow-lg shadow-indigo-500/5 backdrop-blur-xl dark:border-white/10">
          <div className="flex items-center gap-6">
            <Link href="/app" className="flex items-center gap-2 font-semibold">
              <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
                <MessageSquareText className="size-4" />
              </span>
              AskBase
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/app"
                className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Chatbots
              </Link>
              <Link
                href="/app/billing"
                className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Plan &amp; Billing
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/app/billing">
              <Badge
                variant={plan.id === "free" ? "secondary" : "default"}
                className={
                  plan.id === "free"
                    ? undefined
                    : "border-0 bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white"
                }
              >
                {plan.name}
              </Badge>
            </Link>
            <UserMenu email={user.email ?? ""} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <Toaster richColors position="top-right" />
    </div>
  );
}

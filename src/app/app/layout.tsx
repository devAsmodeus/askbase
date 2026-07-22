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
    <div className="min-h-dvh bg-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/app" className="flex items-center gap-2 font-semibold">
              <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-500 text-white">
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
              <Badge variant={plan.id === "free" ? "secondary" : "default"}>
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

import Link from "next/link";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PLANS } from "@/lib/plans";
import {
  ArrowRight,
  Check,
  Code2,
  FileUp,
  Globe,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

const FEATURES = [
  {
    icon: FileUp,
    title: "Feed it your docs",
    text: "Upload PDFs, Markdown or plain text — help centers, FAQs, product guides, policies. AskBase indexes everything in seconds.",
  },
  {
    icon: Sparkles,
    title: "Answers, not links",
    text: "Visitors ask in plain language and get direct answers generated from your content — with the source document cited every time.",
  },
  {
    icon: Code2,
    title: "One line to embed",
    text: "Copy a single script tag into your site and a polished chat bubble appears. No SDK, no build step, works everywhere.",
  },
  {
    icon: ShieldCheck,
    title: "Stays on-topic",
    text: "The bot only answers from your knowledge base. No hallucinated promises, and it says “I don't know” when your docs don't cover it.",
  },
  {
    icon: Globe,
    title: "Domain control",
    text: "Lock the widget to your domains so nobody else can embed your bot or burn through your message quota.",
  },
  {
    icon: Zap,
    title: "Live in minutes",
    text: "From sign-up to a working chatbot on your site in under five minutes. Test every change instantly in the built-in playground.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Upload your knowledge",
    text: "Drag in the docs your customers ask about. AskBase chunks and embeds them for semantic search.",
  },
  {
    n: "2",
    title: "Test in the playground",
    text: "Chat with your bot in a ChatGPT-style interface. Tune the welcome message, color and instructions.",
  },
  {
    n: "3",
    title: "Embed the widget",
    text: "Paste one script tag into your website. Your visitors get instant answers, 24/7.",
  },
];

export default function LandingPage() {
  const demoBotId = process.env.NEXT_PUBLIC_DEMO_BOT_ID;

  return (
    <div className="min-h-dvh bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-500 text-white">
              <MessageSquareText className="size-4" />
            </span>
            AskBase
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#how" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#pricing" className="transition-colors hover:text-foreground">
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login">Get started free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-20 text-center sm:pt-28">
        <Badge variant="secondary" className="mb-4">
          <Sparkles className="size-3" />
          RAG-powered answers with cited sources
        </Badge>
        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          Turn your docs into a chatbot your customers actually use
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
          Upload your knowledge base, get a ChatGPT-style assistant, and embed it on your
          website with one line of code. Your visitors get instant, accurate answers —
          you get fewer support tickets.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/login">
              Build your bot free
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#pricing">See pricing</a>
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Free plan · no credit card required
        </p>

        {/* Embed snippet demo */}
        <div className="mx-auto mt-14 max-w-2xl rounded-xl border bg-muted/40 p-4 text-left shadow-sm">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            The entire integration
          </p>
          <pre className="overflow-x-auto rounded-lg bg-background p-4 text-sm">
            <code>
              <span className="text-muted-foreground">&lt;</span>
              <span className="text-indigo-500">script</span>{" "}
              <span className="text-emerald-600">src</span>=
              <span className="text-amber-600">&quot;https://askbase.app/widget.js&quot;</span>{" "}
              <span className="text-emerald-600">data-bot-id</span>=
              <span className="text-amber-600">&quot;your-bot-id&quot;</span>{" "}
              <span className="text-emerald-600">async</span>
              <span className="text-muted-foreground">&gt;&lt;/</span>
              <span className="text-indigo-500">script</span>
              <span className="text-muted-foreground">&gt;</span>
            </code>
          </pre>
          {demoBotId && (
            <p className="mt-2 text-xs text-muted-foreground">
              Try it live — the chat bubble in the corner of this page is the widget itself.
            </p>
          )}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-semibold tracking-tight">
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            A focused tool that does one job well: answering your customers&apos; questions
            from your own content.
          </p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Card key={f.title}>
                <CardContent className="space-y-2.5 p-5">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950">
                    <f.icon className="size-4 text-indigo-500" />
                  </span>
                  <p className="font-medium">{f.title}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-semibold tracking-tight">
            Live on your site in three steps
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="text-center">
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-indigo-500 font-semibold text-white">
                  {s.n}
                </div>
                <p className="mt-4 font-medium">{s.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-semibold tracking-tight">
            Simple, honest pricing
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Start free. Upgrade when your bot starts pulling its weight.
          </p>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {Object.values(PLANS).map((plan) => (
              <Card
                key={plan.id}
                className={
                  plan.id === "pro" ? "relative border-indigo-400 shadow-md" : undefined
                }
              >
                {plan.id === "pro" && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    Most popular
                  </Badge>
                )}
                <CardContent className="flex h-full flex-col gap-4 p-6">
                  <div>
                    <p className="font-semibold">{plan.name}</p>
                    <p className="mt-1">
                      <span className="text-3xl font-semibold">${plan.priceMonthly}</span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                  </div>
                  <ul className="flex-1 space-y-2 text-sm">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-indigo-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant={plan.id === "pro" ? "default" : "outline"}>
                    <Link href="/login">
                      {plan.priceMonthly === 0 ? "Start free" : `Choose ${plan.name}`}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Your docs already have the answers.
            <br />
            Let them speak.
          </h2>
          <Button asChild size="lg" className="mt-8">
            <Link href="/login">
              Create your chatbot
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground sm:flex-row">
          <span className="flex items-center gap-2">
            <MessageSquareText className="size-4" />
            AskBase — chatbots from your docs
          </span>
          <span>Built as a product MVP demo. Billing is simulated.</span>
        </div>
      </footer>

      {demoBotId && (
        <Script src="/widget.js" data-bot-id={demoBotId} strategy="lazyOnload" />
      )}
    </div>
  );
}

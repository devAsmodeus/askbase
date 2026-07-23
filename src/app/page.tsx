import Link from "next/link";
import Script from "next/script";
import { SmoothScroll } from "@/components/landing/smooth-scroll";
import { Reveal, HeroReveal } from "@/components/landing/reveal";
import { ChatDemo } from "@/components/landing/chat-demo";
import { ParallaxLayer, Floating } from "@/components/landing/parallax";
import { PinnedSteps } from "@/components/landing/pinned-steps";
import { Marquee } from "@/components/landing/marquee";
import { ScrollProgress } from "@/components/landing/scroll-progress";
import { InteractiveBackground } from "@/components/landing/interactive-background";
import { ScrollBeam } from "@/components/landing/scroll-beam";
import { FileText, MessageCircleReply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PLANS } from "@/lib/plans";
import {
  ArrowRight,
  Check,
  Code2,
  FileUp,
  LockKeyhole,
  MessagesSquare,
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
    icon: MessagesSquare,
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
    icon: LockKeyhole,
    title: "Domain control",
    text: "Lock the widget to your domains so nobody else can embed your bot or burn through your message quota.",
  },
  {
    icon: Zap,
    title: "Live in minutes",
    text: "From sign-up to a working chatbot on your site in under five minutes. Test every change instantly in the built-in playground.",
  },
];

export default function LandingPage() {
  const demoBotId = process.env.NEXT_PUBLIC_DEMO_BOT_ID;

  return (
    <SmoothScroll>
    <div className="relative min-h-dvh overflow-x-clip">
      <InteractiveBackground />
      <ScrollBeam />
      <ScrollProgress />
      {/* Nav — floating glass pill */}
      <header className="sticky top-3 z-40 px-4">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between rounded-full border border-white/40 bg-background/55 px-5 shadow-lg shadow-indigo-500/5 backdrop-blur-xl dark:border-white/10">
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
            <Button
              asChild
              size="sm"
              className="rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.03]"
            >
              <Link href="/login">Get started free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-4 pb-20 pt-20 text-center sm:pt-28">
        {/* Floating decor cards (desktop only) */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 hidden xl:block">
          <ParallaxLayer drift={-60} className="absolute left-[-40px] top-40">
            <Floating duration={7}>
              <div className="flex items-center gap-2 rounded-xl border bg-background/90 px-3.5 py-2.5 text-sm shadow-lg backdrop-blur">
                <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950">
                  <FileText className="size-4 text-indigo-500" />
                </span>
                <span className="text-left leading-tight">
                  <span className="block font-medium">shipping-faq.pdf</span>
                  <span className="block text-xs text-emerald-600">✓ Indexed · 14 chunks</span>
                </span>
              </div>
            </Floating>
          </ParallaxLayer>
          <ParallaxLayer drift={-110} className="absolute right-[-30px] top-64">
            <Floating duration={8} delay={1.2}>
              <div className="flex items-center gap-2 rounded-xl border bg-background/90 px-3.5 py-2.5 text-sm shadow-lg backdrop-blur">
                <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
                  <MessageCircleReply className="size-4 text-emerald-600" />
                </span>
                <span className="text-left leading-tight">
                  <span className="block font-medium">1,284 answers</span>
                  <span className="block text-xs text-muted-foreground">this month · 0 tickets</span>
                </span>
              </div>
            </Floating>
          </ParallaxLayer>
        </div>
        <HeroReveal>
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="size-3" />
            RAG-powered answers with cited sources
          </Badge>
        </HeroReveal>
        <HeroReveal delay={0.08}>
          <h1 className="font-display mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Turn your docs into a{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-500 bg-clip-text text-transparent">
              chatbot
            </span>{" "}
            your customers actually use
          </h1>
        </HeroReveal>
        <HeroReveal delay={0.16}>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
            Upload your knowledge base, get a ChatGPT-style assistant, and embed it on your
            website with one line of code. Your visitors get instant, accurate answers —
            you get fewer support tickets.
          </p>
        </HeroReveal>
        <HeroReveal delay={0.24}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-7 text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.03] hover:shadow-xl hover:shadow-fuchsia-500/25"
            >
              <Link href="/login">
                Build your bot free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-white/50 bg-white/30 px-7 backdrop-blur-md transition-all hover:scale-[1.03] hover:bg-white/50 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <a href="#pricing">See pricing</a>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Free plan · no credit card required
          </p>
        </HeroReveal>

        {/* Embed snippet + live product demo */}
        <HeroReveal delay={0.32}>
          <div className="mx-auto mt-16 grid max-w-5xl items-stretch gap-6 text-left lg:grid-cols-2">
            <div className="flex flex-col justify-center gap-4">
              <div className="rounded-2xl border border-white/40 bg-background/60 p-4 shadow-sm backdrop-blur-md dark:border-white/10">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  The entire integration
                </p>
                <pre className="overflow-x-auto rounded-lg bg-background p-4 text-xs sm:text-[13px]">
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
              </div>
              <ul className="space-y-2.5 px-1 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-indigo-500" />
                  No SDK, no build step — one script tag and you&apos;re live
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-indigo-500" />
                  Answers come only from your docs, with sources cited
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-indigo-500" />
                  Matches your brand color automatically
                </li>
              </ul>
              {demoBotId && (
                <p className="px-1 text-xs text-muted-foreground">
                  Try it live — the chat bubble in the corner of this page is the widget
                  itself.
                </p>
              )}
            </div>
            <ParallaxLayer drift={-40}>
              <ChatDemo />
            </ParallaxLayer>
          </div>
        </HeroReveal>
      </section>

      {/* Ticker */}
      <Marquee />

      {/* Features */}
      <section id="features" className="relative py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
          <ParallaxLayer
            drift={120}
            className="absolute right-[10%] top-[-120px] h-[320px] w-[420px] rounded-full bg-indigo-500/8 blur-3xl"
          >
            <span />
          </ParallaxLayer>
        </div>
        <div className="relative mx-auto max-w-6xl px-4">
          <Reveal>
            <h2 className="font-display text-center text-3xl font-semibold tracking-tight sm:text-5xl">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
              A focused tool that does one job well: answering your customers&apos; questions
              from your own content.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 0.08} className="h-full">
                <Card className="group h-full rounded-2xl border-white/40 bg-background/65 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-background/80 hover:shadow-lg dark:border-white/10">
                  <CardContent className="space-y-3 p-5">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-md shadow-indigo-500/20 transition-transform duration-300 group-hover:scale-105">
                      <f.icon className="size-5" />
                    </span>
                    <p className="font-medium">{f.title}</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{f.text}</p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — pinned, scroll-scrubbed */}
      <PinnedSteps />

      {/* Pricing */}
      <section id="pricing" className="relative py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
          <ParallaxLayer
            drift={100}
            className="absolute left-[8%] top-[-100px] h-[300px] w-[380px] rounded-full bg-fuchsia-500/8 blur-3xl"
          >
            <span />
          </ParallaxLayer>
        </div>
        <div className="relative mx-auto max-w-6xl px-4">
          <Reveal>
            <h2 className="font-display text-center text-3xl font-semibold tracking-tight sm:text-5xl">
              Simple, honest pricing
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
              Start free. Upgrade when your bot starts pulling its weight.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {Object.values(PLANS).map((plan, i) => (
              <Reveal key={plan.id} delay={i * 0.08} className="relative h-full">
              {plan.id === "pro" && (
                <Badge className="absolute -top-2.5 left-1/2 z-10 -translate-x-1/2 border-0 bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white">
                  Most popular
                </Badge>
              )}
              <Card
                className={
                  plan.id === "pro"
                    ? "h-full rounded-2xl border-indigo-400/70 bg-background/75 shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    : "h-full rounded-2xl border-white/40 bg-background/65 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-background/80 hover:shadow-lg dark:border-white/10"
                }
              >
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
                  <Button
                    asChild
                    variant={plan.id === "pro" ? "default" : "outline"}
                    className={
                      plan.id === "pro"
                        ? "rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02]"
                        : "rounded-full border-white/50 bg-white/30 backdrop-blur transition-all hover:scale-[1.02] hover:bg-white/50 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
                    }
                  >
                    <Link href="/login">
                      {plan.priceMonthly === 0 ? "Start free" : `Choose ${plan.name}`}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <Reveal>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Your docs already have the answers.
              <br />
              <span className="bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-500 bg-clip-text text-transparent">
                Let them speak.
              </span>
            </h2>
            <Button
              asChild
              size="lg"
              className="mt-8 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-7 text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.03] hover:shadow-xl hover:shadow-fuchsia-500/25"
            >
              <Link href="/login">
                Create your chatbot
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </Reveal>
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
        <Script src="/widget.js" data-bot-id={demoBotId} strategy="afterInteractive" />
      )}
    </div>
    </SmoothScroll>
  );
}

// Mirrors public.plan_limits() in the database — the DB is the enforcement
// source of truth; this copy drives the UI.
export type PlanId = "free" | "pro" | "business";

export interface Plan {
  id: PlanId;
  name: string;
  priceMonthly: number; // USD
  tagline: string;
  maxBots: number;
  maxDocsPerBot: number;
  maxDocBytes: number;
  maxMessagesPerMonth: number;
  canRemoveBranding: boolean;
  features: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    tagline: "Try it out on a small knowledge base",
    maxBots: 1,
    maxDocsPerBot: 5,
    maxDocBytes: 2 * 1024 * 1024,
    maxMessagesPerMonth: 100,
    canRemoveBranding: false,
    features: [
      "1 chatbot",
      "5 documents (2 MB each)",
      "100 widget messages / month",
      "Embeddable widget",
      "Answer sources & citations",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 29,
    tagline: "For teams shipping a real support bot",
    maxBots: 5,
    maxDocsPerBot: 50,
    maxDocBytes: 10 * 1024 * 1024,
    maxMessagesPerMonth: 2000,
    canRemoveBranding: true,
    features: [
      "5 chatbots",
      "50 documents per bot (10 MB each)",
      "2,000 widget messages / month",
      "Remove “Powered by AskBase” badge",
      "Custom widget color & prompt",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    priceMonthly: 99,
    tagline: "High-volume support at scale",
    maxBots: 20,
    maxDocsPerBot: 500,
    maxDocBytes: 25 * 1024 * 1024,
    maxMessagesPerMonth: 10000,
    canRemoveBranding: true,
    features: [
      "20 chatbots",
      "500 documents per bot (25 MB each)",
      "10,000 widget messages / month",
      "Everything in Pro",
      "Priority support",
    ],
  },
};

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(bytes % (1024 * 1024) === 0 ? 0 : 1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

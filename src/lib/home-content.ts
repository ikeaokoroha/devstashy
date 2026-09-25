import {
  Code,
  FileText,
  Layers,
  Search,
  Sparkles,
  Terminal,
  type LucideIcon,
} from "lucide-react";

// Copy and data for the marketing homepage. Kept here so the page's components
// stay layout only, and so the item types come from one place.

export interface HomeLink {
  label: string;
  href: string;
}

export interface HomeFeature {
  // A system item type name, which decides the card's colour.
  type: string;
  // The feature's own icon, which isn't always its type's icon.
  icon: LucideIcon;
  title: string;
  body: string;
}

export interface HomeCapability {
  title: string;
  body: string;
}

export interface HomeTag {
  label: string;
  type: string;
}

export interface HomePlan {
  name: string;
  // Only the fixed-price plan carries one; Pro's blurb changes with the
  // billing period, so it lives in PRO_PRICING.
  blurb?: string;
  features: string[];
  cta: string;
  href: string;
}

export const HOME_NAV_LINKS: HomeLink[] = [
  // Rooted at / so the links also work from the auth pages, which share the nav.
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
];

export const HERO_COPY = {
  eyebrow: "Snippets · Prompts · Commands · Notes · Files · Links",
  title: "Stop Losing Your",
  titleAccent: "Developer Knowledge",
  subtitle:
    "Your snippets live in VS Code, your prompts in chat history, your commands in a text file you can't find. Devstashy puts all of it in one fast, searchable place.",
  primaryCta: "Start Stashing — Free",
  secondaryCta: "See how it works",
  note: "Free forever for 50 items. No card required.",
  chaosLabel: "Your knowledge today…",
  orderLabel: "…with Devstashy",
} as const;

export const FEATURES: HomeFeature[] = [
  {
    type: "snippet",
    icon: Code,
    title: "Code Snippets",
    body: "Save reusable code with syntax highlighting and a language tag. Copy it back out in one click.",
  },
  {
    type: "prompt",
    icon: Sparkles,
    title: "AI Prompts",
    body: "Keep the prompts that actually work instead of scrolling back through chat history to find them.",
  },
  {
    type: "link",
    icon: Search,
    title: "Instant Search",
    body: "Hit ⌘K and search across titles, content, tags and types before you finish typing.",
  },
  {
    type: "command",
    icon: Terminal,
    title: "Commands",
    body: "That Docker incantation you look up every month, one search away instead of buried in bash history.",
  },
  {
    type: "file",
    icon: FileText,
    title: "Files & Docs",
    body: "Upload context files, diagrams and screenshots so the whole reference sits next to the code.",
  },
  {
    type: "note",
    icon: Layers,
    title: "Collections",
    body: "Group anything by project or theme. An item can live in as many collections as it earns.",
  },
];

export const AI_SECTION = {
  badge: "Pro Feature",
  title: "Let the AI do the filing",
  subtitle:
    "Devstashy reads what you save and handles the tedious part, so stashing something costs you nothing but the paste.",
  fileName: "use-debounce.ts",
  language: "TypeScript",
  tagsLabel: "AI Generated Tags",
} as const;

export const AI_CAPABILITIES: HomeCapability[] = [
  {
    title: "Auto-tagging",
    body: "Tags suggested from the content, not from you remembering.",
  },
  {
    title: "Summaries",
    body: "A one-line gist on every item, so a long note is scannable.",
  },
  {
    title: "Explain this code",
    body: "Ask what a snippet does six months after you saved it.",
  },
  {
    title: "Prompt optimizer",
    body: "Turn a rough prompt into one worth saving.",
  },
];

export const AI_TAGS: HomeTag[] = [
  { label: "react", type: "snippet" },
  { label: "typescript", type: "snippet" },
  { label: "hooks", type: "command" },
  { label: "debounce", type: "prompt" },
  { label: "performance", type: "note" },
];

export const PRICING_COPY = {
  title: "Simple pricing",
  subtitle: "Start free. Upgrade when your stash outgrows it.",
  popular: "Most Popular",
  save: "Save 25%",
} as const;

export const BILLING_PERIODS = ["monthly", "yearly"] as const;

export type BillingPeriod = (typeof BILLING_PERIODS)[number];

export const BILLING_PERIOD_LABELS: Record<BillingPeriod, string> = {
  monthly: "Monthly",
  yearly: "Yearly",
};

export const PRO_PRICING: Record<
  BillingPeriod,
  { amount: string; period: string; blurb: string }
> = {
  monthly: {
    amount: "$8",
    period: "/month",
    blurb: "Billed monthly. Switch to yearly and save $24.",
  },
  yearly: {
    amount: "$72",
    period: "/year",
    blurb: "Billed annually at $72 — that's $6 a month.",
  },
};

export const FREE_PLAN: HomePlan = {
  name: "Free",
  blurb: "Everything you need to stop losing things.",
  features: [
    "50 items",
    "3 collections",
    "Snippets, prompts, commands, notes, links",
    "Full-text search",
    "Markdown & code editors",
  ],
  cta: "Get Started",
  href: "/register",
};

export const PRO_PLAN: HomePlan = {
  name: "Pro",
  features: [
    "Unlimited items & collections",
    "File & image uploads",
    "AI auto-tagging and summaries",
    "Explain this code & prompt optimizer",
    "Export to JSON / ZIP",
    "Priority support",
  ],
  cta: "Go Pro",
  href: "/register",
};

export const FINAL_CTA = {
  title: "Ready to Organize Your Knowledge?",
  subtitle:
    "One stash for the snippets, prompts and commands you keep rewriting.",
  cta: "Start Stashing — Free",
} as const;

export const FOOTER_COPY = {
  tagline: "One home for your developer knowledge.",
  note: "Built for developers who are tired of looking for things.",
} as const;

// Pages that don't exist yet. They render as links so each one only needs its
// href filled in later, but they go nowhere for now.
const PLACEHOLDER_HREF = "#top";

export const FOOTER_COLUMNS: { heading: string; links: HomeLink[] }[] = [
  {
    heading: "Product",
    links: [...HOME_NAV_LINKS, { label: "Changelog", href: PLACEHOLDER_HREF }],
  },
  {
    heading: "Resources",
    links: [
      { label: "Docs", href: PLACEHOLDER_HREF },
      { label: "Keyboard shortcuts", href: PLACEHOLDER_HREF },
      { label: "Import & export", href: PLACEHOLDER_HREF },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: PLACEHOLDER_HREF },
      { label: "Privacy", href: PLACEHOLDER_HREF },
      { label: "Terms", href: PLACEHOLDER_HREF },
    ],
  },
];

// Seeds the database with the demo user, system item types, and sample collections.
// Run with: npx prisma db seed
// Safe to re-run: the user and system types are upserted, and the demo user's
// collections and items are recreated from scratch.

// dotenv must load before the Prisma client module reads DATABASE_URL.
import "dotenv/config";

import bcrypt from "bcryptjs";

import { ItemContentType } from "../src/generated/prisma/client";
import { prisma } from "../src/lib/prisma";

const DEMO_USER = {
  email: "demo@devstash.io",
  name: "Demo User",
  password: "12345678",
};

const BCRYPT_ROUNDS = 12;

const SYSTEM_ITEM_TYPES = [
  { name: "snippet", icon: "Code", color: "#3b82f6" },
  { name: "prompt", icon: "Sparkles", color: "#8b5cf6" },
  { name: "command", icon: "Terminal", color: "#f97316" },
  { name: "note", icon: "StickyNote", color: "#fde047" },
  { name: "file", icon: "File", color: "#6b7280" },
  { name: "image", icon: "Image", color: "#ec4899" },
  { name: "link", icon: "Link", color: "#10b981" },
] as const;

type SystemTypeName = (typeof SYSTEM_ITEM_TYPES)[number]["name"];

interface SeedItem {
  type: SystemTypeName;
  title: string;
  description: string;
  content?: string;
  url?: string;
  language?: string;
}

interface SeedCollection {
  name: string;
  description: string;
  isFavorite?: boolean;
  items: SeedItem[];
}

const COLLECTIONS: SeedCollection[] = [
  {
    name: "React Patterns",
    description: "Reusable React patterns and hooks",
    isFavorite: true,
    items: [
      {
        type: "snippet",
        title: "useDebounce & useLocalStorage hooks",
        description: "Debounce a changing value and persist state to localStorage",
        language: "typescript",
        content: `import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : initialValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}`,
      },
      {
        type: "snippet",
        title: "Context provider & compound components",
        description: "Typed context with a guard hook, used to build a compound Tabs component",
        language: "typescript",
        content: `import { createContext, useContext, useState, type ReactNode } from "react";

interface TabsContextValue {
  active: string;
  setActive: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tabs components must be used inside <Tabs>");
  return context;
}

export function Tabs({ defaultTab, children }: { defaultTab: string; children: ReactNode }) {
  const [active, setActive] = useState(defaultTab);
  return <TabsContext.Provider value={{ active, setActive }}>{children}</TabsContext.Provider>;
}

Tabs.Trigger = function TabsTrigger({ id, children }: { id: string; children: ReactNode }) {
  const { active, setActive } = useTabs();
  return (
    <button aria-selected={active === id} onClick={() => setActive(id)}>
      {children}
    </button>
  );
};

Tabs.Panel = function TabsPanel({ id, children }: { id: string; children: ReactNode }) {
  const { active } = useTabs();
  return active === id ? <div>{children}</div> : null;
};`,
      },
      {
        type: "snippet",
        title: "React utility functions",
        description: "Class name merging and a type-safe exhaustive switch helper",
        language: "typescript",
        content: `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function assertNever(value: never): never {
  throw new Error(\`Unhandled value: \${JSON.stringify(value)}\`);
}

export function formatRelativeTime(date: Date, locale = "en") {
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(seconds, "second");
}`,
      },
    ],
  },
  {
    name: "AI Workflows",
    description: "AI prompts and workflow automations",
    isFavorite: true,
    items: [
      {
        type: "prompt",
        title: "Code review",
        description: "Structured review focused on bugs, security, and maintainability",
        content: `You are a senior software engineer reviewing a pull request.

Review the code below and report findings grouped by severity (critical, major, minor):
- Correctness bugs and unhandled edge cases
- Security issues (input validation, auth checks, secrets)
- Performance problems (N+1 queries, unnecessary re-renders)
- Readability and maintainability

For each finding, quote the relevant line, explain the problem, and suggest a fix.
If the code looks good, say so briefly. Do not restate what the code does.

Code:
{{code}}`,
      },
      {
        type: "prompt",
        title: "Documentation generation",
        description: "Generate clear docs for a module, function, or API",
        content: `Write documentation for the code below, aimed at developers who will use it but haven't read the source.

Include:
1. A one-paragraph overview of what it does and when to use it
2. Parameters / props with types, defaults, and whether they're required
3. Return values and thrown errors
4. At least two realistic usage examples
5. Gotchas or non-obvious behavior

Use Markdown. Keep it concise and don't document private implementation details.

Code:
{{code}}`,
      },
      {
        type: "prompt",
        title: "Refactoring assistance",
        description: "Refactor code for clarity without changing behavior",
        content: `Refactor the code below to improve readability and maintainability without changing its behavior.

Constraints:
- Preserve the public API and all existing behavior, including edge cases
- Keep the existing code style and conventions
- Prefer small, well-named functions over comments
- Don't add new dependencies or features

Respond with:
1. The refactored code
2. A short bullet list of what changed and why
3. Any behavior you were unsure about preserving

Code:
{{code}}`,
      },
    ],
  },
  {
    name: "DevOps",
    description: "Infrastructure and deployment resources",
    items: [
      {
        type: "snippet",
        title: "Next.js Dockerfile & GitHub Actions CI",
        description: "Multi-stage Docker build and a CI workflow that lints and builds",
        language: "yaml",
        content: `# Dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
CMD ["npm", "start"]

# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run build`,
      },
      {
        type: "command",
        title: "Deploy with migrations",
        description: "Apply pending Prisma migrations, then build and deploy to production",
        language: "bash",
        content: `npm ci && npx prisma migrate deploy && npm run build && vercel deploy --prod`,
      },
      {
        type: "link",
        title: "Docker Docs",
        description: "Official Docker documentation and guides",
        url: "https://docs.docker.com/",
      },
      {
        type: "link",
        title: "GitHub Actions Documentation",
        description: "Workflow syntax, runners, and CI/CD guides",
        url: "https://docs.github.com/en/actions",
      },
    ],
  },
];

async function seedUser() {
  const password = await bcrypt.hash(DEMO_USER.password, BCRYPT_ROUNDS);
  const data = { name: DEMO_USER.name, password, isPro: false, emailVerified: new Date() };

  return prisma.user.upsert({
    where: { email: DEMO_USER.email },
    update: data,
    create: { email: DEMO_USER.email, ...data },
  });
}

// ItemType names aren't unique in the schema (custom types may reuse them), so
// match system types by name + isSystem instead of using upsert.
async function seedSystemItemTypes() {
  const typeIds = new Map<SystemTypeName, string>();

  for (const { name, icon, color } of SYSTEM_ITEM_TYPES) {
    const existing = await prisma.itemType.findFirst({ where: { name, isSystem: true } });
    const itemType = existing
      ? await prisma.itemType.update({ where: { id: existing.id }, data: { icon, color } })
      : await prisma.itemType.create({ data: { name, icon, color, isSystem: true } });
    typeIds.set(name, itemType.id);
  }

  return typeIds;
}

function contentTypeFor(item: Pick<SeedItem, "url">): ItemContentType {
  return item.url ? ItemContentType.URL : ItemContentType.TEXT;
}

// Neon round-trips add up across the sequential inserts; Prisma's 5s default is too tight.
const SEED_TRANSACTION_TIMEOUT_MS = 60_000;

async function seedCollections(userId: string, typeIds: Map<SystemTypeName, string>) {
  // One transaction, so a failed insert rolls back to the previous demo data.
  await prisma.$transaction(
    async (tx) => {
      // Items cascade-delete their collection links, so this fully resets the demo data.
      await tx.item.deleteMany({ where: { userId } });
      await tx.collection.deleteMany({ where: { userId } });

      for (const { name, description, isFavorite = false, items } of COLLECTIONS) {
        const collection = await tx.collection.create({
          data: { name, description, isFavorite, userId },
        });

        for (const { type, ...item } of items) {
          const itemTypeId = typeIds.get(type);
          if (!itemTypeId) throw new Error(`Missing system item type: ${type}`);

          await tx.item.create({
            data: {
              ...item,
              contentType: contentTypeFor(item),
              userId,
              itemTypeId,
              collections: { create: { collectionId: collection.id } },
            },
          });
        }
      }
    },
    { timeout: SEED_TRANSACTION_TIMEOUT_MS }
  );
}

async function main() {
  const user = await seedUser();
  const typeIds = await seedSystemItemTypes();
  await seedCollections(user.id, typeIds);

  const itemCount = COLLECTIONS.reduce((total, c) => total + c.items.length, 0);
  console.log(
    `✔ Seeded ${DEMO_USER.email}, ${typeIds.size} system item types, ` +
      `${COLLECTIONS.length} collections, and ${itemCount} items`
  );
}

main()
  .catch((error: unknown) => {
    console.error("✖ Seed failed");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

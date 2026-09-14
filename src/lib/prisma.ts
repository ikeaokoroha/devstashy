import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7 requires a driver adapter. PrismaNeon uses Neon's serverless driver over
// WebSockets (Node's built-in WebSocket, so no `ws` package is needed) with the
// pooled DATABASE_URL.
function createPrismaClient() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// Reuse one client across hot reloads in development instead of opening a new pool
// on every module re-evaluation.
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

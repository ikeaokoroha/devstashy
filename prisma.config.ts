import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer reads the connection URL from schema.prisma or loads .env
// automatically. CLI commands (migrate, studio) prefer Neon's direct connection,
// since migrations need session-level advisory locks the pooler doesn't provide.
// `env()` from prisma/config throws when unset, which would break `prisma generate`
// in environments without a database, so read process.env directly.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // Prisma 7 no longer seeds automatically after `migrate dev`; run `npx prisma db seed`.
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});

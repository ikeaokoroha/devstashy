// Checks the database connection through the app's Prisma client.
// Run with: npm run db:test

// dotenv must load before the Prisma client module reads DATABASE_URL.
import "dotenv/config";

import { prisma } from "../src/lib/prisma";

interface ServerInfo {
  version: string;
  now: Date;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add it to your .env file.");
  }

  const [server] = await prisma.$queryRaw<ServerInfo[]>`
    SELECT version() AS version, now() AS now
  `;
  console.log("✔ Connected");
  console.log(`  ${server.version}`);
  console.log(`  Server time: ${server.now.toISOString()}`);

  const counts = {
    users: await prisma.user.count(),
    itemTypes: await prisma.itemType.count(),
    items: await prisma.item.count(),
    collections: await prisma.collection.count(),
    tags: await prisma.tag.count(),
  };
  console.log("✔ Row counts");
  console.table(counts);
}

main()
  .catch((error: unknown) => {
    console.error("✖ Database test failed");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

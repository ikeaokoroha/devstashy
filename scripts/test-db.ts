// Checks the database connection and the seeded demo data through the app's Prisma client.
// Run with: npm run db:test (seed first with `npx prisma db seed`)

// dotenv must load before the Prisma client module reads DATABASE_URL.
import "dotenv/config";

import bcrypt from "bcryptjs";

import { ItemContentType } from "../src/generated/prisma/client";
import { prisma } from "../src/lib/prisma";

const DEMO_EMAIL = "demo@devstash.io";
const DEMO_PASSWORD = "12345678";
const EXPECTED_SYSTEM_TYPES = 7;

interface ServerInfo {
  version: string;
  now: Date;
}

const failures: string[] = [];

function check(passed: boolean, message: string) {
  console.log(`  ${passed ? "✔" : "✖"} ${message}`);
  if (!passed) failures.push(message);
}

async function checkConnection() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add it to your .env file.");
  }

  const [server] = await prisma.$queryRaw<ServerInfo[]>`
    SELECT version() AS version, now() AS now
  `;
  console.log("✔ Connected");
  console.log(`  ${server.version}`);
  console.log(`  Server time: ${server.now.toISOString()}`);
}

async function printCounts() {
  console.log("\n✔ Row counts");
  console.table({
    users: await prisma.user.count(),
    itemTypes: await prisma.itemType.count(),
    items: await prisma.item.count(),
    collections: await prisma.collection.count(),
    itemCollections: await prisma.itemCollection.count(),
    tags: await prisma.tag.count(),
  });
}

async function printSystemTypes() {
  const types = await prisma.itemType.findMany({
    where: { isSystem: true },
    include: { _count: { select: { items: true } } },
    orderBy: { name: "asc" },
  });

  console.log("\nSystem item types");
  console.table(
    types.map(({ name, icon, color, _count }) => ({ name, icon, color, items: _count.items }))
  );
  check(types.length === EXPECTED_SYSTEM_TYPES, `${EXPECTED_SYSTEM_TYPES} system item types exist`);
}

function getDemoUser() {
  return prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    include: {
      collections: {
        orderBy: { createdAt: "asc" },
        include: {
          items: {
            orderBy: { addedAt: "asc" },
            include: { item: { include: { itemType: true } } },
          },
        },
      },
    },
  });
}

type DemoUser = NonNullable<Awaited<ReturnType<typeof getDemoUser>>>;

async function checkDemoUser(user: DemoUser) {
  console.log(`\nDemo user: ${user.name} <${user.email}>`);
  console.log(`  isPro: ${user.isPro}, emailVerified: ${user.emailVerified?.toISOString()}`);

  const hash = user.password ?? "";
  check(hash !== "" && (await bcrypt.compare(DEMO_PASSWORD, hash)), "password matches the hash");
  check(hash !== "" && bcrypt.getRounds(hash) === 12, "password hashed with 12 rounds");
  check(user.emailVerified !== null, "email is verified");
}

function printCollections(user: DemoUser) {
  for (const collection of user.collections) {
    console.log(`\n📁 ${collection.name} — ${collection.description} (${collection.items.length})`);
    console.table(
      collection.items.map(({ item }) => ({
        type: item.itemType.name,
        title: item.title,
        detail: item.url ?? item.language ?? "",
      }))
    );
  }
}

async function checkItemIntegrity(userId: string) {
  const items = await prisma.item.findMany({
    where: { userId },
    include: { itemType: true, _count: { select: { collections: true } } },
  });

  const mismatched = items.filter((item) =>
    item.contentType === ItemContentType.URL
      ? !item.url || item.itemType.name !== "link"
      : !item.content || item.itemType.name === "link"
  );
  const orphaned = items.filter((item) => item._count.collections === 0);

  console.log(`\nIntegrity (${items.length} demo items)`);
  check(mismatched.length === 0, "content fields match each item's content type");
  check(orphaned.length === 0, "every item belongs to a collection");
}

async function main() {
  await checkConnection();
  await printCounts();
  await printSystemTypes();

  const user = await getDemoUser();
  if (!user) throw new Error(`Demo user ${DEMO_EMAIL} not found. Run \`npx prisma db seed\`.`);

  await checkDemoUser(user);
  printCollections(user);
  await checkItemIntegrity(user.id);

  if (failures.length > 0) {
    throw new Error(`${failures.length} check(s) failed:\n- ${failures.join("\n- ")}`);
  }
  console.log("\n✔ All checks passed");
}

main()
  .catch((error: unknown) => {
    console.error("\n✖ Database test failed");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

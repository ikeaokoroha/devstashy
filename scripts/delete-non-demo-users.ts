// Deletes every user except the demo user, along with everything they own.
// Dry run by default; pass --confirm to actually delete:
//   npm run db:delete-users              (lists what would be deleted)
//   npm run db:delete-users -- --confirm (deletes it)

// dotenv must load before the Prisma client module reads DATABASE_URL.
import "dotenv/config";

import { prisma } from "../src/lib/prisma";

const DEMO_EMAIL = "demo@devstash.io";
const CONFIRM_FLAG = "--confirm";

function getDatabaseHost() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add it to your .env file.");
  }
  return new URL(process.env.DATABASE_URL).hostname;
}

async function main() {
  const confirmed = process.argv.includes(CONFIRM_FLAG);
  console.log(`Database: ${getDatabaseHost()}`);

  // A missing demo user suggests the wrong database, so stop before deleting anything.
  const demo = await prisma.user.findUnique({ where: { email: DEMO_EMAIL }, select: { id: true } });
  if (!demo) {
    throw new Error(`Demo user ${DEMO_EMAIL} not found. Aborting.`);
  }

  const users = await prisma.user.findMany({
    where: { id: { not: demo.id } },
    select: {
      id: true,
      email: true,
      _count: { select: { items: true, collections: true, itemTypes: true, accounts: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  if (users.length === 0) {
    console.log("No users to delete besides the demo user.");
    return;
  }

  console.log(`\n${users.length} user(s) to delete:`);
  for (const { email, _count } of users) {
    console.log(
      `  - ${email} (${_count.items} items, ${_count.collections} collections, ${_count.itemTypes} custom types, ${_count.accounts} OAuth accounts)`,
    );
  }

  if (!confirmed) {
    console.log(`\nDry run: nothing deleted. Re-run with ${CONFIRM_FLAG} to delete.`);
    return;
  }

  const userIds = users.map((user) => user.id);
  const emails = users.map((user) => user.email);

  const result = await prisma.$transaction(
    async (tx) => {
      // Items go first: Item → ItemType is Restrict, so deleting a user's custom
      // types while their items still reference them would fail.
      const items = await tx.item.deleteMany({ where: { userId: { in: userIds } } });
      // Cascades to collections, custom item types, accounts, and sessions.
      const deletedUsers = await tx.user.deleteMany({ where: { id: { in: userIds } } });
      // Verification tokens are keyed by email, with no relation to cascade through.
      const tokens = await tx.verificationToken.deleteMany({ where: { identifier: { in: emails } } });
      // Tags are shared across users, so only remove ones no remaining item uses.
      const tags = await tx.tag.deleteMany({ where: { items: { none: {} } } });
      return { items: items.count, users: deletedUsers.count, tokens: tokens.count, tags: tags.count };
    },
    { timeout: 60_000 },
  );

  console.log(
    `\nDeleted ${result.users} user(s), ${result.items} item(s), ${result.tokens} verification token(s), and ${result.tags} unused tag(s).`,
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

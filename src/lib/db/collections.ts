import { prisma } from "@/lib/prisma";
import type {
  CollectionItemType,
  CollectionStats,
  CollectionSummary,
} from "@/types/dashboard";

export async function getCollectionStats(userId: string): Promise<CollectionStats> {
  const [totalCollections, favoriteCollections] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);

  return { totalCollections, favoriteCollections };
}

export async function getRecentCollections(
  userId: string,
  limit: number
): Promise<CollectionSummary[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      items: {
        select: {
          item: { select: { itemType: { select: { id: true, name: true } } } },
        },
      },
    },
  });

  return collections.map(({ items, ...collection }) => ({
    ...collection,
    itemCount: items.length,
    itemTypes: rankItemTypes(items.map(({ item }) => item.itemType)),
  }));
}

// Distinct types ordered by how many items use them (ties broken by name), so the
// first entry is the collection's dominant type.
function rankItemTypes(types: CollectionItemType[]): CollectionItemType[] {
  const counts = new Map<string, { type: CollectionItemType; count: number }>();
  for (const type of types) {
    const entry = counts.get(type.id);
    if (entry) entry.count += 1;
    else counts.set(type.id, { type, count: 1 });
  }

  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.type.name.localeCompare(b.type.name))
    .map(({ type }) => type);
}

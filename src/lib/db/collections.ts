import type { Prisma } from "@/generated/prisma/client";
import type { CreateCollectionData } from "@/lib/collection-validation";
import { prisma } from "@/lib/prisma";
import type {
  CollectionItemType,
  CollectionStats,
  CollectionSummary,
  SidebarCollection,
  SidebarCollections,
} from "@/types/dashboard";

const COLLECTION_ITEM_TYPES_SELECT = {
  select: {
    item: { select: { itemType: { select: { id: true, name: true } } } },
  },
} satisfies Prisma.Collection$itemsArgs;

const SIDEBAR_COLLECTION_SELECT = {
  id: true,
  name: true,
  isFavorite: true,
  items: COLLECTION_ITEM_TYPES_SELECT,
} satisfies Prisma.CollectionSelect;

type SidebarCollectionRow = Prisma.CollectionGetPayload<{
  select: typeof SIDEBAR_COLLECTION_SELECT;
}>;

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
      items: COLLECTION_ITEM_TYPES_SELECT,
      _count: { select: { items: true } },
    },
  });

  return collections.map(({ items, _count, ...collection }) => ({
    ...collection,
    itemCount: _count.items,
    itemTypes: rankItemTypes(items.map(({ item }) => item.itemType)),
  }));
}

// The most recently updated favorite and non-favorite collections, capped separately.
export async function getSidebarCollections(
  userId: string,
  favoritesLimit: number,
  recentLimit: number
): Promise<SidebarCollections> {
  const [favorites, recent] = await Promise.all([
    prisma.collection.findMany({
      where: { userId, isFavorite: true },
      orderBy: { updatedAt: "desc" },
      take: favoritesLimit,
      select: SIDEBAR_COLLECTION_SELECT,
    }),
    prisma.collection.findMany({
      where: { userId, isFavorite: false },
      orderBy: { updatedAt: "desc" },
      take: recentLimit,
      select: SIDEBAR_COLLECTION_SELECT,
    }),
  ]);

  return {
    favorites: favorites.map(toSidebarCollection),
    recent: recent.map(toSidebarCollection),
  };
}

// Saves a new collection for the user. isFavorite and defaultTypeId keep their
// schema defaults: neither is set from the New Collection dialog.
export async function createCollection(
  userId: string,
  data: CreateCollectionData
): Promise<string> {
  const collection = await prisma.collection.create({
    data: {
      name: data.name,
      description: data.description,
      user: { connect: { id: userId } },
    },
    select: { id: true },
  });

  return collection.id;
}

function toSidebarCollection({ items, ...collection }: SidebarCollectionRow): SidebarCollection {
  const [dominantType] = rankItemTypes(items.map(({ item }) => item.itemType));
  return { ...collection, dominantType: dominantType ?? null };
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

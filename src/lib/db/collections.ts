import type { Prisma } from "@/generated/prisma/client";
import type {
  CreateCollectionData,
  UpdateCollectionData,
} from "@/lib/collection-validation";
import { COLLECTIONS_PER_PAGE, getPageSkip } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import type {
  CollectionDetail,
  CollectionItemType,
  CollectionStats,
  CollectionSummary,
  SidebarCollection,
  SidebarCollections,
} from "@/types/dashboard";
import type { ItemCollectionRef } from "@/types/items";
import type { Paginated } from "@/types/pagination";
import type { SearchCollection } from "@/types/search";

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

// The fields CollectionCard renders, shared by the dashboard's recent cards and
// the /collections page.
const COLLECTION_SUMMARY_SELECT = {
  id: true,
  name: true,
  description: true,
  isFavorite: true,
  items: COLLECTION_ITEM_TYPES_SELECT,
  _count: { select: { items: true } },
} satisfies Prisma.CollectionSelect;

type CollectionSummaryRow = Prisma.CollectionGetPayload<{
  select: typeof COLLECTION_SUMMARY_SELECT;
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
    select: COLLECTION_SUMMARY_SELECT,
  });

  return collections.map(toCollectionSummary);
}

// One page of the user's collections, for the /collections page: favorites
// first, then most recently updated. Only the page's rows are loaded, which
// also bounds how many collections drag their item rows across for the type
// ranking.
export async function getAllCollections(
  userId: string,
  page: number
): Promise<Paginated<CollectionSummary>> {
  const where = { userId };

  const [collections, total] = await Promise.all([
    prisma.collection.findMany({
      where,
      orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
      skip: getPageSkip(page, COLLECTIONS_PER_PAGE),
      take: COLLECTIONS_PER_PAGE,
      select: COLLECTION_SUMMARY_SELECT,
    }),
    prisma.collection.count({ where }),
  ]);

  return { rows: collections.map(toCollectionSummary), total };
}

// One collection's own row for the detail page header. findFirst on id and
// userId, so another user's id finds nothing and the page 404s.
export async function getCollectionDetail(
  userId: string,
  collectionId: string
): Promise<CollectionDetail | null> {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      createdAt: true,
    },
  });

  return collection;
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

// Every collection the user can add an item to, for the item forms' picker.
export async function getPickerCollections(userId: string): Promise<ItemCollectionRef[]> {
  return prisma.collection.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

// The user's collections for the command palette, favorites first so an empty
// query opens on the ones they reach for most.
export async function getSearchCollections(
  userId: string,
  limit: number
): Promise<SearchCollection[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
    take: limit,
    select: { id: true, name: true, _count: { select: { items: true } } },
  });

  return collections.map(({ _count, ...collection }) => ({
    ...collection,
    itemCount: _count.items,
  }));
}

// The subset of ids that are the user's own collections. Both item writes run
// their selection through this, so an id from a crafted payload can't link an
// item into someone else's collection.
export async function filterOwnedCollectionIds(
  userId: string,
  collectionIds: string[]
): Promise<string[]> {
  if (collectionIds.length === 0) {
    return [];
  }

  const owned = await prisma.collection.findMany({
    where: { userId, id: { in: collectionIds } },
    select: { id: true },
  });

  return owned.map(({ id }) => id);
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

// Saves the edit dialog's metadata. updateMany rather than update, since there's
// no unique (id, userId): the ownership check and the write are one statement,
// so another user's id updates nothing.
export async function updateCollection(
  userId: string,
  collectionId: string,
  data: UpdateCollectionData
): Promise<boolean> {
  const { count } = await prisma.collection.updateMany({
    where: { id: collectionId, userId },
    data: { name: data.name, description: data.description },
  });

  return count > 0;
}

// Deletes one collection the user owns. The items themselves are untouched: only
// the ItemCollection join rows go, cascading from the collection.
export async function deleteCollection(
  userId: string,
  collectionId: string
): Promise<boolean> {
  const { count } = await prisma.collection.deleteMany({
    where: { id: collectionId, userId },
  });

  return count > 0;
}

function toCollectionSummary({
  items,
  _count,
  ...collection
}: CollectionSummaryRow): CollectionSummary {
  return {
    ...collection,
    itemCount: _count.items,
    itemTypes: rankItemTypes(items.map(({ item }) => item.itemType)),
  };
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

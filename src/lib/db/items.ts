import type { Prisma } from "@/generated/prisma/client";
import { SYSTEM_ITEM_TYPE_ORDER } from "@/lib/item-types";
import {
  getEditableFields,
  type CreateItemData,
  type UpdateItemData,
} from "@/lib/item-validation";
import { prisma } from "@/lib/prisma";
import type { ItemStats, ItemTypeWithCount, ItemWithType } from "@/types/dashboard";
import type { ItemDetail } from "@/types/items";

// Only the fields the dashboard item cards render. The file fields are here for
// the image gallery's thumbnails and the file list's rows; they're null for
// every non-file type.
const ITEM_CARD_SELECT = {
  id: true,
  title: true,
  description: true,
  isFavorite: true,
  isPinned: true,
  updatedAt: true,
  fileUrl: true,
  fileName: true,
  fileSize: true,
  itemType: { select: { id: true, name: true } },
  tags: { select: { name: true }, orderBy: { name: "asc" } },
} satisfies Prisma.ItemSelect;

type ItemCardRow = Prisma.ItemGetPayload<{ select: typeof ITEM_CARD_SELECT }>;

function toItemWithType({ tags, ...item }: ItemCardRow): ItemWithType {
  return { ...item, tags: tags.map((tag) => tag.name) };
}

export async function getItemStats(userId: string): Promise<ItemStats> {
  const [totalItems, favoriteItems] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ]);

  return { totalItems, favoriteItems };
}

// System types with the number of the user's items of each, in spec display order.
export async function getSystemItemTypes(userId: string): Promise<ItemTypeWithCount[]> {
  const types = await prisma.itemType.findMany({
    where: { isSystem: true },
    select: {
      id: true,
      name: true,
      _count: { select: { items: { where: { userId } } } },
    },
  });

  return types
    .map(({ _count, ...type }) => ({ ...type, itemCount: _count.items }))
    .sort((a, b) => typeOrder(a.name) - typeOrder(b.name));
}

// Unknown names sort last.
function typeOrder(name: string): number {
  const index = SYSTEM_ITEM_TYPE_ORDER.indexOf(name);
  return index === -1 ? SYSTEM_ITEM_TYPE_ORDER.length : index;
}

export async function getPinnedItems(
  userId: string,
  limit: number
): Promise<ItemWithType[]> {
  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: ITEM_CARD_SELECT,
  });

  return items.map(toItemWithType);
}

// All of the user's items of one system type, pinned first, then most recently updated.
export async function getItemsByType(
  userId: string,
  typeName: string
): Promise<ItemWithType[]> {
  const items = await prisma.item.findMany({
    where: { userId, itemType: { name: typeName, isSystem: true } },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    select: ITEM_CARD_SELECT,
  });

  return items.map(toItemWithType);
}

const ITEM_DETAIL_SELECT = {
  id: true,
  title: true,
  description: true,
  contentType: true,
  content: true,
  url: true,
  fileUrl: true,
  fileName: true,
  fileSize: true,
  language: true,
  isFavorite: true,
  isPinned: true,
  createdAt: true,
  updatedAt: true,
  itemType: { select: { id: true, name: true } },
  tags: { select: { name: true }, orderBy: { name: "asc" } },
  collections: {
    select: { collection: { select: { id: true, name: true } } },
    orderBy: { collection: { name: "asc" } },
  },
} satisfies Prisma.ItemSelect;

type ItemDetailRow = Prisma.ItemGetPayload<{ select: typeof ITEM_DETAIL_SELECT }>;

function toItemDetail({ tags, collections, ...detail }: ItemDetailRow): ItemDetail {
  return {
    ...detail,
    tags: tags.map((tag) => tag.name),
    collections: collections.map(({ collection }) => collection),
  };
}

// One item with everything the drawer shows, or null when the user has no item with that id.
export async function getItemDetail(
  userId: string,
  itemId: string
): Promise<ItemDetail | null> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: ITEM_DETAIL_SELECT,
  });

  return item ? toItemDetail(item) : null;
}

export interface ItemFile {
  fileUrl: string;
  fileName: string;
}

// Just the stored file of one of the user's items, for the download proxy.
// Returns null when the item isn't theirs or holds no file.
export async function getItemFile(userId: string, itemId: string): Promise<ItemFile | null> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId, contentType: "FILE" },
    select: { fileUrl: true, fileName: true },
  });

  if (!item?.fileUrl || !item.fileName) {
    return null;
  }
  return { fileUrl: item.fileUrl, fileName: item.fileName };
}

// Saves the drawer's edit form and returns the updated item, or null when the
// user has no item with that id. Fields the item's type doesn't use are left alone.
export async function updateItem(
  userId: string,
  itemId: string,
  data: UpdateItemData
): Promise<ItemDetail | null> {
  const existing = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { itemType: { select: { name: true } } },
  });
  if (!existing) {
    return null;
  }

  const editable = getEditableFields(existing.itemType.name);
  const where = { id: itemId, userId };

  // Two writes in one transaction so the tags are cleared before the new ones
  // are connected; Tag names are unique, so existing tags are reused.
  const [, item] = await prisma.$transaction([
    prisma.item.update({
      where,
      data: {
        title: data.title,
        description: data.description,
        ...(editable.content && { content: data.content }),
        ...(editable.language && { language: data.language }),
        ...(editable.url && { url: data.url }),
        tags: { set: [] },
      },
      select: { id: true },
    }),
    prisma.item.update({
      where,
      data: {
        tags: {
          connectOrCreate: data.tags.map((name) => ({ where: { name }, create: { name } })),
        },
      },
      select: ITEM_DETAIL_SELECT,
    }),
  ]);

  return toItemDetail(item);
}

// Creates an item of a system type and returns its id, or null when the type
// doesn't exist. Only the fields the type uses are written; tags are reused by name.
export async function createItem(
  userId: string,
  data: CreateItemData
): Promise<string | null> {
  const itemType = await prisma.itemType.findFirst({
    where: { name: data.type, isSystem: true },
    select: { id: true },
  });
  if (!itemType) {
    return null;
  }

  const editable = getEditableFields(data.type);
  const item = await prisma.item.create({
    data: {
      title: data.title,
      description: data.description,
      contentType: editable.file ? "FILE" : editable.url ? "URL" : "TEXT",
      ...(editable.content && { content: data.content }),
      ...(editable.language && { language: data.language }),
      ...(editable.url && { url: data.url }),
      ...(editable.file && {
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
      }),
      user: { connect: { id: userId } },
      itemType: { connect: { id: itemType.id } },
      tags: {
        connectOrCreate: data.tags.map((name) => ({ where: { name }, create: { name } })),
      },
    },
    select: { id: true },
  });

  return item.id;
}

export interface DeletedItem {
  deleted: boolean;
  // The stored file of a deleted file/image item, for the caller to remove from
  // R2. Null for every other type, and when nothing was deleted.
  fileUrl: string | null;
}

// Deletes the item and reports whether it existed. Scoping to userId makes
// another user's id a no-op; collection links cascade, tags are left in place.
// The row is read first because a delete can't return what it removed.
export async function deleteItem(userId: string, itemId: string): Promise<DeletedItem> {
  const existing = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { fileUrl: true },
  });

  const { count } = await prisma.item.deleteMany({ where: { id: itemId, userId } });
  if (count === 0) {
    return { deleted: false, fileUrl: null };
  }

  return { deleted: true, fileUrl: existing?.fileUrl ?? null };
}

export async function getRecentItems(
  userId: string,
  limit: number
): Promise<ItemWithType[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: ITEM_CARD_SELECT,
  });

  return items.map(toItemWithType);
}

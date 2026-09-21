# Item Types

Reference for DevStash's 7 system item types: what each is for, how it is stored, and how it is displayed.

**Sources:** `context/project-overview.md`, `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/item-types.ts`, `src/app/globals.css`, `src/components/dashboard/*`.

> `src/lib/constants.tsx`, listed as a source in the research prompt, does not exist. Type constants and display styles live in `src/lib/item-types.ts`.

## Overview

| Type    | Content type | Icon (Lucide) | Hex       | Tailwind token        | Plan | Route (planned)  |
| ------- | ------------ | ------------- | --------- | --------------------- | ---- | ---------------- |
| snippet | `TEXT`       | `Code`        | `#3b82f6` | `--color-type-snippet` | Free | `/items/snippets` |
| prompt  | `TEXT`       | `Sparkles`    | `#8b5cf6` | `--color-type-prompt`  | Free | `/items/prompts`  |
| command | `TEXT`       | `Terminal`    | `#f97316` | `--color-type-command` | Free | `/items/commands` |
| note    | `TEXT`       | `StickyNote`  | `#fde047` | `--color-type-note`    | Free | `/items/notes`    |
| file    | `FILE`       | `File`        | `#6b7280` | `--color-type-file`    | Pro  | `/items/files`    |
| image   | `FILE`       | `Image`       | `#ec4899` | `--color-type-image`   | Pro  | `/items/images`   |
| link    | `URL`        | `Link`        | `#10b981` | `--color-type-link`    | Free | `/items/links`    |

Rows are in `SYSTEM_ITEM_TYPE_ORDER` (the spec's display order, used by the sidebar and profile breakdown). The sidebar links to `/items/${name}s`, but those pages are not built yet.

## Per-type details

### Snippet

- **Purpose:** Reusable code: hooks, utilities, config files, boilerplate.
- **Icon / color:** `Code`, blue `#3b82f6`.
- **Key fields:** `content` (the code), `language` (syntax highlighting; the seed uses `typescript` and `yaml`), `title`, `description`.
- **Seed examples:** "useDebounce & useLocalStorage hooks", "Next.js Dockerfile & GitHub Actions CI".

### Prompt

- **Purpose:** AI prompts, system messages and workflow templates. Target of the Pro "prompt optimizer" feature.
- **Icon / color:** `Sparkles`, purple `#8b5cf6`.
- **Key fields:** `content` (prompt text, may include placeholders such as `{{code}}`), `title`, `description`. `language` is left unset in the seed.
- **Seed examples:** "Code review", "Documentation generation", "Refactoring assistance".

### Command

- **Purpose:** Terminal and shell one-liners that would otherwise sit in bash history or `.txt` files.
- **Icon / color:** `Terminal`, orange `#f97316`.
- **Key fields:** `content` (the command), `language` (always `bash` in the seed), `title`, `description`.
- **Seed examples:** "Undo last commit, keep changes" (`git reset --soft HEAD~1`), "Kill process on a port".

### Note

- **Purpose:** Free-form Markdown notes, explanations and course notes. The spec calls for a Markdown editor on text types.
- **Icon / color:** `StickyNote`, yellow `#fde047`.
- **Key fields:** `content` (Markdown), `title`, `description`.
- **Seed examples:** none. The seed creates no notes.

### File (Pro)

- **Purpose:** Uploaded documents and context files, stored in Cloudflare R2.
- **Icon / color:** `File`, gray `#6b7280`. This is also the fallback icon for unknown type names.
- **Key fields:** `fileUrl` (R2 URL), `fileName` (original name), `fileSize` (bytes), `title`, `description`.
- **Seed examples:** none. Uploads are not implemented.

### Image (Pro)

- **Purpose:** Uploaded images such as screenshots and diagrams, stored in R2.
- **Icon / color:** `Image` (imported as `ImageIcon` in code), pink `#ec4899`.
- **Key fields:** the same as file: `fileUrl`, `fileName`, `fileSize`.
- **Seed examples:** none.

### Link

- **Purpose:** Bookmarked URLs such as docs, references and tools.
- **Icon / color:** `Link` (imported as `LinkIcon`), emerald `#10b981`.
- **Key fields:** `url`, `title`, `description`.
- **Seed examples:** "Docker Docs", "Tailwind CSS Docs", "shadcn/ui", "Lucide Icons".

## Classification: text vs URL vs file

`Item.contentType` is the `ItemContentType` enum (`TEXT | URL | FILE`). The schema comments define which payload fields are set for each value:

| Content type | Types                            | Populated fields                  | Null fields                               |
| ------------ | -------------------------------- | --------------------------------- | ----------------------------------------- |
| `TEXT`       | snippet, prompt, command, note   | `content`, optional `language`    | `url`, `fileUrl`, `fileName`, `fileSize`  |
| `URL`        | link                             | `url`                             | `content`, `fileUrl`, `fileName`, `fileSize` |
| `FILE`       | file, image                      | `fileUrl`, `fileName`, `fileSize` | `content`, `url`                          |

Notes:

- **Nothing enforces the mapping.** `contentType` is stored separately from `itemTypeId`, and nothing in the schema or code links the two. The seed infers it from the payload (`contentTypeFor`: `URL` if `url` is set, otherwise `TEXT`), not from the type. The future create/edit actions will need to set it from the type and validate it, for example with a Zod discriminated union.
- The project overview's draft schema only had `TEXT | FILE`. `URL` was added in the init migration.
- `language` is described as for code, but the schema allows it on any item.

## Shared properties

Every item has these fields, whatever its type:

| Field                    | Notes                                                                        |
| ------------------------ | ---------------------------------------------------------------------------- |
| `id`                     | cuid                                                                         |
| `title`                  | required                                                                     |
| `description`            | optional short summary, shown one line long on cards                         |
| `isFavorite`             | star on cards, and counted in the dashboard stats                            |
| `isPinned`               | pin icon, and listed in the dashboard's Pinned section                      |
| `createdAt`, `updatedAt` | `updatedAt` sorts the recent lists and is the date shown on cards            |
| `userId`                 | owner, cascade-deleted with the user                                         |
| `itemTypeId`             | `onDelete: Restrict`, so a type in use can't be deleted                      |
| `tags`                   | implicit many-to-many with the global `Tag` table (`name` is globally unique) |
| `collections`            | via `ItemCollection` (with `addedAt`), so an item can be in many collections |

The `ItemType` model itself holds `name`, `icon`, `color`, `isSystem` and `userId`. System types have `isSystem = true` and `userId = null`. Custom types, a planned later phase, would carry a `userId`. `Collection.defaultTypeId` can point at a type (`onDelete: SetNull`).

## Display differences

Rendering is keyed by **type name**, not by the database row:

- `getItemTypeStyle(name)` in `src/lib/item-types.ts` returns `{ icon, textClass, borderClass, bgClass, dotClass }` built on the `--color-type-*` tokens in `globals.css`. Tailwind needs the full class names to appear in source, so each type's classes are written out in full.
- **The `ItemType.icon` and `ItemType.color` columns are seeded but never read by the app.** Changing them in the database has no visible effect. Custom types would need a fallback that reads them, since today any unknown name gets `DEFAULT_ITEM_TYPE_STYLE` (a muted `File` icon).

Where types show up today:

| Surface                                | What varies by type                                                                                   |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `ItemCard` (dashboard pinned and recent) | 2px left border in the type color, and the type icon on a 10%-tint tile. The rest of the layout is the same for all types. |
| `CollectionCard`                       | Left border in the dominant type's color (most items), plus an icon for each type present           |
| Sidebar Types (`SidebarTypesNav`)      | Colored icon, item count, and a `PRO` badge on file and image (`PRO_ITEM_TYPES`)                     |
| Sidebar Collections                    | Dot colored by the dominant type (`dotClass`), muted for empty collections                          |
| Profile `ItemTypeBreakdown`            | All 7 types in spec order with their colors, icons and counts, including zeros                       |

Cards don't show content yet. Per the spec, the item drawer will need different content views for each type:

- **snippet and command:** syntax-highlighted code using `language`
- **prompt and note:** Markdown or plain text
- **link:** the URL as an outbound link
- **file:** file name, size and a download link
- **image:** an image preview

## Plan gating

File and image are Pro-only (upload requires Pro). Only the sidebar badge enforces this today. Per the spec, all users get full access during development, so the badge is display only.

## Gaps and observations

1. **No seed data for note, file or image.** The 18 demo items are snippets, prompts, commands and links, so those three types always show a zero count for the demo user.
2. **`contentType` isn't tied to the type.** See the classification notes above.
3. **The `icon` and `color` columns are unused.** The styles are hardcoded by name.
4. **`ItemType.name` isn't unique.** The seed matches system types on `name` and `isSystem`. A unique constraint on system type names was deferred in the Code Scan Quick Wins work.
5. **The `/items/[type]` routes don't exist yet**, though the sidebar links to them.

# Item CRUD Architecture

A proposed design for creating, reading, updating and deleting items of all 7 system types. It uses one action file, one query module, one dynamic route, and shared components that adapt to each type.

**Sources:** `context/project-overview.md`, `docs/item-types.md`, `prisma/schema.prisma`, `src/lib/item-types.ts`, the existing code patterns in `src/lib/db/`, `src/actions/`, `src/app/(app)/`, and the Next.js 16 docs in `node_modules/next/dist/docs/`.

> The research prompt lists `docs/content-types.md` and `src/lib/constants.tsx`. Neither exists. Their equivalents are `docs/item-types.md` and `src/lib/item-types.ts`.

## Principles

1. **Actions don't branch on the type.** Create, update and delete work the same way for every type. They branch only on the **content shape** (`TEXT`, `URL` or `FILE`), and that comes from a config map, not from `if (type === "snippet")` code.
2. **Type-specific logic lives in components.** How a snippet renders versus a link, and which fields a form shows, are decided in the UI through a small registry keyed by type name.
3. **Reads go through `src/lib/db`, writes go through `src/actions`.** Server components call query functions directly. Client components call server actions. This matches the existing dashboard and profile code.
4. **Config lives in one place.** `src/lib/item-types.ts` already maps each type name to its icon and colors. The URL slug and content shape for each type get added to the same map.

## File structure

New files are marked ✚ and changed files ✎.

```
src/
├── actions/
│   └── items.ts                  ✚ createItem, updateItem, deleteItem (all mutations)
├── lib/
│   ├── db/
│   │   └── items.ts              ✎ + getItemsByType, getItemById, getItemTypeByName
│   ├── item-types.ts             ✎ + slug and contentType per type, slug lookup helpers
│   └── item-validation.ts        ✚ Zod schemas: shared fields + TEXT | URL | FILE union
├── types/
│   └── items.ts                  ✚ ItemDetail, ItemFormState
├── app/(app)/
│   ├── items/[type]/
│   │   ├── page.tsx              ✚ list page for one type (+ drawer via search params)
│   │   └── loading.tsx           ✚ skeleton list
│   └── dashboard/page.tsx        ✎ reads search params so cards open the same drawer
├── components/
│   ├── items/
│   │   ├── ItemList.tsx          ✚ list of ItemCards, with an empty state
│   │   ├── ItemDrawer.tsx        ✚ client: Sheet shell driven by ?item= / ?new=
│   │   ├── ItemDetail.tsx        ✚ header, meta, actions, and the type's content view
│   │   ├── ItemForm.tsx          ✚ client: shared fields + the type's content fields
│   │   ├── DeleteItemDialog.tsx  ✚ client: AlertDialog → deleteItem
│   │   ├── content-views/        ✚ CodeView, MarkdownView, LinkView, FileView, ImageView
│   │   ├── content-fields/       ✚ TextContentFields, UrlContentFields, FileContentFields
│   │   └── registry.ts           ✚ type name → { View, Fields } lookup
│   └── dashboard/
│       ├── ItemCard.tsx          ✎ becomes a link to ?item=<id>
│       └── TopBar.tsx            ✎ "New Item" links to ?new=1
└── proxy.ts                      ✎ matcher + "/items/:path*"
```

`ItemCard` and `ItemSection` stay in `components/dashboard/` and get reused as they are, rather than moved in a refactor.

## Routing: `/items/[type]`

One dynamic segment serves all 7 list pages. The URL uses the plural slug the sidebar already links to (`/items/${name}s`).

```
/items/snippets  ─┐
/items/links      ├─►  src/app/(app)/items/[type]/page.tsx
/items/…         ─┘         │
                            ├─ const { type: slug } = await params      (async in Next 16)
                            ├─ getTypeNameBySlug(slug)  → "snippet" | … | null
                            │     null → notFound()
                            ├─ requireUserId()
                            ├─ getItemTypeByName(name) + getItemsByType(userId, name)
                            └─ render header + ItemList (+ ItemDrawer from searchParams)
```

- **Slug mapping.** Add `slug` (`"snippets"`) and `contentType` (`"TEXT"`) to each entry in `src/lib/item-types.ts`, and export `getTypeNameBySlug(slug)` and `getItemTypeSlug(name)`. Any unknown slug calls `notFound()`. Don't rely on string manipulation like stripping the trailing `s`, since custom types may not pluralize that way.
- **Props.** Use `PageProps<"/items/[type]">` and run `npx next typegen` after adding the route. `params` and `searchParams` are both Promises.
- **Static params.** Don't add `generateStaticParams`. The page reads the session, so it's dynamic anyway, and slug validation happens at request time.
- **Auth.** Add `/items/:path*` to the matcher in `src/proxy.ts`. The page still calls `requireUserId()`, because the proxy only redirects and doesn't give the page a user id.
- **Layout.** The route sits inside `(app)`, so it gets the sidebar and top bar for free.

### The drawer is driven by search params

The spec wants items to open in a slide-out drawer rather than on a full page. The drawer state goes in the URL:

| URL                                | Drawer shows                        |
| ---------------------------------- | ----------------------------------- |
| `/items/snippets?item=<id>`        | Detail view (`ItemDetail`)          |
| `/items/snippets?item=<id>&edit=1` | Edit form (`ItemForm`, prefilled)   |
| `/items/snippets?new=1`            | Create form with the type preselected |
| `/dashboard?item=<id>`             | Same drawer, over the dashboard     |

The page reads `searchParams`, calls `getItemById(userId, id)` on the server, and passes the result to `ItemDrawer`. This keeps data fetching in server components, with no client fetch and no read action. It also makes drawer links shareable and lets the back button close the drawer. Closing calls `router.replace` without the param.

**Alternative considered:** parallel plus intercepting routes (`@drawer/(.)items/[id]`) would also give each item a real `/items/[id]` page. That's more files and more edge cases, so leave it until a standalone item page is needed.

## Data layer: `src/lib/db/items.ts`

These extend the existing module. It already has `ITEM_CARD_SELECT` and `toItemWithType`.

| Function                                  | Returns                     | Notes                                                                                                   |
| ----------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------- |
| `getItemsByType(userId, typeName, limit)` | `ItemWithType[]`            | Same card select as the dashboard. Pinned first, then `updatedAt desc`. Filters with `itemType: { name, isSystem: true }`. Covered by the existing `@@index([userId, itemTypeId])`. |
| `getItemById(userId, id)`                 | `ItemDetail \| null`        | `findFirst({ where: { id, userId } })`, which returns null for another user's item so the page can call `notFound()`. Includes `content`, `language`, `url`, the file fields, tags, and collections (id and name). |
| `getItemTypeByName(name)`                 | `{ id, name } \| null`      | Resolves the type id the create form submits. System types only for now.                                |

`ItemDetail` goes in the new `src/types/items.ts`. `ItemWithType` stays in `src/types/dashboard.ts`, where it is already used.

## Mutations: `src/actions/items.ts`

One `"use server"` file with three actions, following the pattern of `src/actions/profile.ts`: `useActionState` signatures, `requireUserId()` first, Zod `safeParse`, `try/catch`, and an `ActionResult` return.

```ts
createItem(prev, formData): Promise<ActionResult<ItemFormState>>
updateItem(prev, formData): Promise<ActionResult<ItemFormState>>   // id comes from a hidden field
deleteItem(prev, formData): Promise<ActionResult>
```

### How one action handles all 7 types

```
formData ─► parse itemTypeId
          ─► load ItemType (system, or owned by userId)   ── missing → error
          ─► contentType = CONTENT_TYPE_BY_NAME[type.name]      (config, not code)
          ─► itemSchema.safeParse({ ...fields, contentType })   (discriminated union)
          ─► Pro check: PRO_ITEM_TYPES.includes(name) && !canUsePro(user)   (no-op in dev)
          ─► prisma.item.create / update with only that shape's fields set
          ─► revalidatePath("/", "layout")
```

- **Validation** (`src/lib/item-validation.ts`): a base schema with the shared fields (`title` required, `description`, `tags` as a comma-separated string turned into a unique trimmed list), plus `z.discriminatedUnion("contentType", …)`:
  - `TEXT`: `content` required, `language` optional
  - `URL`: `url` required and must be `http(s)`
  - `FILE`: `fileUrl`, `fileName` and `fileSize` required
- **The action writes the whole shape.** It explicitly sets the other shapes' fields to `null`, which enforces the one-shape rule from `docs/item-types.md` at the only place items are written.
- **`contentType` comes from the server.** The action derives it from the type and never trusts a client value.
- **Ownership.** `update` and `delete` use `where: { id, userId }`. Prisma accepts extra non-unique fields in a unique `where`, and it throws `P2025` when no row matches. The action maps that to "Item not found", so a guessed id can't touch another user's item.
- **Changing an item's type** is allowed only within the same content shape, for example snippet to command. Crossing shapes would orphan fields, so reject it.
- **Tags.** `Tag.name` is globally unique, so use `connectOrCreate` on `name`. On update, use `set: []` and then `connectOrCreate` for the new list. Leave unused tags in place, since cleaning them up is a separate concern.
- **Cache refresh.** `revalidatePath("/", "layout")` refreshes the sidebar counts in the `(app)` layout as well as the current page. `cacheComponents` is off and every query is uncached, so no tag-based invalidation is needed yet.
- **Delete** also cascades the `ItemCollection` links. After it succeeds, the client closes the drawer.

**Favorite and pin** toggles are also mutations in the spec. They belong in this same file as small `toggleItemFavorite(id)` and `toggleItemPin(id)` actions, not as special cases of `updateItem`.

## Where type-specific logic lives

| Concern                             | Location                              | Varies by                                             |
| ----------------------------------- | ------------------------------------- | ----------------------------------------------------- |
| Icon, colors, slug, content shape   | `src/lib/item-types.ts`               | type name (config)                                    |
| Which payload fields are valid      | `src/lib/item-validation.ts`          | content shape (3 variants, not 7)                     |
| How content renders                 | `components/items/content-views/*`    | type, through the registry                            |
| Which inputs the form shows         | `components/items/content-fields/*`   | content shape, plus type hints such as a language picker |
| Persistence, auth, revalidation     | `src/actions/items.ts`                | nothing; the same for every type                      |
| Querying                            | `src/lib/db/items.ts`                 | nothing; the type name is just a filter               |

The registry (`components/items/registry.ts`):

```ts
const CONTENT_VIEWS: Record<string, ComponentType<ContentViewProps>> = {
  snippet: CodeView,     // highlighted with item.language
  command: CodeView,     // language defaults to bash, plus a copy button
  prompt:  MarkdownView,
  note:    MarkdownView,
  link:    LinkView,     // outbound link, hostname
  file:    FileView,     // name, size, download
  image:   ImageView,    // preview
};
// Fallback by contentType so custom types render something sensible.
```

## Component responsibilities

| Component            | Kind    | Job                                                                                                       |
| -------------------- | ------- | --------------------------------------------------------------------------------------------------------- |
| `items/[type]/page`  | server  | Resolve the slug, fetch the list (and the drawer item if `?item=` is set), render the header and list.   |
| `ItemList`           | server  | Render `ItemCard`s, or an empty state with a "New {type}" link to `?new=1`.                              |
| `ItemCard` ✎         | server  | Link to `?item=<id>`, keeping the current path. No other change.                                         |
| `ItemDrawer`         | client  | Shadcn `Sheet`. Open state comes from the URL; close with `router.replace`. Shows `ItemDetail` or `ItemForm`. |
| `ItemDetail`         | server  | Title, type badge, tags, collections and dates; the type's content view; Edit, Delete, Favorite and Pin buttons. |
| content views        | mixed   | One per display style. `CodeView` is a client component for the copy button; the rest can be server components. |
| `ItemForm`           | client  | `useActionState` against `createItem` or `updateItem`. Shared fields plus the shape's `content-fields` component. Per-field errors come back through `FormField` and `FormMessage` from `components/auth` (consider moving them to `components/shared`). |
| content fields       | client  | `TextContentFields` (textarea, plus a language select for snippet and command), `UrlContentFields`, `FileContentFields` (upload, later). |
| `DeleteItemDialog`   | client  | `AlertDialog` confirmation that calls `deleteItem` and then closes the drawer.                            |

## Decisions and gaps to settle before building

1. **Demo user versus signed-in user.** The dashboard and sidebar still read data through `getCurrentUserId()`, which returns the demo user. The new actions must use `requireUserId()`. A real account would then create items it can't see on the dashboard or in the sidebar counts. Switch the `(app)` layout and dashboard to `requireUserId()` as part of this work or before it.
2. **Rendering libraries.** Neither syntax highlighting (for example Shiki) nor Markdown rendering (for example react-markdown) is installed. Choose them before building `CodeView` and `MarkdownView`. The spec also asks for a Markdown editor. A plain textarea is enough for a first pass.
3. **File and image uploads** need an API route (`src/app/api/items/upload`) for R2 and progress tracking, per the coding standards. `createItem` then receives the resulting `fileUrl`, `fileName` and `fileSize`. Ship text and URL types first, and have the file types show "coming soon" in the form.
4. **Pro and free limits.** Add a `canUsePro(userId)` helper, plus the 50-item free cap in `createItem`. Both return `true` in dev, per the spec's "full access during development" note.
5. **Toasts.** The coding standards say to show action results with toasts, but no toast library is installed. Rate limiting kept inline `FormMessage` errors instead. Inline errors are fine for the form, but delete and toggle feedback probably need something like `sonner`.
6. **Collections** on create and edit (adding an item to several collections) fit into the same actions through `ItemCollection`, with an ownership check on each `collectionId`. They could be their own follow-up feature.
7. **Pagination.** `getItemsByType` takes a limit. The free plan's 50-item cap keeps lists short for now, so add cursor pagination only when Pro users need it.

## Suggested build order

1. Config: add `slug` and `contentType` in `item-types.ts`, and add the proxy matcher.
2. Read path: `getItemsByType`, the `/items/[type]` page, and `ItemList` (answers the sidebar links).
3. Detail: `getItemById`, `ItemDrawer`, `ItemDetail`, and the content views for text and link types.
4. Write path: `item-validation.ts`, `createItem` and `updateItem`, and `ItemForm` for text and URL.
5. Delete, plus favorite and pin toggles.
6. File and image uploads (separate feature).

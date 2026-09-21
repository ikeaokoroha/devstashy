# DevStash

A developer knowledge hub for snippets, commands, prompts, notes, files, images, links and custom types.

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

```bash
npm run dev                      # dev server on :3000 (Turbopack, outputs to .next/dev)
npm run build                    # production build (Turbopack)
npm start                        # serve the production build
npm run lint                     # eslint (flat config); `next lint` no longer exists
npx next typegen && npx tsc --noEmit   # typecheck
npm test                         # vitest in watch mode
npm run test:run                 # vitest, single run
npx vitest run src/lib/item-types.test.ts   # single file (-t "name" for one test)
```

Typechecking requires `next typegen` first: `next-env.d.ts` and the generated route
types are gitignored, so a fresh clone has none until typegen, `next dev`, or
`next build` writes them. `next build` does **not** run ESLint — lint is a separate step.

Tests use Vitest in a Node environment and cover server actions and utilities only,
not components; they're colocated as `*.test.ts` and mock Prisma, auth and other
external services (see the Testing section of coding-standards.md). `next build`
typechecks test files too, since tsconfig includes every `.ts` file.

## Next.js 16 specifics

This version departs from older Next.js in ways that matter on nearly every file.
Read `node_modules/next/dist/docs/` for anything non-trivial; the full list of changes
is in `01-app/02-guides/upgrading/version-16.md`.

- **Request APIs are async, with no sync fallback**: `cookies()`, `headers()`,
  `draftMode()`, and `params`/`searchParams` in `page`/`layout`/`route`/`default` must
  be awaited.
- **Typed route props**: use the globally available `PageProps<'/route'>`,
  `LayoutProps<'/route'>`, and `RouteContext<'/route'>` helpers rather than
  hand-written prop types — `src/app/layout.tsx` already uses `LayoutProps<"/">`.
  They come from typegen, so regenerate after adding routes.
- **`middleware` → `proxy`**: the file and the named export are both `proxy`, and it
  runs on the Node.js runtime only. Config flags renamed too (`skipProxyUrlNormalize`).
- **Caching**: `revalidateTag` requires a second cacheLife-profile argument
  (`revalidateTag('posts', 'max')`); `updateTag` is for immediate expiry in Server
  Actions. `cacheLife`/`cacheTag` are stable — import them without the `unstable_` prefix.
- **PPR**: the `experimental.ppr` flag and `experimental_ppr` segment export are gone;
  opt in with `cacheComponents: true` instead (currently off).
- **Turbopack is the default** for both dev and build. A webpack config in the project
  will fail the build unless `--webpack` is passed.
- **`next/image`**: local images with query strings are no longer allowed, and
  `minimumCacheTTL`, `imageSizes`, and `qualities` have new defaults.

## Neon MCP

Whenever you use the Neon MCP server, target the devstashy project's development branch unless I say otherwise:

- **Project:** `devstashy` (`project_id: hidden-brook-70407458`)
- **Branch:** `development` (`branch_id: br-purple-dawn-a5rgqwvi`)
- **Production branch:** `production` (`br-fancy-paper-a52tk5cu`). **Never read from or write to it unless I explicitly ask for production in that request.**

Rules:

- Always pass `branch_id: br-purple-dawn-a5rgqwvi` explicitly on every branch-scoped call (`run_sql`, `run_sql_transaction`, `get_database_tables`, `describe_table_schema`, `explain_sql_statement`, `get_connection_string`, etc.). Never leave `branch_id` out: the default branch is **production**, so a call without it hits prod.
- Permission to use production covers only the request where I gave it. Go back to development afterward.
- Don't change the schema through the MCP (no DDL, and no `prepare_database_migration` or `complete_database_migration`). Schema changes go through `prisma migrate dev` only.
- Ask before running any destructive SQL or MCP action (`DELETE`, `UPDATE`, `TRUNCATE`, `DROP`, `reset_from_parent`, `delete_branch`, `restore_snapshot`), even on development.

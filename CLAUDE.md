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
```

Typechecking requires `next typegen` first: `next-env.d.ts` and the generated route
types are gitignored, so a fresh clone has none until typegen, `next dev`, or
`next build` writes them. `next build` does **not** run ESLint — lint is a separate step.

No test framework is configured yet.

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

# Architecture

Status: early development. This describes the target architecture as implementation begins — expect it to evolve, but keep this doc in sync when it does.

## Monorepo layout

Bun workspaces (native `workspaces` field in `package.json`). No Turborepo/Nx — revisit only once the number of packages/scripts actually makes plain Bun scripts painful.

```
idle/
├── apps/
│   ├── client/        # the game itself — React (UI chrome) + PixiJS (world/grid rendering)
│   └── website/       # marketing/landing site — Next.js + Chakra UI (see below)
├── services/
│   ├── api-gateway/   # REST: account/profile settings, marketplace, leaderboards, admin
│   ├── game-server/   # authoritative real-time simulation — movement, combat, offline hunting automation
│   └── chat/          # chat, guilds, social features
└── packages/
    └── shared/        # shared between apps and services — see below
```

There is no dedicated auth service — auth is Supabase Auth, used directly via `supabase-js`. Don't build a custom login/session flow.

## Services

- Each service is its own Bun process (own `Bun.serve()` where it needs one — `game-server` for HTTP+WebSocket, `api-gateway` for HTTP, `chat` for HTTP+WebSocket).
- Services do **not** call each other directly over HTTP/WS. They coordinate only through Supabase — shared Postgres tables and Realtime subscriptions. If two services need to react to the same event, that's a Postgres write + a Realtime subscription, not a service-to-service request.
- `game-server` is the single authoritative source for world/combat state. It keeps simulating — including players' configured automation (skill/potion/target rules) — even when no client is connected. That persistence is the game's core "idle" mechanic, so `game-server` must never assume a live client connection to make progress.

## Data & backend: Supabase

- **Postgres**: primary datastore for everything — accounts, characters, items, world state.
- **Auth**: Supabase Auth for login/sessions. Apps and services validate the Supabase-issued JWT; none of them implement their own auth.
- **Realtime**: cross-service coordination and pushing relevant DB changes to clients.
- **Storage**: user-generated/uploaded assets (avatars, custom content).
- **Access pattern**: use the `supabase-js` client SDK everywhere for DB access, including `game-server`'s hot path.

  This is a deliberate override of the root `CLAUDE.md` guidance to prefer `Bun.sql` for Postgres — for this project, one consistent client library across every service wins over the marginal perf gain of a direct connection. Only reconsider if `game-server` write throughput actually becomes a measured bottleneck.

- **API keys**: use the current publishable/secret key pair (`sb_publishable_...` / `sb_secret_...`), not the legacy JWT `anon`/`service_role` keys — see [Supabase's own guidance](https://supabase.com/docs/guides/api/api-keys). `services/*` use the secret key; `apps/client` uses the publishable key.

### CLI project (`supabase/`)

`supabase/config.toml`, `migrations/`, and `schemas/` live at the **repo root**, not inside any app/service — the database is shared infrastructure, not owned by one package. Schema is managed **declaratively**: edit `supabase/schemas/*.sql` to describe the desired end state, then generate a migration from the diff (`supabase db diff`) rather than hand-writing migration files. See the `supabase` skill (or `supabase db --help`) for the actual workflow once real tables are being added.

The local project is linked to the remote "mmorpg" Supabase project (ref `tepkzdgaecpqnlsdkkti`). Direct Postgres operations (`supabase db push`/`db pull`/`db diff` against the remote) need the database password — set `DATABASE_PASSWORD` in the root `.env` (not committed); nothing else needs it.

### Environment variables

- `services/*/.env` — `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `PORT`, `LOG_LEVEL`. Server-only, never shipped to a browser.
- `apps/client/.env` — public values only, prefixed `PUBLIC_` (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY`). Bun only inlines `process.env.*` into the browser bundle when `bunfig.toml` sets `[serve.static] env = "PUBLIC_*"` (already configured in `apps/client/bunfig.toml`) **and** the reference is a literal `process.env.FOO` — no `import.meta.env`, no destructuring `process.env` into a variable first. An unprefixed var referenced client-side is left as a raw `process.env.FOO` in the shipped JS, which throws `ReferenceError: process is not defined` in the browser.
- `apps/website/.env` — public values only, prefixed `NEXT_PUBLIC_` (`NEXT_PUBLIC_CLIENT_URL`, the origin of `apps/client` that the "Play game" link points at), per **Next.js's own** convention — this is a different inlining mechanism than `apps/client`'s Bun/`bunfig.toml` one above, so don't mix the two prefixes up between the two apps. Same literal-reference rule applies: write `process.env.NEXT_PUBLIC_FOO` directly at the call site (see `src/lib/env.ts`'s `requireEnv` helper, which takes the literal expression as an argument rather than destructuring it), never through a destructured/renamed variable.
- Every `.env.example` in the repo lists what a given package needs; actual `.env` files are gitignored.

## `packages/shared`

Used by both client and server code:

- **Types** — entities (Player, Monster, Item, …), API/WS contracts
- **Game constants/data** — monster stats, item definitions, formulas: the single source of truth for balance data, never duplicated per package
- **Protocol/validation** — WebSocket and API message schemas, validated (e.g. with Zod) so client and server can't silently drift apart

No runtime/DB/framework-specific logic lives here — pure data, types, and validation only.

## Client (`apps/client`)

- **World/grid rendering**: PixiJS (WebGL) — tiles, sprites, animations.
- **UI chrome** (menus, inventory, automation config screens): React.
- **State**: Zustand, fed by WebSocket messages from `game-server`.
- **Styling**: Tailwind CSS.

## Website (`apps/website`)

A fully separate app from `apps/client` — no game logic, no WebSocket dependency, and (per [ADR 0001](adr/0001-auth-owned-entirely-by-client.md)) no auth of its own. Marketing/landing site only; sign-in, sign-up, sign-out, and password reset all live in `apps/client`, which the site links out to via a single "Play game" link (`NEXT_PUBLIC_CLIENT_URL`, see Environment variables below).

**Why not merge `apps/client` into this Next.js app?** It came up: Next's route-based code splitting would let a merged app lazy-load the game bundle only on game routes. Considered and rejected — `apps/client` is a logged-in, WebSocket-driven, canvas-rendered app with no SSR/SEO surface, so Next's SSR machinery buys it nothing while forcing `'use client'`/`dynamic(..., { ssr: false })` discipline throughout the game code. Merging would also mix two styling systems in one app (Chakra here, Tailwind in `apps/client`) with no real component reuse, replace `apps/client`'s Bun-native HTML-import dev loop with Turbopack, and couple the two apps' builds/deploys together — a game build break would take down the marketing site and vice versa. The one practical win (no cross-app redirect for login→play) is largely moot since both apps already validate the same Supabase session/JWT.

This is a deliberate per-app override of the root `CLAUDE.md` frontend guidance (`Bun.serve()` + HTML imports, no `vite`) and of `apps/client`'s Tailwind approach:

- **Framework**: Next.js (App Router), scaffolded with `create-next-app`. Has its own dev server/bundler (Turbopack) — it does not use `Bun.serve()` or HTML imports. Bun is still the package manager and the thing that runs the scripts (`bun install`, `bun run dev`, `bun run build`), matching the rest of the repo; only the framework choice itself is the override, not the "use Bun" rule.
- **Design system**: Chakra UI v3 is the only design system here — no Tailwind in this app. Base UI primitives (`Toaster`, `Tooltip`, `ColorModeButton`, …) live in `src/components/ui/` and are generated/regenerated with `npx @chakra-ui/cli snippet add`, not hand-written — treat that directory as vendored code, not subject to `docs/code-style.md`. `apps/client` is unaffected and keeps Tailwind.
  - **Color mode is currently disabled.** The CLI's generated `provider.tsx` normally wraps `ChakraProvider` in `ColorModeProvider` (`next-themes`), but `next-themes` injects a raw `<script>` internally, which causes a hydration mismatch under Next.js 16.2+/React 19.2 — a known, unresolved upstream bug (`next-themes` is unmaintained; see [next-themes#387](https://github.com/pacocoursey/next-themes/issues/387)/[#385](https://github.com/pacocoursey/next-themes/issues/385), [shadcn-ui/ui#10104](https://github.com/shadcn-ui/ui/issues/10104)/[#10200](https://github.com/shadcn-ui/ui/issues/10200), [heroui-inc/heroui#6348](https://github.com/heroui-inc/heroui/issues/6348)). `src/components/ui/provider.tsx` has been hand-edited (a deliberate exception to the "vendored, don't hand-edit" rule above) to drop `ColorModeProvider` and use `ChakraProvider` with `defaultSystem` directly — the app is light-mode only for now. Re-add `ColorModeProvider` from `src/components/ui/color-mode.tsx` once dark mode is actually needed and the upstream bug is resolved; don't blindly re-run `chakra snippet add` over `provider.tsx` without re-checking this first.
- **Auth**: none — `apps/website` makes zero Supabase calls. It previously scaffolded `@supabase/ssr` session handling (`src/lib/supabase/*`, a `src/proxy.ts` session-refresh middleware), but that was removed per [ADR 0001](adr/0001-auth-owned-entirely-by-client.md): the website's cookie-based session and `apps/client`'s browser-storage session don't share across the root domain and `play.` subdomain anyway, so the website just links out to `apps/client` instead of hosting any auth UI or session logic itself.
- **Linting/formatting**: `apps/website/biome.json` is a nested config (`"root": false, "extends": "//"`) so it inherits the monorepo's Biome rules (tabs, double quotes, no default exports, …), with narrow `overrides` for the file globs where Next.js's own conventions require a default export (`page.tsx`, `layout.tsx`, `next.config.ts`, etc. — see `docs/code-style.md`).
- **Tooling installed alongside this app**: the Chakra UI MCP server (`chakra-ui` in root `.mcp.json`, `@chakra-ui/react-mcp`) for component/prop/theme lookups, and the `vercel-react-best-practices` / `vercel-composition-patterns` skills (installed via `npx skills add vercel-labs/agent-skills`, tracked in `.claude/skills/`) for Next.js/React authoring guidance.

## Tooling

- Package manager / workspaces: Bun native `workspaces`.
- Lint + format: Biome (single tool; replaces ESLint + Prettier).
- Logging: structured logger (pino) in all server-side code, from day one.

## Open questions

- Testing strategy (unit/integration/e2e scope) — deferred until core systems exist.
- Working title for the project is still TBD (see root `README.md`).

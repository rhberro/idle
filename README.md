# Idle (working title)

A browser-based idle MMORPG heavily inspired by Tibia — not a clone, but drawing on its grid-based movement, pixel-art aesthetic, and monster/item naming conventions.

## Status

Early development / pre-alpha. The concept is defined and the monorepo skeleton is in place (see below); no real game systems yet. This is a serious, long-term project — private for now.

## Concept

- **Grid-based movement**, pixel art style, Tibia-flavored world/monster/item naming — inspired by, not a copy of, Tibia.
- **The idle loop**: you configure your character's behavior — when to use skills, when to drink potions, which monsters to target and how — then close the game. Your character (or group) keeps hunting based on that configuration even while you're offline, simulated server-side.
- **Multiplayer from day one.** This is a persistent shared world with other players, not a single-player game that merely feels like an MMO — the server is authoritative and multiplayer isn't a later add-on.
- **Long-term goal**: sustainable monetization via premium accounts, a season pass, and subscriptions, once the core game justifies it.

## Tech Stack

Built on Bun end to end, with one deliberate per-app exception for `apps/website`. See [`docs/architecture.md`](docs/architecture.md) for the full picture (services, Supabase, client stack) and [`docs/code-style.md`](docs/code-style.md) for coding conventions — both are also loaded automatically for Claude via `CLAUDE.md`.

- `Bun.serve()` for every HTTP/WebSocket process (client and each backend service) — `apps/website` is the exception, see below
- Supabase (Postgres, Auth, Realtime, Storage) via `supabase-js`/`@supabase/ssr` for all persistence and auth
- `apps/client`: HTML imports + a bundled frontend (React, PixiJS for the world view, Chakra UI v3 with `strictTokens`, Zustand)
- `apps/website`: Next.js (App Router) + Chakra UI — its own framework/dev server, not `Bun.serve()`/HTML imports; still run via Bun (`bun run dev`, etc.)
- Biome for linting/formatting, `bun test` for tests

## Project Layout

```
apps/
  client/          the game client        — bun run --cwd apps/client dev        (http://localhost:3000)
  website/         marketing/landing site — bun run --cwd apps/website dev       (http://localhost:3001)
services/
  api-gateway/     REST backend           — bun run --cwd services/api-gateway dev    (http://localhost:4001)
  game-server/     real-time world sim    — bun run --cwd services/game-server dev    (http://localhost:4002)
  chat/            chat/social            — bun run --cwd services/chat dev           (http://localhost:4003)
packages/
  shared/          types, game constants, WS/API protocol — consumed by the above, not run directly
supabase/
  config.toml      Supabase CLI project config — linked to the remote "mmorpg" project
  schemas/         declarative schema (*.sql) — edit here, then generate a migration
  migrations/      generated migrations (not hand-written)
```

## Getting Started

Install dependencies for every workspace package:

```bash
bun install
```

Run any individual app or service in dev mode (hot reload) from its own directory, or with `--cwd` from the root:

```bash
bun run --cwd apps/client dev
```

Each service reads its config from an `.env` file — copy the `.env.example` in that service's folder to get started. Every app/service can start and pass its health check without real Supabase credentials configured; you'll need them once code actually talks to Supabase. `apps/client`'s public vars must be `PUBLIC_`-prefixed and `apps/website`'s must be `NEXT_PUBLIC_`-prefixed (two different inlining mechanisms — see [`docs/architecture.md`](docs/architecture.md#environment-variables)) or they won't reach the browser bundle.

The Supabase CLI is already linked to the project (`supabase link`). To pull/push schema changes you'll need the database password in the root `.env` as `DATABASE_PASSWORD` (used as `SUPABASE_DB_PASSWORD` for CLI commands, e.g. `SUPABASE_DB_PASSWORD=$DATABASE_PASSWORD supabase db diff --linked`).

## Roadmap

- [ ] Core server: persistent world state, accounts, grid-based movement
- [ ] Automation config system (skill/potion/target rules) driving offline hunting
- [ ] Combat and monster AI
- [ ] Items, inventory, and economy
- [ ] Guilds and social systems
- [ ] Premium accounts, season pass, subscription tiers

## License

Private and proprietary. All rights reserved — not for redistribution.

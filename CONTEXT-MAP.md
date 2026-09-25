# Context Map

## Contexts

- [apps/client](./apps/client/CONTEXT.md): the game itself — owns the player-facing Account/auth lifecycle end to end
- [packages/shared](./packages/shared/CONTEXT.md): types, constants, and protocol/validation shared across apps and services — no runtime logic of its own
- [services/game-server](./services/game-server/CONTEXT.md): authoritative live simulation of a World — Character positions and movement while connected

## Relationships

- **apps/client → packages/shared**: consumes the `Character` type (and other shared entities/protocol schemas); `packages/shared` has no dependency back
- **apps/client ↔ apps/website**: `apps/website` has no context of its own yet — it holds no domain concepts, since it never touches Supabase Auth or any other game data (see [ADR 0001](./docs/adr/0001-auth-owned-entirely-by-client.md))
- **services/game-server → packages/shared**: consumes the `Character`/`World`/`Position` types and the movement protocol schemas; no dependency back
- **apps/client ↔ services/game-server**: `apps/client` opens an authenticated WebSocket to the game-server instance for a Character's World; `services/game-server` is the source of truth for live position while connected, `apps/client` only renders it

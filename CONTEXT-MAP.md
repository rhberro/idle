# Context Map

## Contexts

- [apps/client](./apps/client/CONTEXT.md): the game itself — owns the player-facing Account/auth lifecycle end to end
- [packages/shared](./packages/shared/CONTEXT.md): types, constants, and protocol/validation shared across apps and services — no runtime logic of its own

## Relationships

- **apps/client → packages/shared**: consumes the `Character` type (and other shared entities/protocol schemas); `packages/shared` has no dependency back
- **apps/client ↔ apps/website**: `apps/website` has no context of its own yet — it holds no domain concepts, since it never touches Supabase Auth or any other game data (see [ADR 0001](./docs/adr/0001-auth-owned-entirely-by-client.md))

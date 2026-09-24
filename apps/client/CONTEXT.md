# Client

The game itself. Owns the entire player-facing Account/authentication lifecycle — see [ADR 0001](../../docs/adr/0001-auth-owned-entirely-by-client.md).

## Language

**Account**:
The authenticated identity created via Supabase Auth (email/password or Google sign-in). `apps/website` never authenticates a user or knows whether one is signed in — that lives entirely here. One Account can own multiple Characters (see [packages/shared](../../packages/shared/CONTEXT.md)).
_Avoid_: User, Login, Player (when referring to the identity — see Character)

# Game Server

Owns live, authoritative simulation for a single [World](../../packages/shared/CONTEXT.md) while its Characters are connected: positions and movement today, combat/automation later — see [docs/architecture.md](../../docs/architecture.md) for why this must keep simulating even without a connected client.

## Language

**Online**:
A Character with a live, authenticated WebSocket connection to its World's game-server instance right now. Distinct from merely existing in the `characters` table — most Characters are offline at any moment.
_Avoid_: Connected, Active, Logged in (fine informally, but use Online in code/docs for consistency)

**Instance** (not yet implemented):
A temporary, party-scoped hunting ground for a group of 1–20 Characters: its own map and settings, visible only to its own participants, created on demand and torn down when the hunt ends. Structurally the same primitive as a [World](../../packages/shared/CONTEXT.md) — an isolated simulation with its own map and its own scoped broadcast — just short-lived, much smaller, and created at runtime instead of seeded up front. Naming this now so the vocabulary is settled before the feature exists.
_Avoid_: Room, Session (Room is Colyseus's term for this same concept — we deliberately don't use Colyseus, see [ADR 0003](../../docs/adr/0003-custom-game-server-over-colyseus.md))

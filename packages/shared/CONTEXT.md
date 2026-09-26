# Shared

Types, game constants, and protocol/validation shared between apps and services. No runtime/DB/framework-specific logic.

## Language

**Character**:
The in-world entity a person controls: name, position, health, and the rest of what plays the game. Belongs to exactly one Account (see [apps/client](../../apps/client/CONTEXT.md)); an Account can have several. Also belongs to exactly one World, permanently from creation — a Character never transfers between Worlds. Supersedes the placeholder `Player` type here, which conflated this with Account and is being renamed/reworked.
_Avoid_: Player, Avatar, User

**World**:
An isolated instance of the game: its own map and its own population of Characters, sharing no live state with any other World. Exists so players can be spread across multiple server processes instead of one process serving everyone — see [ADR 0003](../../docs/adr/0003-custom-game-server-over-colyseus.md). [services/game-server](../../services/game-server/CONTEXT.md) is the authoritative simulation of a World's live state while its Characters are connected.
_Avoid_: Server, Shard, Realm

**Level**:
The Character's progression state: a positive integer `level` and a cumulative integer `experience` (total XP earned across the Character's lifetime, not just within the current level). The XP required to advance from level L to L+1 is `50·(L² − 3L + 4)` — Tibia's cubic curve, identical to CipSoft's `E(L+1) − E(L)` and to Canary's `getExpForLevel`. Owned server-side per ADR 0006; the client renders a per-level percent readout (`experiencePercentInLevel`) computed and pushed by the game-server.
_Avoid_: XP bar (it's a per-level percent, not a global accumulator), tier, prestige

**Vitals**:
The Character's per-instance resource state: `health`, `maxHealth`, `mana`, `maxMana`. Distinct from [Level](#level) because vitals change during play (and will be mutated by combat), while level only changes at level-up. Currently `health = maxHealth` and `mana = maxMana` for every Character (no damage source yet, no mana cost yet); values are held server-authoritatively and pushed to the owning client via `own-character-status` — see ADR 0006.
_Avoid_: stats (too generic — also covers Level), HP/MP (informal; use the canonical names)

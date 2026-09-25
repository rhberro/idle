# Shared

Types, game constants, and protocol/validation shared between apps and services. No runtime/DB/framework-specific logic.

## Language

**Character**:
The in-world entity a person controls: name, position, health, and the rest of what plays the game. Belongs to exactly one Account (see [apps/client](../../apps/client/CONTEXT.md)); an Account can have several. Also belongs to exactly one World, permanently from creation — a Character never transfers between Worlds. Supersedes the placeholder `Player` type here, which conflated this with Account and is being renamed/reworked.
_Avoid_: Player, Avatar, User

**World**:
An isolated instance of the game: its own map and its own population of Characters, sharing no live state with any other World. Exists so players can be spread across multiple server processes instead of one process serving everyone — see [ADR 0003](../../docs/adr/0003-custom-game-server-over-colyseus.md). [services/game-server](../../services/game-server/CONTEXT.md) is the authoritative simulation of a World's live state while its Characters are connected.
_Avoid_: Server, Shard, Realm

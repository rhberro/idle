# Shared

Types, game constants, and protocol/validation shared between apps and services. No runtime/DB/framework-specific logic.

## Language

**Character**:
The in-world entity a person controls: name, position, health, and the rest of what plays the game. Belongs to exactly one Account (see [apps/client](../../apps/client/CONTEXT.md)); an Account can have several. Supersedes the placeholder `Player` type here, which conflated this with Account and is being renamed/reworked.
_Avoid_: Player, Avatar, User

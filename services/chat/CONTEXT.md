# Chat

Owns real-time chat transport across every World: authenticates connections the same way [services/game-server](../../services/game-server/CONTEXT.md) does, enforces per-connection send-rate limiting, and broadcasts a sender's message to every other connection subscribed to that same World's Topic. Unlike `game-server`, this is a single multi-tenant process, not one process per World — chat has no continuous per-tick simulation state to isolate, so a World-keyed Bun pub/sub Topic is enough to scope broadcasts correctly without the operational cost of a dedicated process per World.

## Language

**Channel**:
The scope a chat message belongs to, carried as the message's own discriminator field (mirroring how [packages/shared](../../packages/shared/CONTEXT.md)'s game-server protocol discriminates on `type`). `global` is the only Channel today — sent to, and broadcast to, every [Online](../../services/game-server/CONTEXT.md) Character in the sender's World. Shaped as a discriminated union from the start specifically so future Channels (Private, Party, System) extend it without a breaking protocol change; none of those exist yet.
_Avoid_: Room

**Topic**:
Bun's own pub/sub primitive name (`ws.subscribe`/`ws.publish`) — not a domain concept of its own. This service subscribes each connection to a Topic keyed by its World id on connect (`chat:<worldId>`), and the Global Channel publishes onto that same Topic, so a single process can hold connections from many Worlds while never leaking a broadcast across them. Don't conflate this with Channel: Topic is the transport-level scoping mechanism a connection subscribes to, Channel is the message-level discriminator carried in the payload itself. They happen to line up one-to-one for Global today only because Global is scoped to "everyone in this World" — a future Channel scoped narrower than a whole World (Party, Private) would need its own, differently-keyed Topic (e.g. by party id), not the World-keyed one Global uses.

**Broadcast**:
The message this service sends out to every other connection after receiving and validating one from a sender's connection. Always carries the sending Character's id and name attached server-side from the authenticated connection itself — never a value read from the client's own payload, which is what stops a Character from speaking as another.
_Avoid_: Message on its own for the outgoing shape — use "Message" for what a client sends in, "Broadcast" for what the service sends back out; the two are distinct schemas with different fields.

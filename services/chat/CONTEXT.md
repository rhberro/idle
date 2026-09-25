# Chat

Owns real-time chat transport for a single [World](../../packages/shared/CONTEXT.md): authenticates connections the same way [services/game-server](../../services/game-server/CONTEXT.md) does, enforces per-connection send-rate limiting, and broadcasts a sender's message to every other connection this process holds — see [docs/architecture.md](../../docs/architecture.md) for why one process serves exactly one World.

## Language

**Channel**:
The scope a chat message belongs to, carried as the message's own discriminator field (mirroring how [packages/shared](../../packages/shared/CONTEXT.md)'s game-server protocol discriminates on `type`). `global` is the only Channel today — sent to, and broadcast to, every [Online](../../services/game-server/CONTEXT.md) Character in this process's World. Shaped as a discriminated union from the start specifically so future Channels (Private, Party, System) extend it without a breaking protocol change; none of those exist yet.
_Avoid_: Room, Topic (Topic is Bun's own pub/sub primitive name; this service broadcasts by iterating its registered connections directly rather than `ws.subscribe`/`server.publish`, so calling a Channel a "Topic" would conflate the two)

**Broadcast**:
The message this service sends out to every other connection after receiving and validating one from a sender's connection. Always carries the sending Character's id and name attached server-side from the authenticated connection itself — never a value read from the client's own payload, which is what stops a Character from speaking as another.
_Avoid_: Message on its own for the outgoing shape — use "Message" for what a client sends in, "Broadcast" for what the service sends back out; the two are distinct schemas with different fields.

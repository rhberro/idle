# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT-MAP.md`** at the repo root: it points at one `CONTEXT.md` per context. Read each one relevant to the topic.
- **`docs/adr/`**: system-wide decisions. Also check `<package>/docs/adr/` (e.g. `apps/client/docs/adr/`, `services/game-server/docs/adr/`) for context-scoped decisions in the area you're about to work in.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

This repo is multi-context — each app/service/package under `apps/`, `services/`, `packages/` is its own context, per `docs/architecture.md`:

```
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← system-wide decisions
├── apps/
│   ├── client/
│   │   ├── CONTEXT.md
│   │   └── docs/adr/                  ← context-specific decisions
│   └── website/
│       ├── CONTEXT.md
│       └── docs/adr/
├── services/
│   ├── api-gateway/
│   │   ├── CONTEXT.md
│   │   └── docs/adr/
│   ├── game-server/
│   │   ├── CONTEXT.md
│   │   └── docs/adr/
│   └── chat/
│       ├── CONTEXT.md
│       └── docs/adr/
└── packages/
    └── shared/
        ├── CONTEXT.md
        └── docs/adr/
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in the relevant `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_

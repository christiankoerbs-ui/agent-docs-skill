# Core — preexisting-docs-fixture

## Domain glossary

- **Session** — short-lived credential proving a user is authenticated.
- **User** — persisted account record.

## Invariants

- Every authenticated request resolves to exactly one User via Session.
- Sessions expire 24h after creation.

## Cross-cutting rules

(none)

## Shared utilities

(none)

## Anchors

- src/auth/session.ts:1-19
- src/users/repo.ts:1-13

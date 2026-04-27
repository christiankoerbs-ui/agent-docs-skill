# Module — auth

## Purpose

Issue and validate short-lived sessions for users.

## Entry point

src/auth/session.ts

## Public API

- `createSession(userId): Session`
- `validateSession(token): Session | null`

## Internal layering

Single-file in-memory store; no further layering.

## Dependencies

(none — uses built-in `crypto.randomUUID`)

## Invariants

- Sessions expire 24h after creation.
- Expired sessions return `null` from `validateSession`.

## Anchors

- src/auth/session.ts:1-19

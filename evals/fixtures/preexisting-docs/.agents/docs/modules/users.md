# Module — users

## Purpose

CRUD for persisted user accounts.

## Entry point

src/users/repo.ts

## Public API

- `createUser(user): User`
- `getUser(id): User | undefined`

## Internal layering

Single-file in-memory map.

## Dependencies

(none)

## Invariants

- User IDs are unique.

## Anchors

- src/users/repo.ts:1-13

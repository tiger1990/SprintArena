# ADR-001: Supabase as the Backend Platform

**Date:** 2026-03-28
**Status:** Decided
**Deciders:** Principal Architect

---

## Context

SprintBrain needs a backend platform covering: database, auth, realtime sync, and file storage. We evaluated three options.

## Options Considered

| Criterion | Supabase | PlanetScale + Auth.js | Firebase |
|-----------|---------|----------------------|---------|
| Database | PostgreSQL (full SQL) | MySQL (Vitess) | Firestore (NoSQL) |
| Auth | Built-in, OAuth, invite links | Auth.js (manual setup) | Firebase Auth |
| Realtime | DB-level broadcast | Manual WebSocket | Firebase Realtime |
| Row Level Security | ✅ Native, SQL-based | ❌ App-layer only | ❌ Rules language |
| TypeScript types from schema | ✅ `supabase gen types` | ❌ Manual | ❌ Manual |
| Self-hostable | ✅ | ❌ PlanetScale no | ❌ |
| Free tier | ✅ Generous | ✅ PlanetScale free | ✅ |
| Vendor lock-in | Low (standard Postgres) | Low | **High** |
| Complexity | Low (1 SDK) | High (4+ libraries) | Medium |

## Decision

**Supabase.**

## Rationale

1. **RLS is the security model** — Row Level Security enforces workspace isolation at the database layer, not the application layer. This means no matter how the app is called (API, direct SQL client, migration scripts), the isolation holds. PlanetScale and Firebase cannot offer this.

2. **Single SDK for 4 concerns** — Auth, DB, Realtime, Storage all through `@supabase/supabase-js`. PlanetScale + Auth.js + Pusher + S3 is 4 separate integrations, 4 failure points, 4 billing relationships.

3. **Realtime is table-triggered** — Supabase broadcasts changes automatically when DB rows change. No webhook setup, no event bus. When admin ends sprint, all clients see the winner simultaneously with zero extra code.

4. **Postgres = no constraints** — Complex queries (sprint leaderboard, velocity trends, badge aggregations) are trivial in SQL. Firestore's query model would require denormalization and Cloud Functions.

5. **Generated TypeScript types** — `supabase gen types typescript` produces exact DB types. No type drift between DB and code.

## Consequences

- Must manage Supabase project (free tier has limits: 500MB DB, 2 projects)
- Realtime has connection limits on free tier (200 concurrent)
- Must not expose `SUPABASE_SERVICE_KEY` to the client (enforced via `server.ts` vs `client.ts` pattern)
- Migration from localStorage prototype requires a one-time data migration script

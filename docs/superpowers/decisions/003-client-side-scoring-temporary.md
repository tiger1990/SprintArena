# ADR-003: Client-Side Scoring (Temporary)

**Date:** 2026-03-28
**Status:** Temporary — must move server-side before production launch
**File:** `src/lib/scoring/engine.ts`, called from `src/store/slices/sprintSlice.ts`

---

## Context

Scoring needs to be computed when a sprint ends. In the production architecture, this runs server-side via `POST /api/sprints/:id/score`. During the localStorage prototype phase, we run it client-side synchronously.

## Decision

Run scoring client-side in `sprintSlice.endSprint()` for the prototype. The engine (`engine.ts`) is pure TypeScript with no side effects and 31 unit tests — it can move to a server route without modification.

## Why This Is Acceptable For Now

1. `engine.ts` is **pure** — no I/O, no side effects, same input = same output
2. The function signature matches what a server route would call
3. Unit tests cover all 8 badges and all scoring rules
4. No real financial stakes in the prototype phase

## Why This Must Move Server-Side Before Launch

| Risk | Severity |
|------|---------|
| User can open DevTools, modify localStorage `sprintResults` | High |
| User can pass fabricated `historicalResults` to award themselves hat_trick | High |
| Different browser may have different sprint history (out-of-sync) | High |
| Two admins end sprint simultaneously → two different result sets | Medium |

## Migration Path

```
Current:  sprintSlice.endSprint() → engine.calculateSprintScores() → set(state)
Target:   sprintSlice.endSprint() → POST /api/sprints/:id/end → server calculates →
          Supabase stores results → Realtime broadcasts to all clients →
          clients update Zustand from broadcast
```

The `engine.ts` file moves to `src/lib/scoring/engine.ts` unchanged (already there). The API route imports and calls it. The Zustand slice stops calling the engine directly — it calls the API and listens for the realtime result.

## Acceptance Criteria for Removal

This ADR is closed when:
- [ ] `POST /api/sprints/:id/end` exists and calls `engine.ts`
- [ ] Scoring results written to `sprint_results` table in Supabase
- [ ] `sprintSlice.endSprint()` no longer imports `engine.ts`
- [ ] E2E test verifies scoring via API (not via client state inspection)

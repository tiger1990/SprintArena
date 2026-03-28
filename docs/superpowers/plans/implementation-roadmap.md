# SprintBrain — Implementation Roadmap

**Date:** 2026-03-28
**Owner:** Principal Architect
**Status:** Active — Phase 1 prototype complete, production migration pending

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Implemented and tested |
| 🔶 | Partially implemented (prototype/localStorage only) |
| ❌ | Not started |
| 🔒 | Blocked by a dependency |

---

## Overall Progress

```
Phase 1 — Foundation          ████████░░  75% (prototype done, DB/Auth pending)
Phase 2 — AI + Sprint         ████████░░  80% (scoring/badges done, email/stream pending)
Phase 3 — Analytics + Polish  ██░░░░░░░░  20% (dashboard stub only)
Phase 4 — Production Hard.    ███░░░░░░░  25% (rate limit + tests done, rest pending)
```

---

## Phase 1 — Foundation

**Goal:** Every core user action works end-to-end with real persistence and real auth.

### 1.1 Authentication & Onboarding

| Item | Status | Notes |
|------|--------|-------|
| Signup page (workspace + admin name) | ✅ | localStorage only |
| Login page | ✅ | localStorage only (no password) |
| Invite code generation | ✅ | localStorage only |
| Join via invite link `/join/[code]` | ✅ | localStorage only |
| Supabase Auth signup (email + password) | ❌ | See `specs/auth-and-onboarding.md` |
| Supabase Auth login | ❌ | |
| JWT session (httpOnly cookie) | ❌ | |
| OAuth providers (Google, GitHub) | ❌ | Post-launch |
| Server-side auth guard (middleware) | ❌ | Currently client-side only |
| Password reset flow | ❌ | |

### 1.2 Database (Supabase / PostgreSQL)

| Item | Status | Notes |
|------|--------|-------|
| Supabase project + schema migration | ❌ | SQL in `specs/2026-03-28-production-architecture-design.md §4` |
| Row Level Security policies | ❌ | SQL in same spec §5 |
| Workspace CRUD | 🔶 | localStorage |
| User CRUD | 🔶 | localStorage |
| Sprint CRUD | 🔶 | localStorage |
| Story CRUD | 🔶 | localStorage |
| AC, Comments, Notifications | 🔶 | localStorage |
| Audit log (immutable) | 🔶 | localStorage, capped at 500 entries |
| Data migration script (localStorage → Supabase) | ❌ | Needed for beta users |

### 1.3 Team Management

| Item | Status | Notes |
|------|--------|-------|
| Add team member (admin) | ✅ | |
| Remove / deactivate member | ✅ | |
| Role assignment | ✅ | admin / assignee |
| Sprint exclusions (leave) | ✅ | |
| Profile photo upload | ❌ | Supabase Storage required |
| Avatar fallback (initials) | ✅ | |

### 1.4 Navigation & Shell

| Item | Status | Notes |
|------|--------|-------|
| Sidebar with role-filtered nav | ✅ | |
| Mobile bottom nav | ✅ | |
| `_hasHydrated` guard on role-gated pages | ✅ | |
| Server-side auth redirect (middleware) | ❌ | 🔒 Requires real auth |
| Hydration guard on all 4 admin pages | ✅ | |

---

## Phase 2 — AI + Sprint Lifecycle

**Goal:** Full sprint lifecycle from backlog → board → scoring → winner.

### 2.1 AI Backlog Generator

| Item | Status | Notes |
|------|--------|-------|
| GPT-4o story generation | ✅ | `src/app/api/generate/route.ts` |
| Mock fallback (no API key) | ✅ | |
| Input validation + 2000 char cap | ✅ | |
| Rate limiting (in-memory) | ✅ | Single-process only |
| Rate limiting (Redis/Upstash) | ❌ | Production requirement |
| Streaming responses | ❌ | Currently buffered, not streamed |
| Save to backlog | ✅ | |
| Add to active sprint | ✅ | Admin only |
| Propose to admin (assignee flow) | ✅ | |

### 2.2 Sprint Lifecycle

| Item | Status | Notes |
|------|--------|-------|
| Sprint creation form | ✅ | |
| Planning → Active transition guard | ✅ | `sprintSlice.startSprint` |
| Active → Completed transition guard | ✅ | `sprintSlice.endSprint` |
| Spill decisions on end sprint | ✅ | |
| Sprint dates + capacity | ✅ | |
| Sprint goal field | ✅ | |
| `startedAt` timestamp | ✅ | |
| Sprint review stage (`review` status) | ❌ | Spec §7 has 5 states; code has 3 |
| Server-side end sprint (API) | ❌ | 🔒 Requires DB |

### 2.3 Kanban Board

| Item | Status | Notes |
|------|--------|-------|
| 4-column board (todo/in_progress/review/done) | ✅ | |
| Drag-and-drop (dnd-kit) | ✅ | |
| Quick action buttons (always visible) | ✅ | |
| Story detail drawer | ✅ | |
| Acceptance criteria toggle | ✅ | |
| Comments + blocker flag | ✅ | |
| WIP limit enforcement (visual) | ❌ | Settings exist, no enforcement UI |
| Story assignment from board | ❌ | Admin-only, requires team picker |
| Optimistic updates + conflict resolution | ❌ | 🔒 Requires realtime |

### 2.4 Scoring Engine

| Item | Status | Notes |
|------|--------|-------|
| Base story points | ✅ | `src/lib/scoring/engine.ts` |
| Early completion ×1.25 multiplier | ✅ | |
| Critical story +5 bonus | ✅ | |
| Clean sprint +10 bonus | ✅ | |
| Spill penalty −2 | ✅ | |
| Blocker waiver on spill | ✅ | |
| Admin exclusion from scoring | ✅ | |
| Sprint exclusion (leave) | ✅ | |
| 31 unit tests | ✅ | Vitest |
| Server-side enforcement | ❌ | Currently runs client-side |

### 2.5 Badge System

| Item | Status | Notes |
|------|--------|-------|
| `sprint_mvp` | ✅ | |
| `clean_sprint` | ✅ | |
| `critical_crusher` | ✅ | |
| `speed_demon` | ✅ | |
| `first_blood` | ✅ | |
| `hat_trick` (3 consecutive wins) | ✅ | Requires `historicalResults` |
| `iron_dev` (5+ sprints eligible) | ✅ | |
| `comeback_kid` (improved rank) | ✅ | |
| Badge display on winner page | ✅ | |
| Hall of Fame | ✅ | |

### 2.6 Notifications

| Item | Status | Notes |
|------|--------|-------|
| In-app notifications (localStorage) | ✅ | |
| Unread badge count in sidebar | ✅ | |
| Sprint start notification | ✅ | |
| Sprint end + winner notification | ✅ | |
| Email via Resend | ❌ | |
| Realtime push (Supabase Realtime) | ❌ | 🔒 Requires DB |

### 2.7 Retrospective

| Item | Status | Notes |
|------|--------|-------|
| Create/edit retrospective | ✅ | |
| What went well / didn't / actions | ✅ | |
| Admin-only edit | ✅ | |
| Assignee read-only view | ✅ | |
| Attach to completed sprint | ✅ | |

---

## Phase 3 — Analytics + Polish

| Item | Status | Notes |
|------|--------|-------|
| Dashboard stats cards | ✅ | |
| Sprint progress widget | ✅ | |
| Leaderboard widget | ✅ | |
| Burndown chart | ❌ | |
| Velocity chart (rolling average) | ❌ | |
| Sprint archive page | ❌ | |
| Sprint analytics page `/sprints/[id]/analytics` | ❌ | |
| Winner certificate PDF export | ❌ | |
| Command palette (⌘K) | ❌ | |
| Web push notifications | ❌ | |

---

## Phase 4 — Production Hardening

| Item | Status | Notes |
|------|--------|-------|
| In-memory rate limiter | ✅ | Single process only |
| Upstash Redis rate limiter | ❌ | Required for Vercel/multi-instance |
| Playwright E2E suite | ✅ | 42/42 passing (Chromium) |
| Vitest unit tests (scoring) | ✅ | 31/31 passing |
| TypeScript strict — 0 errors | ✅ | |
| `next.config.ts` image allowlist | ✅ | |
| ErrorBoundary (root + board + AI) | ✅ | |
| Audit log with 500-entry cap | ✅ | |
| Sentry error monitoring | ❌ | |
| Lighthouse ≥90 | ❌ | |
| WCAG AA audit | ❌ | |
| PWA / offline support | ❌ | |
| Mobile Playwright tests (Pixel 5) | ❌ | |

---

## Critical Path to Production

The minimum changes required to launch with real users (in priority order):

1. **Supabase Auth** — replaces localStorage auth (1–2 days)
2. **Supabase DB + RLS** — replaces localStorage data (2–3 days)
3. **Upstash Redis rate limiter** — replaces in-memory (2 hours)
4. **Vercel deployment** — environment vars, domain (2 hours)
5. **Resend email** — sprint start/end notifications (1 day)
6. **Supabase Realtime** — multi-user sync (2–3 days)

**Estimated time to first real user:** ~7–10 working days.

---

## Related Documents

- [Production Architecture Design](../specs/2026-03-28-production-architecture-design.md)
- [Auth & Onboarding Spec](../specs/auth-and-onboarding.md)
- [Scoring & Badges Spec](../specs/scoring-and-badges.md)
- [ADR-001: Supabase Decision](../decisions/001-supabase-over-alternatives.md)
- [ADR-002: Zustand Slice Pattern](../decisions/002-zustand-slice-pattern.md)
- [ADR-003: Client-Side Scoring (Temporary)](../decisions/003-client-side-scoring-temporary.md)

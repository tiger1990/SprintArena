# SprintBrain — Architecture & Planning Docs

**Project:** SprintBrain — AI-powered Agile sprint planning SaaS
**Stack:** Next.js 16.2.1 · React 19 · Zustand 5 · Tailwind 4 · Vitest · Playwright
**Current phase:** Prototype complete. Production migration (Supabase + Auth) pending.

---

## Documents

### Plans

| Document | Purpose |
|----------|---------|
| [Implementation Roadmap](plans/implementation-roadmap.md) | Complete feature status (✅/🔶/❌), critical path to production, phase breakdown |

### Specs

| Document | Purpose |
|----------|---------|
| [Production Architecture Design](specs/2026-03-28-production-architecture-design.md) | System architecture, DB schema, API design, RLS, caching, security checklist |
| [Auth & Onboarding](specs/auth-and-onboarding.md) | Signup, login, invite, session management, migration from localStorage |
| [Scoring & Badges](specs/scoring-and-badges.md) | Scoring rules, all 8 badge criteria, engine design, test coverage |

### Architecture Decision Records (ADR)

| ADR | Decision |
|-----|---------|
| [ADR-001](decisions/001-supabase-over-alternatives.md) | Supabase chosen over PlanetScale + Auth.js or Firebase |
| [ADR-002](decisions/002-zustand-slice-pattern.md) | Zustand domain slice pattern with custom hooks layer |
| [ADR-003](decisions/003-client-side-scoring-temporary.md) | Scoring runs client-side temporarily; must move server-side pre-launch |

---

## Quick Status

```
Tests:    Vitest 31/31 ✅ | Playwright 42/42 ✅ | TypeScript 0 errors ✅
P0 gaps:  Real auth (Supabase) | Database persistence | Redis rate limiter
P1 gaps:  Realtime sync | Email notifications | AI streaming
```

---

## Adding a Document

- **Plan:** Add to `plans/` — implementation details, task breakdown, timelines
- **Spec:** Add to `specs/` — feature behaviour, API contracts, data shapes
- **ADR:** Add to `decisions/` — one decision per file, format: `NNN-decision-slug.md`

ADR format:
```markdown
# ADR-NNN: Title
**Date:** YYYY-MM-DD | **Status:** Proposed / Decided / Superseded
## Context | ## Options | ## Decision | ## Rationale | ## Consequences
```

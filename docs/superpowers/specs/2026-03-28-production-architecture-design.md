# SprintBrain — Production Architecture Design

**Date:** 2026-03-28
**Authors:** Staff Principal Architect + Claude Code
**Status:** Approved — ready for implementation planning

---

## Discrepancies From Original Doc

The original spec references "Next.js 14 App Router". The actual project uses:

- **Next.js 16.2.1** (not 14) — App Router is present; APIs may differ from training data
- **React 19.2.4** (not 18)
- **Zustand 5.0.12** (not 4.x — API differs)

> **Rule:** Per `AGENTS.md`, always read `node_modules/next/dist/docs/` before writing any Next.js code. Do NOT rely on training data for API shapes.

All implementation must target the **actual installed versions**, not the versions named in this doc.

---

## 1. The Fundamental Problem With Previous Architecture

Everything built so far was on localStorage. That collapses under:

- Multi-user simultaneously editing → data conflicts
- Browser cache cleared → all data lost
- Mobile + desktop same user → no sync
- Admin ends sprint → assignee never knows
- Two tabs open → race conditions

**Verdict:** localStorage is a prototype tool, not an architecture. We design for production from day one, with a localStorage adapter only as a fallback for offline/demo mode.

---

## 2. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                                                                 │
│  Next.js App Router (v16)                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Pages   │  │Components│  │  Hooks   │  │  Zustand Store│  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────────┘  │
│                          ↕ Supabase Client (Realtime)           │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │    NEXT.JS API LAYER   │
                    │    (Route Handlers)    │
                    │                       │
                    │  /api/auth/*          │
                    │  /api/sprints/*       │
                    │  /api/stories/*       │
                    │  /api/generate        │
                    │  /api/scoring         │
                    │  /api/notifications/* │
                    └───────────┬───────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
 ┌────────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
 │    SUPABASE     │  │    OPENAI API   │  │     RESEND      │
 │                 │  │                 │  │   (Email)       │
 │  PostgreSQL     │  │  gpt-4o         │  │                 │
 │  Auth (JWT)     │  │  Structured     │  │  Winner cert    │
 │  Realtime       │  │  JSON output    │  │  Assignment     │
 │  Storage        │  │  Streaming      │  │  Sprint end     │
 │  Row Level Sec  │  └─────────────────┘  └─────────────────┘
 └────────┬────────┘
          │
 ┌────────▼────────┐
 │  REDIS (Upstash)│
 │                 │
 │  Rate limiting  │
 │  Leaderboard    │
 │  Session cache  │
 │  API responses  │
 └─────────────────┘
```

---

## 3. Technology Stack — Final Decisions

| Layer | Choice | Justification |
|---|---|---|
| Framework | Next.js 16 App Router | RSC + API routes in one repo |
| Database | Supabase (PostgreSQL) | RLS, Realtime, Auth, Storage |
| Auth | Supabase Auth | OAuth ready, JWT, invite links |
| Realtime | Supabase Realtime | DB changes broadcast automatically |
| File Storage | Supabase Storage | Profile photos, CDN-backed |
| Client State | Zustand 5 | Cache layer only (not source of truth) |
| Email | Resend | Transactional, React Email templates |
| Cache / Rate Limit | Upstash Redis | Serverless, rate limiting |
| AI | OpenAI gpt-4o | Structured JSON output, streaming |
| Drag & Drop | dnd-kit | Touch support, accessible |
| Animations | Framer Motion | Winner reveal, card transitions |
| UI | Tailwind + shadcn/ui | Accessible primitives |
| Deployment | Vercel | Zero-config Next.js, edge functions |

---

## 4. Complete Database Schema

```sql
-- WORKSPACE
CREATE TABLE workspaces (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  logo_url      TEXT,
  timezone      TEXT NOT NULL DEFAULT 'UTC',
  invite_code   TEXT UNIQUE NOT NULL,
  settings      JSONB NOT NULL DEFAULT '{
    "sprint_duration_days": 14,
    "wip_limits": {"todo": 0, "in_progress": 3, "review": 2},
    "scoring_enabled": true,
    "admin_excluded_from_scoring": true,
    "definition_of_done": "",
    "velocity_window_sprints": 3
  }',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  created_by    UUID
);

-- USERS
CREATE TABLE users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id),
  workspace_id  UUID REFERENCES workspaces(id),
  name          TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin', 'assignee')),
  photo_url     TEXT,
  color         TEXT NOT NULL DEFAULT '#6366f1',
  is_active     BOOLEAN DEFAULT true,
  timezone      TEXT DEFAULT 'UTC',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- SPRINTS
CREATE TABLE sprints (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID REFERENCES workspaces(id),
  name             TEXT NOT NULL,
  goal             TEXT,
  start_date       TIMESTAMPTZ NOT NULL,
  end_date         TIMESTAMPTZ NOT NULL,
  status           TEXT NOT NULL DEFAULT 'planning'
                   CHECK (status IN ('planning','active','review','completed')),
  capacity_points  INTEGER DEFAULT 0,
  velocity_points  INTEGER DEFAULT 0,
  created_by       UUID REFERENCES users(id),
  ended_by         UUID REFERENCES users(id),
  ended_at         TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- STORIES
CREATE TABLE stories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID REFERENCES workspaces(id),
  sprint_id       UUID REFERENCES sprints(id),
  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'proposed'
                  CHECK (status IN (
                    'proposed','backlog','todo',
                    'in_progress','review','done','spilled'
                  )),
  priority        TEXT DEFAULT 'medium'
                  CHECK (priority IN ('low','medium','high','critical')),
  story_points    INTEGER CHECK (story_points IN (1,2,3,5,8,13)),
  assignee_id     UUID REFERENCES users(id),
  created_by      UUID REFERENCES users(id),
  approved_by     UUID REFERENCES users(id),
  rejected_by     UUID REFERENCES users(id),
  rejection_note  TEXT,
  tags            TEXT[] DEFAULT '{}',
  completed_at    TIMESTAMPTZ,
  completed_by    UUID REFERENCES users(id),
  spilled_from    UUID REFERENCES sprints(id),
  order_index     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ACCEPTANCE CRITERIA
CREATE TABLE acceptance_criteria (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id    UUID REFERENCES stories(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  is_met      BOOLEAN DEFAULT false,
  met_by      UUID REFERENCES users(id),
  met_at      TIMESTAMPTZ,
  order_index INTEGER DEFAULT 0
);

-- BADGES
CREATE TABLE badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  icon        TEXT NOT NULL,
  description TEXT NOT NULL,
  criteria    JSONB NOT NULL
);

CREATE TABLE user_badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id),
  badge_key  TEXT REFERENCES badges(key),
  sprint_id  UUID REFERENCES sprints(id),
  earned_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_key, sprint_id)
);

-- SPRINT RESULTS
CREATE TABLE sprint_results (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id           UUID REFERENCES sprints(id),
  user_id             UUID REFERENCES users(id),
  rank                INTEGER,
  points_scored       NUMERIC(6,2),
  stories_completed   INTEGER DEFAULT 0,
  stories_spilled     INTEGER DEFAULT 0,
  stories_total       INTEGER DEFAULT 0,
  on_time_rate        NUMERIC(4,3),
  raw_story_points    INTEGER DEFAULT 0,
  bonus_points        NUMERIC(5,2) DEFAULT 0,
  penalty_points      NUMERIC(5,2) DEFAULT 0,
  is_eligible         BOOLEAN DEFAULT true,
  is_winner           BOOLEAN DEFAULT false,
  UNIQUE(sprint_id, user_id)
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  user_id      UUID REFERENCES users(id),
  type         TEXT NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT,
  action_url   TEXT,
  metadata     JSONB DEFAULT '{}',
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- RETROSPECTIVES
CREATE TABLE retrospectives (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id       UUID REFERENCES sprints(id) UNIQUE,
  what_went_well  TEXT[] DEFAULT '{}',
  what_didnt      TEXT[] DEFAULT '{}',
  action_items    TEXT[] DEFAULT '{}',
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- STORY COMMENTS
CREATE TABLE story_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id   UUID REFERENCES stories(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id),
  body       TEXT NOT NULL,
  is_blocker BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOG (immutable — never delete)
CREATE TABLE audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  user_id      UUID REFERENCES users(id),
  action       TEXT NOT NULL,
  entity_type  TEXT NOT NULL,
  entity_id    UUID,
  old_value    JSONB,
  new_value    JSONB,
  ip_address   INET,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- SPRINT EXCLUSIONS
CREATE TABLE sprint_exclusions (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID REFERENCES sprints(id),
  user_id   UUID REFERENCES users(id),
  reason    TEXT,
  added_by  UUID REFERENCES users(id),
  UNIQUE(sprint_id, user_id)
);
```

---

## 5. Row Level Security

```sql
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Workspace isolation
CREATE POLICY "workspace_isolation" ON stories
  USING (workspace_id = (
    SELECT workspace_id FROM users WHERE id = auth.uid()
  ));

-- Only admin can approve proposed stories
CREATE POLICY "admin_approve_proposed" ON stories
  FOR UPDATE USING (
    status = 'proposed' AND
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Assignee can only move their own stories
CREATE POLICY "assignee_move_own" ON stories
  FOR UPDATE USING (
    assignee_id = auth.uid() OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
```

All tables have equivalent workspace isolation policies. RLS is the primary permission enforcement layer. API layer adds a secondary check (defense in depth).

---

## 6. Complete API Design

```
AUTH
  POST   /api/auth/signup          → create workspace + first admin
  POST   /api/auth/login           → Supabase OAuth/email
  POST   /api/auth/invite          → generate invite code (admin)
  POST   /api/auth/join            → assignee joins via invite code
  DELETE /api/auth/session         → logout

WORKSPACE
  GET    /api/workspace            → workspace settings + team
  PATCH  /api/workspace            → update settings (admin)

SPRINTS
  GET    /api/sprints              → all sprints (paginated)
  POST   /api/sprints              → create sprint (admin)
  GET    /api/sprints/active       → current active sprint
  GET    /api/sprints/:id          → sprint detail
  PATCH  /api/sprints/:id          → update sprint (admin)
  POST   /api/sprints/:id/start    → planning → active (admin)
  POST   /api/sprints/:id/end      → trigger end flow (admin)
  GET    /api/sprints/:id/results  → winner + leaderboard

STORIES
  GET    /api/stories              → all stories (filtered)
  POST   /api/stories              → create story
  GET    /api/stories/:id          → story detail
  PATCH  /api/stories/:id          → update story
  DELETE /api/stories/:id          → delete story
  PATCH  /api/stories/:id/status   → move story (permission-checked)
  POST   /api/stories/:id/approve  → approve proposed (admin)
  POST   /api/stories/:id/reject   → reject proposed (admin)
  POST   /api/stories/:id/assign   → assign to member (admin)

ACCEPTANCE CRITERIA
  POST   /api/stories/:id/ac       → add AC item
  PATCH  /api/ac/:id               → toggle met/unmet
  DELETE /api/ac/:id               → remove AC item

AI
  POST   /api/generate             → stream AI backlog generation

SCORING
  GET    /api/sprints/:id/leaderboard  → live scores
  POST   /api/sprints/:id/score        → calculate final scores (admin)

NOTIFICATIONS
  GET    /api/notifications            → user notifications (paginated)
  PATCH  /api/notifications/:id        → mark read
  PATCH  /api/notifications/read-all   → mark all read

RETROSPECTIVE
  GET    /api/sprints/:id/retro    → get retro
  POST   /api/sprints/:id/retro    → create retro
  PATCH  /api/sprints/:id/retro    → update retro

USERS
  GET    /api/users/:id            → user profile
  PATCH  /api/users/me             → update own profile
  POST   /api/users/me/photo       → upload profile photo
  GET    /api/users/:id/badges     → user achievements
  POST   /api/sprints/:id/exclude/:userId  → mark leave (admin)
```

All routes validated with Zod. All routes authenticated. Rate-limited via Upstash Redis.

---

## 7. Sprint State Machine

```
[PLANNING] → Admin starts sprint → [ACTIVE] → Admin ends sprint →
[REVIEW] → Admin finalizes → [SCORING (internal, seconds)] → [COMPLETED]
```

- PLANNING: Admin assembles backlog, assigns stories, sets dates
- ACTIVE: Team works; realtime updates; spill tracking begins
- REVIEW: Stories locked; retrospective created; AC verification
- SCORING: Server-side calculation, badge award, notifications broadcast
- COMPLETED: Read-only archive; winner visible to all

---

## 8. Scoring Engine

Rules (all server-side, never client-calculated):
1. Credit always goes to `assignee_id`, never `completed_by`
2. Admin excluded from scoring if `adminExcludedFromScoring = true`
3. Users on leave (`sprint_exclusions`) are ineligible
4. Early completion (≥2 days before end): ×1.25 multiplier
5. Critical story completed: +5 bonus points
6. Clean sprint (zero spills): +10 bonus points
7. Spilled without blocker comment: −2 penalty
8. Points floored at 0
9. Ties broken by: points → stories completed → priority weight → avg completion time → co-winner

---

## 9. Real-Time Architecture

Supabase Realtime channels per workspace:

```
Channel: workspace:{workspaceId}
Events: story:moved, story:assigned, story:proposed,
        story:approved, story:rejected, sprint:started,
        sprint:ended, sprint:winner
```

Optimistic updates: UI updates immediately (local Zustand) → API call → success broadcasts to other clients → failure reverts local state + toast.

Conflict resolution: last-write-wins by API timestamp. Losing client receives broadcast and reverts. Toast: "Card was moved by [name]".

---

## 10. Caching Strategy (Upstash Redis)

| Key | TTL | Reason |
|---|---|---|
| `leaderboard:{sprintId}` | 60s | Frequently read |
| `sprint:active:{workspaceId}` | 30s | Every board viewer |
| `user:{userId}` | 1hr | Rarely changes |
| `workspace:settings:{id}` | 5min | Every page load |
| `stories:{sprintId}:{status}` | 30s | Board column data |
| `badges:catalog` | 24hr | Static reference |

Rate limits:
- `/api/generate`: 10 req/min per workspace
- `/api/auth/login`: 5 attempts/15min per IP
- `/api/*`: 100 req/min per user

---

## 11. Storage Architecture (Profile Photos)

Supabase Storage bucket: `avatars`
Path: `avatars/{workspaceId}/{userId}.webp`

Upload flow: client selects → resize to 400×400 (Canvas API) → convert to WebP → upload → store public URL.

Fallback: colored circle with initials (never breaks UI).

---

## 12. Error Handling

- **OpenAI down:** error + [Try Again] + [Create Manually]
- **Rate limited:** "AI is busy. Try in 30 seconds."
- **Offline:** orange banner, queue writes, sync on reconnect
- **403:** session expired → redirect to login (preserve URL)
- **RLS violation:** "You don't have permission to do that" (never expose raw Postgres errors)
- **All surfaces:** React Error Boundaries at root, board, and AI generator

---

## 13. Notifications

In-app: Supabase Realtime subscription on `notifications` table.

Email (Resend): story assigned, proposal approved/rejected, sprint starts, sprint ends in 24hr, winner announced, invite.

Push (Web Push API): story assigned (high), sprint ended (high), proposal result (medium).

---

## 14. Screen Map

```
PUBLIC:  / | /login | /signup | /join/[code]

AUTHENTICATED (all roles):
  /dashboard | /board | /backlog | /ai-generator
  /notifications | /profile/[id]
  /sprints/[id]/winner | /sprints/[id]/retro
  /sprints/[id]/archive | /hall-of-fame

ADMIN ONLY:
  /sprints/new | /sprints/[id]/plan | /sprints/[id]/end
  /backlog/proposed | /team | /settings
  /sprints/[id]/analytics
```

---

## 15. Folder Structure

> **Note:** The structure below is the **target** design. The current prototype implementation differs — see "Actual vs. Target" below.

### Target (production)

```
src/
  app/
    (auth)/
      login/page.tsx
      signup/page.tsx
      join/[code]/page.tsx
    (app)/
      layout.tsx               ← auth guard + realtime setup
      dashboard/page.tsx
      board/page.tsx
      backlog/page.tsx
      backlog/proposed/page.tsx
      ai-generator/page.tsx
      sprints/new/page.tsx
      sprints/[id]/end/page.tsx
      sprints/[id]/winner/page.tsx
      sprints/[id]/retro/page.tsx
      sprints/[id]/analytics/page.tsx  ← not yet built
      sprints/[id]/archive/page.tsx    ← not yet built
      team/page.tsx
      settings/page.tsx
      profile/[id]/page.tsx
      notifications/page.tsx
      hall-of-fame/page.tsx

  lib/
    supabase/      client.ts | server.ts | middleware.ts  ← NOT YET
    scoring/       engine.ts ✅ | engine.test.ts ✅
    permissions/   index.ts ✅
    rateLimit.ts   ✅ (in-memory; Redis target)
    utils.ts       ✅

  store/
    app.store.ts   ✅ (Zustand, localStorage persist)
    types.ts       ✅
    slices/        ✅ (5 domain slices)

  hooks/
    useCurrentUser.ts    ✅
    useActiveSprint.ts   ✅
    useStoryPermissions.ts ✅
    useSprintStories.ts  ✅
```

### Actual vs. Target Differences

| Item | Target | Actual |
|------|--------|--------|
| Store structure | `sprint.store.ts`, `board.store.ts` (separate) | `app.store.ts` + 5 slices (better) |
| Supabase lib | `lib/supabase/` | Not built |
| Redis lib | `lib/redis/` | Not built (`rateLimit.ts` is in-memory) |
| Realtime hooks | `useRealtime.ts`, `useOptimistic.ts` | Not built |
| Analytics page | `/sprints/[id]/analytics` | Not built |
| Archive page | `/sprints/[id]/archive` | Not built |

---

## 16. Security Checklist

- Supabase Auth (JWT, secure httpOnly cookies)
- RLS on every table (DB-level, cannot be bypassed)
- API layer secondary permission check (defense in depth)
- Admin actions verified server-side (never trust client role)
- Zod schemas on all API route inputs
- OpenAI input sanitized (strip HTML, max length)
- Rate limiting on all endpoints (Redis)
- CORS: same-origin only
- Supabase service key: server-only, never exposed to client
- Audit log is immutable (no UPDATE/DELETE RLS policy)
- Scoring runs server-side only

---

## 17. Phased Roadmap

**Phase 1 — Foundation**
Supabase setup, Auth (signup/login/invite), workspace creation, RLS, role-aware nav, team management, sprint CRUD, story CRUD, kanban board, basic in-app notifications, profile + photo upload.

**Phase 2 — AI + Sprint Lifecycle**
AI generator (streaming), propose→approve flow, sprint start/end/review/completed, scoring engine, winner reveal, badge system, retrospective, spilled story flow, email notifications.

**Phase 3 — Analytics + Polish**
Dashboard analytics (burndown, velocity), leaderboard (live/cached), hall of fame, sprint archive, winner certificate PDF, realtime sync, web push, command palette.

**Phase 4 — Production Hardening**
Rate limiting (Redis), full audit log UI, data export, timezone settings, accessibility audit (WCAG AA), Sentry, Lighthouse >90, E2E tests, mobile PWA.

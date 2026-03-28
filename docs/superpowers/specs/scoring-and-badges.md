# Scoring Engine & Badge System — Feature Specification

**Date:** 2026-03-28
**Status:** Implemented client-side. Server-side enforcement pending.
**File:** `src/lib/scoring/engine.ts` | Tests: `src/lib/scoring/engine.test.ts` (31 tests)

---

## 1. Scoring Rules

Credit always goes to `assignee_id`. The user who completes a story does NOT get credit — the assigned user does. This prevents gaming via last-minute completion.

### 1.1 Base Points

Each completed story (`status = 'done'`) earns its raw `storyPoints` value.

```
basePoints = storyPoints × multiplier
```

### 1.2 Early Completion Multiplier

If a story is completed ≥2 days before `sprint.endDate`:

```
multiplier = 1.25  (earned 2+ days early)
multiplier = 1.0   (completed on time or late)
```

The threshold is **strictly ≥2 days** (not 1 day). `daysBetween` uses full-day floor rounding.

### 1.3 Bonus Points

| Bonus | Condition | Points |
|-------|-----------|--------|
| Critical story | story.priority === 'critical' AND status === 'done' | +5 per story |
| Clean sprint | Zero spilled stories AND ≥1 story completed | +10 flat |

Bonuses stack. A user who completes a critical story in a clean sprint earns +15 extra.

### 1.4 Penalty Points

| Penalty | Condition | Points |
|---------|-----------|--------|
| Spilled story | story.status === 'spilled' AND no blocker comment | −2 per story |

Spill penalty is **waived** if the story has at least one comment with `isBlocker = true`. This reflects that blocked stories are not the developer's failure.

### 1.5 Total Score

```
totalPoints = max(0, basePoints + bonusPoints - penaltyPoints)
```

Score is floored at 0 (never negative).

### 1.6 Eligibility

A user is **ineligible** (rank 0, score 0) if:
- They have 0 stories assigned in the sprint (`userStories.length < minStoriesForEligibility`)
- They are in `sprint_exclusions` for this sprint (on leave)
- They are `role === 'admin'` AND `workspace.settings.adminExcludedFromScoring === true`

### 1.7 Ranking + Winner

1. Sort eligible users: `pointsScored DESC, storiesCompleted DESC, onTimeRate DESC`
2. Assign `rank = 1, 2, 3, ...`
3. **Tie for rank 1**: all tied users get `isWinner = true` (co-winners)
4. `topScore === 0`: no winner (empty sprint)

---

## 2. Configuration (WorkspaceSettings)

All multipliers/bonuses are configurable per workspace:

```typescript
interface WorkspaceSettings {
  scoringEnabled: boolean              // disable scoring entirely
  adminExcludedFromScoring: boolean    // default: true
  // Future (post-launch):
  earlyCompletionMultiplier: number    // default: 1.25
  criticalStoryBonus: number           // default: 5
  cleanSprintBonus: number             // default: 10
  spillPenalty: number                 // default: 2 (stored as positive)
  minStoriesForEligibility: number     // default: 1
}
```

Currently, only `adminExcludedFromScoring` is surfaced in the settings UI. The others use `DEFAULT_CONFIG` constants in `engine.ts`.

---

## 3. Badge System

Badges are awarded per-sprint. A user can earn multiple badges in the same sprint. Badge records are stored in `user_badges { userId, badgeKey, sprintId, earnedAt }`.

### 3.1 Single-Sprint Badges

| Badge Key | Name | Criteria | Icon |
|-----------|------|---------|------|
| `sprint_mvp` | Sprint MVP | `isWinner === true` | 🏆 |
| `clean_sprint` | Clean Sprint | Zero spills + ≥1 story done | ✨ |
| `critical_crusher` | Critical Crusher | ≥1 critical priority story completed | 💥 |
| `first_blood` | First Blood | First member to complete ANY story in the sprint | ⚡ |
| `speed_demon` | Speed Demon | ALL assigned stories completed ≥2 days early | 🚀 |

### 3.2 Cross-Sprint Badges (require `historicalResults`)

These badges require the full history of previous `SprintResult` records to be passed to `calculateSprintScores()` as `historicalResults`.

| Badge Key | Name | Criteria | Icon |
|-----------|------|---------|------|
| `hat_trick` | Hat Trick | Won 3 consecutive sprints (last 2 historical + current) | 🎩 |
| `iron_dev` | Iron Dev | Eligible in ≥5 total sprints (historical + current) | 🛡️ |
| `comeback_kid` | Comeback Kid | Improved rank vs. previous sprint (both eligible) | 🔥 |

### 3.3 hat_trick Logic (detailed)

```typescript
// 1. Get the user's sprint IDs where they were eligible (historical)
const recentSprints = [...new Set(
  historicalResults
    .filter(r => r.userId === userId && r.isEligible)
    .map(r => r.sprintId)
)].slice(-2)  // last 2 eligible sprints

// 2. Get the sprint IDs where they won (historical)
const winHistory = historicalResults
  .filter(r => r.userId === userId && r.isWinner)
  .map(r => r.sprintId)

// 3. Award if: they won last 2, and won this one
const wonLastTwo = recentSprints.length === 2 &&
  recentSprints.every(sid => winHistory.includes(sid))

if (wonLastTwo && result.isWinner) → award hat_trick
```

**Important:** `historicalResults` must be ordered oldest→newest and must NOT include results from the current sprint being calculated.

### 3.4 Badge Deduplication

The database enforces `UNIQUE(user_id, badge_key, sprint_id)`. A user cannot earn the same badge twice for the same sprint. They CAN earn the same badge in different sprints (e.g., `sprint_mvp` every sprint they win).

---

## 4. Sprint Result Schema

```typescript
interface SprintResult {
  id: string
  sprintId: string
  userId: string
  rank: number                // 0 = ineligible; 1 = winner
  pointsScored: number        // rounded to 2 decimal places
  storiesCompleted: number
  storiesSpilled: number
  storiesTotal: number
  onTimeRate: number          // 0.0 – 1.0
  rawStoryPoints: number      // sum of storyPoints for done stories
  bonusPoints: number
  penaltyPoints: number
  isEligible: boolean
  isWinner: boolean
}
```

---

## 5. When Scoring Runs

**Current (prototype):** Client-side in `sprintSlice.endSprint()`. Called synchronously when admin clicks "End Sprint & Calculate Results". Results written to localStorage.

**Target (production):** Server-side only via `POST /api/sprints/:id/score`. Triggered by `POST /api/sprints/:id/end`. Scoring result broadcast via Supabase Realtime to all connected clients.

**Why server-side matters:**
- Prevents score manipulation (client cannot pass fabricated `historicalResults`)
- Scoring is consistent regardless of which browser ends the sprint
- Single source of truth in the DB

---

## 6. Display

| Surface | What's shown |
|---------|-------------|
| Winner page `/sprints/[id]/winner` | #1 user, avatar, score, badges earned, runner-up row |
| Hall of Fame `/hall-of-fame` | All-time winners, most badges, leaderboard across sprints |
| Dashboard leaderboard widget | Current sprint live standings |
| Profile page `/profile/[id]` | User's badge collection, sprint history |

---

## 7. Test Coverage

All tests in `src/lib/scoring/engine.test.ts`:

| Test Group | Count | Coverage |
|-----------|-------|---------|
| Basic scoring (base points, eligibility, admin exclusion) | 4 | ✅ |
| Early completion multiplier | 2 | ✅ |
| Clean sprint bonus | 2 | ✅ |
| Critical story bonus | 2 | ✅ |
| Spill penalty + blocker waiver | 3 | ✅ |
| Ranking + tie handling | 3 | ✅ |
| sprint_mvp badge | 2 | ✅ |
| clean_sprint badge | 2 | ✅ |
| critical_crusher badge | 1 | ✅ |
| first_blood badge | 2 | ✅ |
| speed_demon badge | 2 | ✅ |
| hat_trick badge | 3 | ✅ |
| iron_dev badge | 2 | ✅ |
| comeback_kid badge | 2 | ✅ |
| Score floor (never negative) | 1 | ✅ |
| **Total** | **31** | **100% of rules** |

---

## 8. Known Gaps

| Gap | Severity | Fix |
|-----|---------|-----|
| Scoring runs client-side | High | Move to API route (Phase 2) |
| `historicalResults` ordering is caller-dependent | Medium | Sort by `earnedAt` inside engine |
| No unit tests for `pointsScored` rounding edge cases | Low | Add 2 tests |
| `speed_demon` requires `completedAt` — unassigned stories have none | Low | Document assumption |
| Badge dedup not enforced in localStorage | Low | DB unique constraint handles this |

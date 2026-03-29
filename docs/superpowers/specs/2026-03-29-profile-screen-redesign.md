---
title: Profile Screen Redesign
date: 2026-03-29
status: approved
---

# Profile Screen Redesign

## Goal

Bring `src/app/(app)/profile/[id]/page.tsx` in line with the `ProfileScreen.png` design mockup and the established design-system pattern (inline styles via `useTheme()` tokens — no raw Tailwind hex values).

---

## Reference

- Design: `docs/superpowers/design/ProfileScreen.png`
- Existing file: `src/app/(app)/profile/[id]/page.tsx`
- Pattern reference: `src/app/(app)/team/page.tsx`

---

## Sections

### 1 — Profile Hero Card

A full-width card (`C.card.DEFAULT`, `R['2xl']` border-radius) containing:

**Left: Avatar**
- Custom rectangular avatar: `~80px wide × 96px tall`, `borderRadius: R['2xl']`, no circular ring
- Falls back to initials block styled with `user.color`
- If `user.photoUrl` exists, render `<img>` with `object-cover`

**Right: Identity block**
- Role label: `SYSTEM ADMINISTRATOR` (or `ASSIGNEE`) — `TY.fontSize['2xs']`, `TY.fontWeight.bold`, `letterSpacing.wider`, `textTransform: uppercase`, color `C.accent.DEFAULT`
- Name: `TY.fontSize['3xl']`, `TY.fontWeight.bold`, `C.text.primary`, `fontFamily: TY.fontFamily.headline`
- Status + Location row:
  - Green dot (8px, `#4ade80`) + "Online" text (`TY.fontSize.xs`, `C.text.secondary`)
  - Separator dot
  - MapPin icon (12px) + timezone string (`C.text.secondary`)

**Right: Action buttons** (only rendered when `user.id === currentUser?.id`)
- "Edit Profile" — outline button: `C.border.DEFAULT` border, transparent bg, hover → `C.card.hover`
- "Share Stats" — filled button: `C.accent.DEFAULT` bg, `C.accent.on` text, hover → `C.accent.dim`

---

### 2 — Stats Row

Four equal cards in a 4-column grid (collapses to 2-col on mobile via `flex-wrap`).

| Card | Icon (Lucide) | Value | Sub-label |
|---|---|---|---|
| Sprints Won | `Trophy` (amber) | `wins` | `{wins} / {totalSprints} total` |
| Stories Done | `CheckCircle2` (green) | `totalStories` | `Completed` |
| Total Points | `Zap` (indigo) | `Math.round(totalPoints)` | `XP Gained` |
| On-Time Rate | `Target` (violet) | `${avgOnTime}%` | `Precision` |

Each card: `C.card.DEFAULT`, `R.xl`, label + icon at top (small, muted), large headline number (`TY.fontSize['2xl']`), sub-label below.

---

### 3 — Achievements Section

Header row: "Achievements" (semibold, `C.text.primary`) + "View All →" link (right-aligned, `C.accent.DEFAULT`, `TY.fontSize.xs`).

4-column grid of `BADGES` (all 8 — locked and unlocked rendered).

**Unlocked card:**
- Border: `C.accent.DEFAULT` at 30% opacity
- Background: `C.accent.bgSubtle`
- Icon: large emoji or Lucide icon in a frosted circle (`C.card.sunken` bg, `R.full`)
- Name: `TY.fontSize.xs`, `TY.fontWeight.semibold`, `C.text.primary`
- Description: `TY.fontSize['2xs']`, `C.text.secondary`, 2-line clamp
- Sprint earned label: `TY.fontSize['2xs']`, `C.text.disabled`

**Locked card:**
- Same layout, `opacity: 0.35`, `C.border.DEFAULT`, no accent bg
- Icon rendered as grayscale via CSS `filter: grayscale(1)`

---

### 4 — Sprint History

Kept from current implementation; styling upgraded to design-system tokens.

Card with `C.card.DEFAULT` bg, `R.xl`, inner padding.

Header: Trophy icon + "Sprint History" (`C.text.primary`).

Each row:
- Rank medal (🥇/🥈/🥉/#N) or rank number badge
- Sprint name + story/on-time sub-line (`C.text.disabled`)
- Points chip: `C.accent.bgSubtle` background, `C.accent.DEFAULT` text, `R.md`

Dividers: `C.border.subtle` between rows.

---

## Component Structure

Single file — no sub-component extraction needed (page is not shared). Internal helper functions for readability:

```
ProfilePage()
  ├── HeroCard()
  ├── StatCard()          — rendered × 4 via map
  ├── AchievementsSection()
  │     └── AchievementCard() — rendered × 8
  └── SprintHistorySection()
        └── HistoryRow()
```

---

## Data

All data already available from `useAppStore()`:
- `users`, `currentUser`, `sprintResults`, `userBadges`, `sprints`, `stories`
- `BADGES` constant from `@/types`

No new store actions, API calls, or types required.

User location is derived from `user.timezone` (e.g. `"Asia/Kolkata"` → display as-is or map to city).

---

## Constraints

- Use `useTheme()` tokens exclusively — no raw hex values or Tailwind classes for colors/spacing
- Follow the inline-style pattern from `team/page.tsx`
- `'use client'` directive required (store access)
- Preserve the existing redirect logic in `profile/page.tsx` (not touched)
- Avatar component stays circular for all other uses — the hero only adds a local rectangular variant inline

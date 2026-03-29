---
title: StoryDetailSheet Redesign
date: 2026-03-29
status: approved
---

# StoryDetailSheet Redesign

## Goal

Redesign `src/components/board/StoryDetailSheet.tsx` to match `StoryDetailScreen.png`:
- Two-column layout (left: content, right: metadata sidebar)
- Status-aware right sidebar (dates, Flag as Blocker, Share/Duplicate)
- Wider sheet to accommodate the two-column split

---

## Reference

- Design: `docs/superpowers/design/StoryDetailScreen.png`
- File to modify: `src/components/board/StoryDetailSheet.tsx`

---

## Layout

The Sheet becomes wider (`sm:max-w-3xl`) and its body uses a horizontal flex layout:

```
┌─────────────────────────────────────┬──────────────────────┐
│  [STATUS] [PRIORITY]          [X]   │                      │
│                                     │  ASSIGNED            │
│  Story Title (large, bold)          │  avatar + name/role  │
│  ● 8 pts  TAG  TAG                  │                      │
│                                     │  DATES               │
│  DESCRIPTION                        │  Created   Oct 12    │
│  ...                                │  Due Date  Oct 28    │
│                                     │  (or Completed for   │
│  ACCEPTANCE CRITERIA  N/N (%)       │   done stories)      │
│  progress bar                       │                      │
│  □ criterion                        │  [FLAG AS BLOCKER]   │
│  □ criterion                        │  (hidden when done)  │
│  [+ add criterion input]            │                      │
│                                     │  ─────────────────── │
│  COMMENTS                           │  < Share Task        │
│  comment cards                      │    Duplicate         │
│  [Leave a comment input]            │  (done stories only) │
│                                     │                      │
│  ─────────────────────────────────  │                      │
│  [Move to Next Status →]            │                      │
│  (hidden when done)                 │                      │
└─────────────────────────────────────┴──────────────────────┘
```

---

## Sections

### Sheet Container

- Width: `sm:max-w-3xl` (was `sm:max-w-xl`)
- Background: `bg-[#0f1117]`
- Internal layout: `flex flex-row h-full overflow-hidden`

---

### Left Pane

Takes `flex-1 flex flex-col h-full` — does **not** scroll itself. Only the body scrolls.

**Header** (`flex-shrink-0` — always pinned at top)

Background `bg-[#13192a]`, border-bottom, padding `px-6 pt-6 pb-5`.

- Row 1: Status chip + Priority chip on left, `X` close button on right
- Row 2: Title (`text-xl font-bold text-white`)
- Row 3: Points badge + tag pills (≤3 tags)

**Body** (`flex-1 overflow-y-auto px-6 py-5 space-y-6`)

This is the **only scrolling region**. With many comments or long acceptance criteria lists, the user scrolls here — header and footer stay pinned.

1. **Description** — `text-sm text-slate-400 leading-relaxed`, only rendered if non-empty

2. **Acceptance Criteria**
   - Section header row: "ACCEPTANCE CRITERIA" label (uppercase, muted) + `N/N (%)` counter on right
   - Progress bar: `h-1 bg-slate-800`, filled with `bg-indigo-500`, only shown when `totalAC > 0`
   - Criteria list: checkbox rows, clickable if `canAC`. Checked = `bg-green-500` box + strikethrough text
   - Add AC input (only when `canEdit`): text input + `+` button, submit on Enter

3. **Comments**
   - Section header: "COMMENTS" label + count badge
   - Comment cards rendered in full — no truncation, no pagination. All comments scroll within the body.
   - Blocker comments: red border/bg. Regular: slate border/bg.
   - Each card: commenter avatar + name + relative time, body text
   - New comment `<textarea>` + Post button rendered **at the bottom of the comments section**, inside the scroll area. Scrolls into view naturally as comments grow.
   - No blocker checkbox here — blocker is the dedicated button in the right sidebar

**Footer** (`flex-shrink-0` — always pinned at bottom, `border-t border-slate-800 bg-[#13192a] px-6 py-4`)

Rendered only when `canMoveNext` (i.e. status is todo/in_progress/review and user has permission):

```
[Move to In Progress →]   /   [Move to Review →]   /   [Mark as Done →]
```

Full-width `bg-indigo-600 hover:bg-indigo-700` button. Hidden entirely when `status === 'done'`.

---

### Right Sidebar

Fixed width `w-64`, `bg-[#0b0f1a]` (slightly darker than left), `border-l border-slate-800`, `flex flex-col overflow-y-auto`, `p-5`. Scrolls independently if future content grows.

Sections are separated by `border-b border-slate-800/60 pb-4 mb-4`.

**1. ASSIGNED**

Label: `ASSIGNED` (10px, uppercase, `text-slate-500`, `tracking-wider`).

If assignee exists:
- Avatar (size `md`, circular)
- Name (`text-sm font-semibold text-slate-200`)
- Role (`text-xs text-slate-500 capitalize`)

If no assignee: `text-xs text-slate-600 italic` "Unassigned"

---

**2. DATES**

Label: `DATES` (same style as ASSIGNED label).

Two rows, each: label on left (`text-xs text-slate-500`) + value on right (`text-xs font-semibold text-slate-200`).

| Status | Row 1 | Row 2 |
|--------|-------|-------|
| todo / in_progress / review | Created: `formatDate(story.createdAt)` | Due Date: `formatDate(sprint.endDate)` (active sprint) |
| done | Created: `formatDate(story.createdAt)` | Completed: `formatDate(story.completedAt)` |

`sprint` is obtained via `getActiveSprint()` from the store.

---

**3. FLAG AS BLOCKER** (hidden when `status === 'done'`)

A standalone button styled as a red outlined button:
- Border: `border border-red-500/40`
- Background: `bg-red-500/8`
- Text: `text-red-400 text-sm font-semibold`
- Icon: `AlertTriangle` (14px, red)
- On click: opens the new-comment textarea pre-focused with `isBlocker` toggled to `true`

---

**4. Actions (bottom of sidebar, `mt-auto`)**

Rendered only when `status === 'done'`.

Two ghost-style buttons stacked vertically:

- **Share Task**: `Share2` icon (14px) + "Share Task" text. On click: copies a shareable link or shows a toast "Link copied."
- **Duplicate**: `Copy` icon (14px) + "Duplicate" text. On click: calls a `duplicateStory` store action (creates a copy in backlog with same title/desc/points/tags, status = `backlog`).

Both: `w-full text-left text-sm text-slate-400 hover:text-slate-200 flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-slate-800/60 transition-colors`.

---

## Status-Aware Behaviour Summary

| Feature | todo | in_progress | review | done |
|---------|------|-------------|--------|------|
| Date row 2 label | Due Date | Due Date | Due Date | Completed |
| Date row 2 value | sprint.endDate | sprint.endDate | sprint.endDate | story.completedAt |
| Flag as Blocker button | ✓ | ✓ | ✓ | — |
| Share Task + Duplicate | — | — | — | ✓ |
| Footer move button | ✓ | ✓ | ✓ (admin only) | — |

---

## Store Changes

**New action: `duplicateStory(storyId: string): void`**

In `storySlice.ts`:
- Find source story by id
- Create a new story with same: `title`, `description`, `priority`, `storyPoints`, `tags`, `workspaceId`, `createdBy = currentUser.id`
- Set: `status = 'backlog'`, `sprintId = undefined`, `assigneeId = undefined`, `acceptanceCriteria = []`, `comments = []`, fresh `id`, `createdAt`, `updatedAt`
- Append to stories array

---

## Component Structure

Single file — no extraction needed. Internal structure:

```
StoryDetailSheet
  ├── LeftPane
  │     ├── Header (status + priority chips, title, badges)
  │     ├── Body (description, AC section, comments section)
  │     └── Footer (move action button)
  └── RightSidebar
        ├── AssignedSection
        ├── DatesSection
        ├── FlagAsBlockerButton
        └── ActionsSection (share + duplicate, done only)
```

All sections are inline — no separate component files.

---

## Constraints

- Keep existing `Sheet` / `SheetContent` component — do not switch to Dialog
- Keep existing Tailwind class pattern (this file uses Tailwind, not inline tokens)
- Preserve all existing logic: `toggleAC`, `addAC`, `addComment`, `moveStory`, permissions
- `duplicateStory` is the only new store action required
- No new UI library components needed

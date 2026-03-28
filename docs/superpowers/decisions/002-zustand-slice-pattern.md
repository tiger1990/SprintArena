# ADR-002: Zustand Slice Pattern for Client State

**Date:** 2026-03-28
**Status:** Decided and implemented
**File:** `src/store/app.store.ts`, `src/store/slices/`

---

## Context

The initial prototype used a single 546-line Zustand store (`app.store.ts`). This became unmaintainable and untestable as new domains were added.

## Decision

Split the monolithic store into **domain slices** using Zustand's `StateCreator` pattern, composed in a single `create()` call.

## Slice Structure

```
src/store/
  app.store.ts          ← composer (< 65 lines)
  types.ts              ← AppStore composite type
  slices/
    workspaceSlice.ts   ← workspace CRUD, settings
    teamSlice.ts        ← users, auth state, _hasHydrated
    sprintSlice.ts      ← sprint lifecycle + scoring trigger
    storySlice.ts       ← story CRUD, AC, comments, moves
    notificationSlice.ts← notifications, audit log
```

## Pattern

Each slice is a `StateCreator<AppStore, [], [], SliceInterface>`:

```typescript
export const createSprintSlice: StateCreator<AppStore, [], [], SprintSlice> = (set, get) => ({
  // state
  sprints: [],
  // actions
  startSprint: (id) => { ... }
})
```

The composer spreads all slices:

```typescript
export const useAppStore = create<AppStore>()(
  persist(
    (set, get, store) => ({
      ...createWorkspaceSlice(set, get, store),
      ...createTeamSlice(set, get, store),
      ...createSprintSlice(set, get, store),
      ...createStorySlice(set, get, store),
      ...createNotificationSlice(set, get, store),
      userBadges: [],
      resetAll: () => set({ ... }),
    }),
    { name: 'sprintbrain-store', storage: createJSONStorage(() => localStorage) }
  )
)
```

## Custom Hooks Layer

Components use domain hooks, not `useAppStore` directly:

```
src/hooks/
  useCurrentUser.ts     ← { user, isAdmin, isHydrated }
  useActiveSprint.ts    ← { sprint, stories, completionPercent }
  useStoryPermissions.ts← { can.move(story), can.edit(story), ... }
  useSprintStories.ts   ← stories filtered by sprint
```

## Why Not Redux Toolkit

- Zustand has zero boilerplate for slice-level reads
- `useAppStore(s => s.sprints)` is a single line vs. selector factory + `useSelector`
- No provider wrapper needed
- Zustand 5's built-in `devtools` middleware works without separate package

## Why Not React Context

- Context re-renders ALL consumers on any state change
- Zustand selectors let each component subscribe to only the fields it reads
- Board page re-renders on `stories` change only, not on `notifications` change

## Consequences

- **Adding a domain:** create `fooSlice.ts`, add `FooSlice` to `types.ts`, spread in `app.store.ts` (3 files, ~20 lines)
- **Slices can call each other** via `get()` — `sprintSlice.endSprint` calls `get().addNotification()`
- **Cross-slice state** (`userBadges`) lives in the composer, not in any single slice
- **In production:** Zustand becomes a cache layer only. DB is the source of truth. Slices will call API routes instead of mutating local state directly.

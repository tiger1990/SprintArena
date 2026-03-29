# StoryDetailSheet Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `StoryDetailSheet` into a two-column layout (left: scrollable content, right: metadata sidebar) with status-aware sidebar sections matching `StoryDetailScreen.png`.

**Architecture:** Two tasks: (1) add `duplicateStory` to the store slice, (2) full rewrite of the component. The Sheet stays — only its internal layout changes to a horizontal flex split. The body-only-scrolls pattern uses `min-h-0` on the left pane so flex children respect `overflow-y-auto`.

**Tech Stack:** React, Zustand, Radix UI Sheet, Tailwind CSS, Lucide React, `formatDate` / `formatRelativeTime` from `@/lib/utils`.

**Spec:** `docs/superpowers/specs/2026-03-29-story-detail-sheet-redesign.md`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/store/slices/storySlice.ts` | Add `duplicateStory` action |
| Modify | `src/store/types.ts` | Add `duplicateStory` to `AppStore` via StorySlice |
| Modify | `src/components/board/StoryDetailSheet.tsx` | Full two-column redesign |

---

## Task 1: Add `duplicateStory` to the store

**Files:**
- Modify: `src/store/slices/storySlice.ts`

- [ ] **Step 1: Add `duplicateStory` to the `StorySlice` interface**

In `src/store/slices/storySlice.ts`, add to the `StorySlice` interface after `getProposedStories`:

```ts
duplicateStory: (storyId: string) => void
```

The full updated interface block (lines 6–27):

```ts
export interface StorySlice {
  stories: Story[]

  createStory: (
    data: Omit<Story, 'id' | 'createdAt' | 'updatedAt' | 'orderIndex' | 'acceptanceCriteria' | 'comments' | 'tags'>
      & { tags?: string[]; acceptanceCriteria?: string[] }
  ) => Story
  updateStory: (id: string, data: Partial<Story>) => void
  deleteStory: (id: string) => void
  moveStory: (storyId: string, newStatus: StoryStatus, movedBy: string) => void
  assignStory: (storyId: string, assigneeId: string) => void
  approveProposal: (storyId: string, adminId: string) => void
  rejectProposal: (storyId: string, adminId: string, note: string) => void
  addToSprint: (storyId: string, sprintId: string) => void
  toggleAC: (storyId: string, acId: string, userId: string) => void
  addAC: (storyId: string, text: string) => void
  removeAC: (storyId: string, acId: string) => void
  addComment: (storyId: string, userId: string, body: string, isBlocker?: boolean) => void
  getSprintStories: (sprintId: string) => Story[]
  getBacklogStories: () => Story[]
  getProposedStories: () => Story[]
  duplicateStory: (storyId: string) => void
}
```

- [ ] **Step 2: Add the `duplicateStory` implementation**

At the end of `createStorySlice` (after `getProposedStories`, before the closing `})`), add:

```ts
  duplicateStory: (storyId) => {
    const source = get().stories.find(s => s.id === storyId)
    const actor  = get().currentUser
    if (!source || !actor) return
    const now = new Date().toISOString()
    const copy: Story = {
      id:                  generateId(),
      workspaceId:         source.workspaceId,
      title:               `${source.title} (copy)`,
      description:         source.description,
      status:              'backlog',
      priority:            source.priority,
      storyPoints:         source.storyPoints,
      tags:                [...source.tags],
      createdBy:           actor.id,
      sprintId:            undefined,
      assigneeId:          undefined,
      acceptanceCriteria:  [],
      comments:            [],
      orderIndex:          get().stories.length,
      createdAt:           now,
      updatedAt:           now,
    }
    set(s => ({ stories: [...s.stories, copy] }))
  },
```

- [ ] **Step 3: Verify TypeScript compiles clean**

Run: `npx tsc --noEmit 2>&1 | grep storySlice`
Expected: no output (no errors in that file).

- [ ] **Step 4: Commit**

```bash
git add src/store/slices/storySlice.ts
git commit -m "feat(store): add duplicateStory action to storySlice"
```

---

## Task 2: Rewrite StoryDetailSheet — two-column layout

**Files:**
- Modify: `src/components/board/StoryDetailSheet.tsx`

- [ ] **Step 1: Replace the entire file**

Replace `src/components/board/StoryDetailSheet.tsx` with:

```tsx
'use client'
import type { Story, StoryStatus } from '@/types'
import { useAppStore } from '@/store/app.store'
import { canEditStory, canMarkAcceptanceCriteria, canMoveToDone } from '@/lib/permissions'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { PointsBadge } from '@/components/shared/PointsBadge'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Check, Plus, AlertTriangle, MessageSquare,
  ChevronRight, X, Share2, Copy,
} from 'lucide-react'
import { useState, useRef } from 'react'
import { cn, formatDate, formatRelativeTime } from '@/lib/utils'
import { STATUS_LABELS } from '@/types'
import { toast } from 'sonner'

// ─── Status chip styles ───────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  todo:        { bg: 'bg-slate-700/60',  text: 'text-slate-300',  dot: 'bg-slate-400'  },
  in_progress: { bg: 'bg-blue-500/15',   text: 'text-blue-400',   dot: 'bg-blue-400'   },
  review:      { bg: 'bg-amber-500/15',  text: 'text-amber-400',  dot: 'bg-amber-400'  },
  done:        { bg: 'bg-green-500/15',  text: 'text-green-400',  dot: 'bg-green-400'  },
}

const NEXT_STATUS: Partial<Record<StoryStatus, StoryStatus>> = {
  todo:        'in_progress',
  in_progress: 'review',
  review:      'done',
}

const NEXT_LABEL: Partial<Record<StoryStatus, string>> = {
  todo:        'Move to In Progress',
  in_progress: 'Move to Review',
  review:      'Mark as Done',
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StoryDetailSheet({
  story, open, onClose,
}: {
  story: Story
  open: boolean
  onClose: () => void
}) {
  const { currentUser, toggleAC, addAC, addComment, moveStory, duplicateStory, getUserById, getActiveSprint } = useAppStore()
  const [newAC,      setNewAC]      = useState('')
  const [newComment, setNewComment] = useState('')
  const [isBlocker,  setIsBlocker]  = useState(false)
  const commentRef = useRef<HTMLTextAreaElement>(null)

  const canEdit  = currentUser ? canEditStory(currentUser, story) : false
  const canAC    = currentUser ? canMarkAcceptanceCriteria(currentUser, story) : false
  const canDone  = currentUser ? canMoveToDone(currentUser) : false
  const assignee = story.assigneeId ? getUserById(story.assigneeId) : null
  const sprint   = getActiveSprint()

  const nextStatus  = NEXT_STATUS[story.status]
  const canMoveNext = !!nextStatus && (story.status !== 'review' || canDone)

  const statusStyle = STATUS_STYLE[story.status] ?? STATUS_STYLE.todo
  const metAC  = story.acceptanceCriteria.filter(ac => ac.isMet).length
  const totalAC = story.acceptanceCriteria.length
  const acPct  = totalAC > 0 ? Math.round((metAC / totalAC) * 100) : 0

  const handleAddAC = () => {
    if (!newAC.trim()) return
    addAC(story.id, newAC.trim())
    setNewAC('')
  }

  const handleAddComment = () => {
    if (!newComment.trim() || !currentUser) return
    addComment(story.id, currentUser.id, newComment.trim(), isBlocker)
    if (isBlocker) toast.warning('Blocker flagged. Admin has been notified.')
    setNewComment('')
    setIsBlocker(false)
  }

  const handleFlagBlocker = () => {
    setIsBlocker(true)
    setTimeout(() => commentRef.current?.focus(), 50)
  }

  const handleShareTask = () => {
    navigator.clipboard.writeText(`${window.location.origin}/board?story=${story.id}`)
    toast.success('Link copied to clipboard.')
  }

  const handleDuplicate = () => {
    duplicateStory(story.id)
    toast.success('Story duplicated to backlog.')
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="bg-[#0f1117] border-l border-slate-800 w-full sm:max-w-3xl p-0 overflow-hidden flex flex-col">
        <div className="flex flex-row h-full overflow-hidden">

          {/* ── Left pane ──────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-h-0">

            {/* Header — pinned */}
            <div className="flex-shrink-0 bg-[#13192a] border-b border-slate-800 px-6 pt-6 pb-5">
              {/* Status + priority + close */}
              <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
                    statusStyle.bg, statusStyle.text,
                  )}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', statusStyle.dot)} />
                    {STATUS_LABELS[story.status]}
                  </span>
                  <PriorityBadge priority={story.priority} />
                </div>
                <button
                  onClick={onClose}
                  className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-800 flex-shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-white leading-snug mb-4">
                {story.title}
              </h2>

              {/* Points + tags */}
              <div className="flex items-center gap-2 flex-wrap">
                <PointsBadge points={story.storyPoints} />
                {story.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Body — only this scrolls */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* Description */}
              {story.description && (
                <p className="text-sm text-slate-400 leading-relaxed">
                  {story.description}
                </p>
              )}

              {/* Acceptance Criteria */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Acceptance Criteria
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    {metAC}/{totalAC}
                    {totalAC > 0 && (
                      <span className="ml-1 text-slate-600">({acPct}%)</span>
                    )}
                  </span>
                </div>

                {totalAC > 0 && (
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${acPct}%` }}
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  {story.acceptanceCriteria.map(ac => (
                    <div
                      key={ac.id}
                      className={cn(
                        'flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors',
                        canAC ? 'cursor-pointer hover:bg-slate-800/60' : '',
                        ac.isMet ? 'bg-green-500/5' : 'bg-slate-800/30',
                      )}
                      onClick={() => canAC && currentUser && toggleAC(story.id, ac.id, currentUser.id)}
                    >
                      <div className={cn(
                        'w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border transition-all',
                        ac.isMet ? 'bg-green-500 border-green-500' : 'border-slate-600',
                      )}>
                        {ac.isMet && <Check size={10} className="text-white" />}
                      </div>
                      <span className={cn(
                        'text-xs leading-relaxed',
                        ac.isMet ? 'text-slate-500 line-through' : 'text-slate-300',
                      )}>
                        {ac.text}
                      </span>
                    </div>
                  ))}
                </div>

                {totalAC === 0 && (
                  <p className="text-xs text-slate-600 italic px-1">
                    No acceptance criteria defined.
                  </p>
                )}

                {canEdit && (
                  <div className="flex gap-2 mt-3">
                    <input
                      value={newAC}
                      onChange={e => setNewAC(e.target.value)}
                      placeholder="Add acceptance criterion..."
                      className="flex-1 text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                      onKeyDown={e => e.key === 'Enter' && handleAddAC()}
                    />
                    <button
                      onClick={handleAddAC}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Comments */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <MessageSquare size={11} />
                  Comments
                  {story.comments.length > 0 && (
                    <span className="ml-1 bg-slate-800 text-slate-500 text-[10px] px-1.5 py-0.5 rounded-full">
                      {story.comments.length}
                    </span>
                  )}
                </h3>

                {story.comments.length > 0 && (
                  <div className="space-y-2.5 mb-4">
                    {story.comments.map(comment => {
                      const commenter = getUserById(comment.userId)
                      return (
                        <div
                          key={comment.id}
                          className={cn(
                            'p-3 rounded-xl border',
                            comment.isBlocker
                              ? 'bg-red-500/8 border-red-500/25'
                              : 'bg-slate-800/40 border-slate-800',
                          )}
                        >
                          {comment.isBlocker && (
                            <div className="flex items-center gap-1.5 text-red-400 text-[10px] font-bold mb-2 uppercase tracking-wider">
                              <AlertTriangle size={10} /> Blocker
                            </div>
                          )}
                          <div className="flex items-center gap-2 mb-1.5">
                            {commenter && <Avatar user={commenter} size="xs" />}
                            <span className="text-[11px] font-semibold text-slate-300">
                              {commenter?.name}
                            </span>
                            <span className="text-[10px] text-slate-600 ml-auto">
                              {formatRelativeTime(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {comment.body}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* New comment — inside scroll area, always reachable */}
                <div className="space-y-2">
                  <Textarea
                    ref={commentRef}
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Leave a comment..."
                    className={cn(
                      'bg-slate-800/60 border-slate-700 text-sm resize-none placeholder:text-slate-600 focus:border-indigo-500',
                      isBlocker && 'border-red-500/50 focus:border-red-500',
                    )}
                    rows={2}
                  />
                  <div className="flex items-center justify-end">
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-xs px-4"
                    >
                      {isBlocker ? '🚨 Post Blocker' : 'Post'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer — pinned, only for non-done stories */}
            {canMoveNext && nextStatus && (
              <div className="flex-shrink-0 border-t border-slate-800 bg-[#13192a] px-6 py-4">
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-10 font-semibold"
                  onClick={() => {
                    if (currentUser) moveStory(story.id, nextStatus, currentUser.id)
                    onClose()
                  }}
                >
                  {NEXT_LABEL[story.status] ?? `Move to ${STATUS_LABELS[nextStatus]}`}
                  <ChevronRight size={16} className="ml-1.5" />
                </Button>
              </div>
            )}
          </div>

          {/* ── Right sidebar ───────────────────────────────────────────── */}
          <div className="w-64 bg-[#0b0f1a] border-l border-slate-800 flex flex-col overflow-y-auto p-5 flex-shrink-0">

            {/* Assigned */}
            <div className="pb-4 mb-4 border-b border-slate-800/60">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                Assigned
              </p>
              {assignee ? (
                <div className="flex items-center gap-3">
                  <Avatar user={assignee} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">
                      {assignee.name}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">
                      {assignee.role}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-600 italic">Unassigned</p>
              )}
            </div>

            {/* Dates */}
            <div className="pb-4 mb-4 border-b border-slate-800/60">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                Dates
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Created</span>
                  <span className="text-xs font-semibold text-slate-200">
                    {formatDate(story.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {story.status === 'done' ? 'Completed' : 'Due Date'}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    {story.status === 'done'
                      ? (story.completedAt ? formatDate(story.completedAt) : '—')
                      : (sprint ? formatDate(sprint.endDate) : '—')
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Flag as Blocker — hidden for done stories */}
            {story.status !== 'done' && (
              <div className="pb-4 mb-4 border-b border-slate-800/60">
                <button
                  onClick={handleFlagBlocker}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-red-500/40 bg-red-500/8 text-red-400 text-sm font-semibold hover:bg-red-500/15 transition-colors"
                >
                  <AlertTriangle size={14} />
                  Flag as Blocker
                </button>
              </div>
            )}

            {/* Share + Duplicate — done stories only */}
            {story.status === 'done' && (
              <div className="mt-auto flex flex-col gap-1">
                <button
                  onClick={handleShareTask}
                  className="w-full flex items-center gap-2 py-2 px-3 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                >
                  <Share2 size={14} />
                  Share Task
                </button>
                <button
                  onClick={handleDuplicate}
                  className="w-full flex items-center gap-2 py-2 px-3 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                >
                  <Copy size={14} />
                  Duplicate
                </button>
              </div>
            )}
          </div>

        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles clean for the component**

Run: `npx tsc --noEmit 2>&1 | grep -i "StoryDetail\|storyDetail"`
Expected: no output.

- [ ] **Step 3: Smoke-test visually**

Run: `npm run dev`

Open the board, click any story card. Verify:
- Sheet slides in at ~3xl width with two columns side by side
- Left: header pinned at top (status chip + priority + title + badges), body scrolls (description, AC, comments, comment textarea), footer move button pinned at bottom
- Right: Assigned section, Dates section, Flag as Blocker button
- For a **done** story: right sidebar shows Created + Completed dates, no Flag as Blocker, Share Task + Duplicate buttons at bottom
- For **todo / in_progress / review**: right sidebar shows Due Date from sprint end, Flag as Blocker button present
- Add 10+ dummy comments via the textarea — confirm header and footer stay fixed while body scrolls

- [ ] **Step 4: Commit**

```bash
git add src/components/board/StoryDetailSheet.tsx
git commit -m "feat(board): redesign StoryDetailSheet with two-column layout

- Left pane: pinned header + scrollable body (description, AC, comments)
  + pinned footer move-action button
- Right sidebar: assignee, dates (due/completed), flag-as-blocker,
  share/duplicate (done stories only)
- Sheet width expanded to sm:max-w-3xl
- Flag as Blocker moved from comment checkbox to dedicated sidebar button"
```

---

## Self-Review

**1. Spec coverage:**
- ✅ Two-column layout (flex-row, left flex-1, right w-64)
- ✅ Sheet width `sm:max-w-3xl`
- ✅ Header pinned (`flex-shrink-0`), body scrolls (`flex-1 overflow-y-auto`), footer pinned (`flex-shrink-0`)
- ✅ Right sidebar: Assigned, Dates, Flag as Blocker, Share+Duplicate
- ✅ Status-aware dates: Due Date (todo/in_progress/review) vs Completed (done)
- ✅ Flag as Blocker hidden for done stories
- ✅ Share Task + Duplicate shown for done stories only
- ✅ `duplicateStory` store action added in Task 1
- ✅ All existing logic preserved: `toggleAC`, `addAC`, `addComment`, `moveStory`, permissions
- ✅ Blocker flag wires into comment input (pre-focuses textarea, sets isBlocker=true)
- ✅ Right sidebar `overflow-y-auto` for independent scrolling

**2. Placeholder scan:** None found. Every section has complete code.

**3. Type consistency:**
- `duplicateStory(storyId: string)` defined in Task 1 interface and used in Task 2 component — consistent.
- `getActiveSprint()` already exists on AppStore (used in `StoryCard.tsx`).
- `formatDate`, `formatRelativeTime` both exported from `@/lib/utils` — confirmed in codebase.

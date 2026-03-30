'use client'
import type { Story, StoryStatus } from '@/types'
import { useAppStore } from '@/store/app.store'
import { useTheme } from '@/hooks/useTheme'
import { canEditStory, canMarkAcceptanceCriteria, canMoveToDone } from '@/lib/permissions'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'
import {
  Plus, ChevronRight, X, Share2, Copy,
  CheckCircle2, Circle, PlayCircle, Eye, Flag, Star, Paperclip,
  ArrowUp, AlertTriangle,
} from 'lucide-react'
import { useState, useRef } from 'react'
import { cn, formatDate, formatRelativeTime, getInitials } from '@/lib/utils'
import { STATUS_LABELS, PRIORITY_LABELS } from '@/types'
import { toast } from 'sonner'

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_ICON: Record<string, React.ReactNode> = {
  todo:        <Circle        size={12} />,
  in_progress: <PlayCircle    size={12} />,
  review:      <Eye           size={12} />,
  done:        <CheckCircle2  size={12} />,
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
  const { colors: C, typography: TY, spacing: SP, radius: R, shadows, transitions } = useTheme()

  const {
    currentUser, toggleAC, addAC, addComment,
    moveStory, duplicateStory, getUserById, getActiveSprint,
  } = useAppStore()

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

  const metAC   = story.acceptanceCriteria.filter(ac => ac.isMet).length
  const totalAC = story.acceptanceCriteria.length
  const acPct   = totalAC > 0 ? Math.round((metAC / totalAC) * 100) : 0

  // Priority → theme colors
  const priorityStyle: Record<string, { bg: string; color: string }> = {
    low:      { bg: C.successBg,     color: C.success },
    medium:   { bg: `${C.warning}1A`, color: C.warning },
    high:     { bg: C.errorBg,       color: C.error   },
    critical: { bg: `${C.error}26`,  color: C.error   },
  }
  const pStyle = priorityStyle[story.priority] ?? priorityStyle.medium

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

  const handleShareTask = () => {
    navigator.clipboard.writeText(`${window.location.origin}/board?story=${story.id}`)
    toast.success('Link copied to clipboard.')
  }

  const handleDuplicate = () => {
    duplicateStory(story.id)
    toast.success('Story duplicated to backlog.')
    onClose()
  }

  const handleFlagBlocker = () => {
    const next = !isBlocker
    setIsBlocker(next)
    if (next) setTimeout(() => commentRef.current?.focus(), 50)
  }

  // ─── Shared style fragments ─────────────────────────────────────────────────

  const sectionLabel: React.CSSProperties = {
    fontSize:      TY.fontSize['2xs'],
    fontWeight:    TY.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: TY.letterSpacing.widest,
    color:         C.text.secondary,
  }

  const divider: React.CSSProperties = {
    borderBottom: `1px solid ${C.border.subtle}`,
    paddingBottom: SP[4],
    marginBottom:  SP[4],
  }

  return (
    <Sheet open={open} onOpenChange={isOpen => { if (!isOpen) onClose() }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="p-0 gap-0 sm:!max-w-3xl flex flex-col overflow-hidden border-l-0"
        style={{ background: C.page }}
      >
        {/* Two-pane row */}
        <div className="flex flex-row flex-1 min-h-0 overflow-hidden">

          {/* ══ LEFT PANE ══════════════════════════════════════════════════ */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

            {/* ── Header (pinned) ────────────────────────────────────────── */}
            <div
              className="flex-shrink-0"
              style={{
                background:   C.card.sunken,
                borderBottom: `1px solid ${C.border.subtle}`,
                padding:      `${SP[8]} ${SP[10]} ${SP[6]}`,
              }}
            >
              {/* Row 1: badges + close */}
              <div className="flex items-center justify-between" style={{ marginBottom: SP[5] }}>
                <div className="flex items-center" style={{ gap: SP[2] }}>
                  {/* Status badge */}
                  <span
                    className="inline-flex items-center"
                    style={{
                      gap:           SP[1.5],
                      padding:       `${SP[1]} ${SP[3]}`,
                      borderRadius:  R.full,
                      fontSize:      TY.fontSize['2xs'],
                      fontWeight:    TY.fontWeight.bold,
                      textTransform: 'uppercase',
                      letterSpacing: TY.letterSpacing.widest,
                      background:    C.card.DEFAULT,
                      color:         C.accent.DEFAULT,
                    }}
                  >
                    {STATUS_ICON[story.status]}
                    {STATUS_LABELS[story.status]}
                  </span>

                  {/* Priority badge */}
                  <span
                    className="inline-flex items-center"
                    style={{
                      gap:           SP[1.5],
                      padding:       `${SP[1]} ${SP[3]}`,
                      borderRadius:  R.full,
                      fontSize:      TY.fontSize['2xs'],
                      fontWeight:    TY.fontWeight.bold,
                      textTransform: 'uppercase',
                      letterSpacing: TY.letterSpacing.widest,
                      background:    pStyle.bg,
                      color:         pStyle.color,
                    }}
                  >
                    <ArrowUp size={11} strokeWidth={3} />
                    {PRIORITY_LABELS[story.priority]}
                  </span>
                </div>

                {/* Close */}
                <button
                  onClick={onClose}
                  style={{ color: C.text.secondary, transition: `color ${transitions.fast}` }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = C.text.primary)}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = C.text.secondary)}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Row 2: title */}
              <h2
                className="headline-font"
                style={{
                  fontSize:    TY.fontSize.xl,
                  fontWeight:  TY.fontWeight.bold,
                  lineHeight:  TY.lineHeight.tight,
                  color:       C.text.primary,
                  marginBottom: SP[3],
                }}
              >
                {story.title}
              </h2>

              {/* Row 3: points + tags */}
              <div className="flex items-center flex-wrap" style={{ gap: SP[4] }}>
                <div className="flex items-center" style={{ gap: SP[1.5] }}>
                  <Star size={13} style={{ color: C.accent.DEFAULT }} />
                  <span style={{ fontSize: TY.fontSize.sm, fontWeight: TY.fontWeight.medium, color: C.accent.DEFAULT }}>
                    {story.storyPoints} pts
                  </span>
                </div>
                {story.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    style={{
                      fontSize:      TY.fontSize['2xs'],
                      fontWeight:    TY.fontWeight.bold,
                      textTransform: 'uppercase',
                      padding:       `${SP[0.5]} ${SP[2]}`,
                      borderRadius:  R.sm,
                      background:    C.card.DEFAULT,
                      color:         C.text.secondary,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Body (scrolls) ──────────────────────────────────────────── */}
            <div
              className="flex-1 overflow-y-auto"
              style={{ padding: `${SP[6]} ${SP[10]}` }}
            >

              {/* Description */}
              {story.description && (
                <section style={{ marginBottom: SP[8] }}>
                  <h3 style={{ ...sectionLabel, marginBottom: SP[4] }}>Description</h3>
                  <p style={{ fontSize: TY.fontSize.sm, lineHeight: TY.lineHeight.relaxed, color: C.text.secondary }}>
                    {story.description}
                  </p>
                </section>
              )}

              {/* Acceptance Criteria */}
              <section style={{ marginBottom: SP[8] }}>
                <div className="flex items-center justify-between" style={{ marginBottom: SP[4] }}>
                  <h3 style={sectionLabel}>Acceptance Criteria</h3>
                  <span style={{ fontSize: TY.fontSize.xs, fontFamily: TY.fontFamily.mono, color: C.accent.DEFAULT }}>
                    {metAC} / {totalAC} ({acPct}%)
                  </span>
                </div>

                {/* Progress bar */}
                {totalAC > 0 && (
                  <div
                    style={{
                      width: '100%', height: '4px',
                      borderRadius: R.full,
                      background: C.card.DEFAULT,
                      marginBottom: SP[6],
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        borderRadius: R.full,
                        background: C.accent.DEFAULT,
                        width: `${acPct}%`,
                        transition: `width ${transitions.xSlow}`,
                      }}
                    />
                  </div>
                )}

                {/* AC items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: SP[3] }}>
                  {story.acceptanceCriteria.map(ac => (
                    <label
                      key={ac.id}
                      className={cn('flex items-start', canAC ? 'cursor-pointer' : 'cursor-default')}
                      style={{
                        gap:          SP[4],
                        padding:      SP[4],
                        borderRadius: R.lg,
                        background:   ac.isMet ? C.successBg : C.card.sunken,
                        border:       `1px solid ${C.border.subtle}`,
                        transition:   `background ${transitions.fast}`,
                      }}
                      onMouseEnter={e => {
                        if (canAC) (e.currentTarget as HTMLLabelElement).style.background = C.card.DEFAULT
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLLabelElement).style.background = ac.isMet ? C.successBg : C.card.sunken
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={ac.isMet}
                        onChange={() => canAC && currentUser && toggleAC(story.id, ac.id, currentUser.id)}
                        disabled={!canAC}
                        className="mt-0.5 w-5 h-5 flex-shrink-0 accent-[#cc97ff]"
                      />
                      <span
                        className={cn('leading-snug', ac.isMet && 'line-through')}
                        style={{
                          fontSize:   TY.fontSize.sm,
                          fontWeight: TY.fontWeight.medium,
                          color:      ac.isMet ? C.text.disabled : C.text.primary,
                        }}
                      >
                        {ac.text}
                      </span>
                    </label>
                  ))}
                </div>

                {totalAC === 0 && (
                  <p style={{ fontSize: TY.fontSize.xs, fontStyle: 'italic', color: C.text.disabled }}>
                    No acceptance criteria defined.
                  </p>
                )}

                {/* Add AC */}
                {canEdit && (
                  <div className="flex" style={{ gap: SP[2], marginTop: SP[4] }}>
                    <input
                      value={newAC}
                      onChange={e => setNewAC(e.target.value)}
                      placeholder="Add acceptance criterion..."
                      className="flex-1 outline-none"
                      style={{
                        fontSize:     TY.fontSize.xs,
                        padding:      `${SP[2]} ${SP[3]}`,
                        borderRadius: R.DEFAULT,
                        background:   C.input.bg,
                        border:       `1px solid ${C.border.DEFAULT}`,
                        color:        C.input.text,
                        transition:   `border-color ${transitions.fast}`,
                      }}
                      onFocus={e => ((e.currentTarget as HTMLInputElement).style.borderColor = C.accent.DEFAULT)}
                      onBlur={e => ((e.currentTarget as HTMLInputElement).style.borderColor = C.border.DEFAULT)}
                      onKeyDown={e => e.key === 'Enter' && handleAddAC()}
                    />
                    <button
                      onClick={handleAddAC}
                      style={{
                        padding:      `${SP[2]} ${SP[3]}`,
                        borderRadius: R.DEFAULT,
                        background:   C.accent.DEFAULT,
                        color:        C.accent.on,
                        transition:   `background ${transitions.fast}`,
                      }}
                      onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = C.accent.dim)}
                      onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = C.accent.DEFAULT)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                )}
              </section>

              {/* Comments */}
              <section>
                <div className="flex items-center" style={{ gap: SP[2], marginBottom: SP[6] }}>
                  <h3 style={sectionLabel}>Comments</h3>
                  {story.comments.length > 0 && (
                    <span
                      style={{
                        fontSize:     TY.fontSize['2xs'],
                        fontWeight:   TY.fontWeight.bold,
                        padding:      `${SP[0.5]} ${SP[1.5]}`,
                        borderRadius: R.sm,
                        background:   C.card.DEFAULT,
                        color:        C.accent.DEFAULT,
                      }}
                    >
                      {story.comments.length}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: SP[6] }}>
                  {/* Existing comments */}
                  {story.comments.map(comment => {
                    const commenter = getUserById(comment.userId)
                    return (
                      <div key={comment.id} className="flex items-start" style={{ gap: SP[4] }}>
                        {commenter && (
                          <Avatar
                            user={commenter}
                            size="sm"
                            className="flex-shrink-0"
                            style={{ border: `2px solid ${C.avatar.ring}` }}
                          />
                        )}
                        <div
                          className="flex-1"
                          style={{
                            padding:      SP[4],
                            borderRadius: R.xl,
                            background:   comment.isBlocker ? C.errorBg : C.card.DEFAULT,
                            border:       `1px solid ${comment.isBlocker ? `${C.error}40` : C.border.subtle}`,
                          }}
                        >
                          {comment.isBlocker && (
                            <div
                              className="flex items-center"
                              style={{
                                gap:           SP[1.5],
                                marginBottom:  SP[2],
                                textTransform: 'uppercase',
                                letterSpacing: TY.letterSpacing.wider,
                                fontSize:      TY.fontSize['2xs'],
                                fontWeight:    TY.fontWeight.bold,
                                color:         C.error,
                              }}
                            >
                              <AlertTriangle size={10} /> Blocker
                            </div>
                          )}
                          <div className="flex items-center justify-between" style={{ marginBottom: SP[1.5] }}>
                            <span style={{ fontSize: TY.fontSize.xs, fontWeight: TY.fontWeight.bold, color: C.text.primary }}>
                              {commenter?.name}
                            </span>
                            <span style={{ fontSize: TY.fontSize['2xs'], color: C.text.secondary }}>
                              {formatRelativeTime(comment.createdAt)}
                            </span>
                          </div>
                          <p style={{ fontSize: TY.fontSize.sm, lineHeight: TY.lineHeight.relaxed, color: C.text.secondary }}>
                            {comment.body}
                          </p>
                        </div>
                      </div>
                    )
                  })}

                  {/* New comment input */}
                  <div className="flex items-start" style={{ gap: SP[4] }}>
                    {/* Current user avatar */}
                    <div
                      className="flex-shrink-0 flex items-center justify-center"
                      style={{
                        width:        SP[8],
                        height:       SP[8],
                        borderRadius: R.full,
                        background:   C.accent.DEFAULT,
                      }}
                    >
                      <span style={{ fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold, color: C.accent.on }}>
                        {currentUser ? getInitials(currentUser.name) : 'ME'}
                      </span>
                    </div>

                    <div className="flex-1 relative">
                      <textarea
                        ref={commentRef}
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Leave a comment..."
                        rows={3}
                        className="w-full resize-none outline-none"
                        style={{
                          padding:      `${SP[4]} ${SP[4]} ${SP[14]} ${SP[4]}`,
                          fontSize:     TY.fontSize.sm,
                          borderRadius: R.xl,
                          background:   C.input.bg,
                          border:       `1px solid ${isBlocker ? `${C.error}59` : C.border.DEFAULT}`,
                          color:        C.input.text,
                          transition:   `border-color ${transitions.fast}, box-shadow ${transitions.fast}`,
                        }}
                        onFocus={e => {
                          (e.currentTarget as HTMLTextAreaElement).style.boxShadow = shadows.inputFocus
                        }}
                        onBlur={e => {
                          (e.currentTarget as HTMLTextAreaElement).style.boxShadow = 'none'
                        }}
                      />
                      <div
                        className="absolute flex items-center"
                        style={{ bottom: SP[3], right: SP[3], gap: SP[3] }}
                      >
                        <button
                          type="button"
                          style={{ color: C.text.disabled, transition: `color ${transitions.fast}` }}
                          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = C.accent.DEFAULT)}
                          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = C.text.disabled)}
                          onClick={() => {}}
                        >
                          <Paperclip size={17} />
                        </button>
                        <button
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                          type="button"
                          className="whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{
                            padding:      `${SP[2]} ${SP[5]}`,
                            borderRadius: R.lg,
                            fontSize:     TY.fontSize.xs,
                            fontWeight:   TY.fontWeight.bold,
                            background:   C.accent.DEFAULT,
                            color:        C.accent.on,
                            transition:   `background ${transitions.fast}`,
                          }}
                          onMouseEnter={e => {
                            if (!(e.currentTarget as HTMLButtonElement).disabled)
                              (e.currentTarget as HTMLButtonElement).style.background = C.accent.fixedDim
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = C.accent.DEFAULT
                          }}
                        >
                          {isBlocker ? '🚨 Post Blocker' : 'Post'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

            </div>{/* /body */}

            {/* ── Footer (pinned) ─────────────────────────────────────────── */}
            {canMoveNext && nextStatus && (
              <div
                className="flex-shrink-0"
                style={{
                  padding:     `${SP[4]} ${SP[10]}`,
                  borderTop:   `1px solid ${C.border.subtle}`,
                  background:  C.card.sunken,
                }}
              >
                <Button
                  className="w-full font-bold rounded-xl"
                  style={{
                    height:     SP[11],
                    background: C.accent.DEFAULT,
                    color:      C.accent.on,
                  }}
                  onClick={() => {
                    if (currentUser) moveStory(story.id, nextStatus, currentUser.id)
                    onClose()
                  }}
                >
                  {NEXT_LABEL[story.status] ?? `Move to ${STATUS_LABELS[nextStatus]}`}
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            )}

          </div>{/* /left pane */}

          {/* ══ RIGHT SIDEBAR ══════════════════════════════════════════════ */}
          <div
            className="w-64 flex-shrink-0 flex flex-col overflow-y-auto"
            style={{
              background:  C.pageDim,
              borderLeft:  `1px solid ${C.border.subtle}`,
              padding:     SP[5],
            }}
          >

            {/* Assigned */}
            <div style={divider}>
              <p style={{ ...sectionLabel, marginBottom: SP[3] }}>Assigned</p>
              {assignee ? (
                <div
                  className="flex items-center"
                  style={{
                    gap:          SP[3],
                    padding:      SP[3],
                    borderRadius: R.xl,
                    background:   C.card.DEFAULT,
                    border:       `1px solid ${C.border.subtle}`,
                  }}
                >
                  <div
                    className="flex-shrink-0"
                    style={{
                      borderRadius: R.full,
                      padding:      '2px',
                      background:   `linear-gradient(135deg, ${C.avatar.gradientFrom}B3, ${C.avatar.gradientTo}80)`,
                    }}
                  >
                    <Avatar user={assignee} size="md" className="ring-0 block" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="truncate"
                      style={{ fontSize: TY.fontSize.sm, fontWeight: TY.fontWeight.bold, color: C.text.primary }}
                    >
                      {assignee.name}
                    </p>
                    <p
                      className="capitalize"
                      style={{ fontSize: TY.fontSize['2xs'], color: C.text.secondary, marginTop: SP[0.5] }}
                    >
                      {assignee.role}
                    </p>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: TY.fontSize.xs, fontStyle: 'italic', color: C.text.disabled }}>Unassigned</p>
              )}
            </div>

            {/* Dates */}
            <div style={divider}>
              <p style={{ ...sectionLabel, marginBottom: SP[3] }}>Dates</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: SP[3] }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: TY.fontSize.xs, color: C.text.secondary }}>Created</span>
                  <span style={{ fontSize: TY.fontSize.xs, fontFamily: TY.fontFamily.mono, fontWeight: TY.fontWeight.semibold, color: C.text.primary }}>
                    {formatDate(story.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: TY.fontSize.xs, color: C.text.secondary }}>
                    {story.status === 'done' ? 'Completed' : 'Due Date'}
                  </span>
                  <span style={{ fontSize: TY.fontSize.xs, fontFamily: TY.fontFamily.mono, fontWeight: TY.fontWeight.semibold, color: C.error }}>
                    {story.status === 'done'
                      ? (story.completedAt ? formatDate(story.completedAt) : '—')
                      : (sprint ? formatDate(sprint.endDate) : '—')
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Flag as Blocker — hidden when done */}
            {story.status !== 'done' && (
              <div style={divider}>
                <button
                  onClick={handleFlagBlocker}
                  className="w-full flex items-center text-left"
                  style={{
                    gap:          SP[3],
                    padding:      SP[4],
                    borderRadius: R.xl,
                    background:   isBlocker ? `${C.error}1F` : C.errorBg,
                    border:       `1px solid ${isBlocker ? `${C.error}66` : `${C.error}26`}`,
                    transition:   `background ${transitions.fast}, border-color ${transitions.fast}`,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = `${C.error}1A`
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = isBlocker ? `${C.error}1F` : C.errorBg
                  }}
                >
                  <Flag size={14} style={{ color: C.error, flexShrink: 0 }} />
                  <span style={{ fontSize: TY.fontSize.xs, fontWeight: TY.fontWeight.bold, textTransform: 'uppercase', letterSpacing: TY.letterSpacing.wider, color: C.error }}>
                    {isBlocker ? 'Blocker Flagged' : 'Flag as Blocker'}
                  </span>
                </button>
              </div>
            )}

            {/* Share + Duplicate — done stories only */}
            {story.status === 'done' && (
              <div className="mt-auto" style={{ display: 'flex', flexDirection: 'column', gap: SP[1] }}>
                {[
                  { icon: <Share2 size={14} />, label: 'Share Task',  onClick: handleShareTask },
                  { icon: <Copy   size={14} />, label: 'Duplicate',   onClick: handleDuplicate },
                ].map(({ icon, label, onClick }) => (
                  <button
                    key={label}
                    onClick={onClick}
                    className="w-full flex items-center text-left"
                    style={{
                      gap:          SP[2],
                      padding:      `${SP[2]} ${SP[3]}`,
                      borderRadius: R.lg,
                      fontSize:     TY.fontSize.sm,
                      color:        C.text.secondary,
                      background:   'transparent',
                      transition:   `color ${transitions.fast}, background ${transitions.fast}`,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.color = C.text.primary
                      ;(e.currentTarget as HTMLButtonElement).style.background = C.border.subtle
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.color = C.text.secondary
                      ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                    }}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
            )}

          </div>{/* /right sidebar */}

        </div>
      </SheetContent>
    </Sheet>
  )
}

'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/app.store'
import { useTheme } from '@/hooks/useTheme'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { X, ChevronDown, Wand2 } from 'lucide-react'
import { generateColor } from '@/lib/utils'
import type { Role } from '@/types'
import { toast } from 'sonner'

export function AddMemberDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { colors: C, typography: TY, spacing: SP, radius: R, transitions } = useTheme()
  const { createUser, workspace } = useAppStore()
  const [name, setName]   = useState('')
  const [role, setRole]   = useState<Role>('assignee')
  const [nameFocused, setNameFocused] = useState(false)
  const [roleFocused, setRoleFocused] = useState(false)

  const handleAdd = () => {
    if (!name.trim() || !workspace) return
    createUser({
      name: name.trim(),
      role,
      color: generateColor(),
      timezone: 'UTC',
      workspaceId: workspace.id,
      email: '',
    })
    toast.success(`${name} added to team!`)
    setName('')
    setRole('assignee')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="p-0 gap-0 bg-transparent ring-0 border-0 sm:max-w-sm overflow-hidden rounded-2xl"
      >
        <div style={{
          backgroundColor: C.card.DEFAULT,
          border: `1px solid ${C.border.DEFAULT}`,
          borderRadius: R['2xl'],
          overflow: 'hidden',
        }}>

          {/* ── Header ─────────────────────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: `${SP[5]} ${SP[5]} ${SP[4]}`,
            background: `linear-gradient(135deg, ${C.accent.bgSubtle} 0%, ${C.card.DEFAULT} 65%)`,
            borderBottom: `1px solid ${C.border.subtle}`,
          }}>
            <h2 style={{
              fontSize: TY.fontSize.lg, fontWeight: TY.fontWeight.bold,
              color: C.text.primary, margin: 0,
            }}>
              Add Team Member
            </h2>
            <CloseBtn onClick={onClose} C={C} R={R} transitions={transitions} />
          </div>

          {/* ── Form ───────────────────────────────────────────────── */}
          <div style={{ padding: `${SP[5]} ${SP[5]} ${SP[4]}` }}>

            {/* NAME */}
            <div style={{ marginBottom: SP[4] }}>
              <label style={{
                display: 'block',
                fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
                color: C.text.disabled, letterSpacing: TY.letterSpacing.wider,
                textTransform: 'uppercase', marginBottom: SP[2],
              }}>
                Name
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  placeholder="e.g. Marcus R."
                  data-testid="member-name-input"
                  autoFocus
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    backgroundColor: C.card.sunken,
                    border: `1px solid ${nameFocused ? C.accent.DEFAULT : C.border.DEFAULT}`,
                    borderRadius: R.lg,
                    padding: `${SP[3]} 2.5rem ${SP[3]} ${SP[4]}`,
                    color: C.text.primary,
                    fontSize: TY.fontSize.sm,
                    outline: 'none',
                    transition: `border-color ${transitions.fast}`,
                  }}
                />
                <span style={{
                  position: 'absolute', right: SP[3], top: '50%',
                  transform: 'translateY(-50%)',
                  color: C.text.disabled, display: 'flex',
                  alignItems: 'center', pointerEvents: 'none',
                }}>
                  <Wand2 size={14} />
                </span>
              </div>
            </div>

            {/* ROLE */}
            <div>
              <label style={{
                display: 'block',
                fontSize: TY.fontSize['2xs'], fontWeight: TY.fontWeight.bold,
                color: C.text.disabled, letterSpacing: TY.letterSpacing.wider,
                textTransform: 'uppercase', marginBottom: SP[2],
              }}>
                Role
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as Role)}
                  onFocus={() => setRoleFocused(true)}
                  onBlur={() => setRoleFocused(false)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    backgroundColor: C.card.sunken,
                    border: `1px solid ${roleFocused ? C.accent.DEFAULT : C.border.DEFAULT}`,
                    borderRadius: R.lg,
                    padding: `${SP[3]} 2.5rem ${SP[3]} ${SP[4]}`,
                    color: C.text.primary,
                    fontSize: TY.fontSize.sm,
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    transition: `border-color ${transitions.fast}`,
                  }}
                >
                  <option value="assignee">Assignee (Developer)</option>
                  <option value="admin">Admin (Scrum Master)</option>
                </select>
                <span style={{
                  position: 'absolute', right: SP[3], top: '50%',
                  transform: 'translateY(-50%)',
                  color: C.accent.DEFAULT, display: 'flex',
                  alignItems: 'center', pointerEvents: 'none',
                }}>
                  <ChevronDown size={16} />
                </span>
              </div>
            </div>
          </div>

          {/* ── Footer ─────────────────────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: SP[3],
            padding: `${SP[4]} ${SP[5]}`,
            borderTop: `1px solid ${C.border.subtle}`,
          }}>
            <CancelBtn onClick={onClose} C={C} TY={TY} SP={SP} R={R} transitions={transitions} />
            <AddBtn
              onClick={handleAdd}
              disabled={!name.trim()}
              C={C} TY={TY} SP={SP} R={R} transitions={transitions}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Close Button ─────────────────────────────────────────────────────────────

function CloseBtn({ onClick, C, R, transitions }: any) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '28px', height: '28px',
        border: 'none', borderRadius: R.md,
        backgroundColor: hovered ? 'rgba(255,255,255,0.06)' : 'transparent',
        color: hovered ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)',
        cursor: 'pointer',
        transition: `all ${transitions.fast}`,
        flexShrink: 0,
      }}
    >
      <X size={16} />
    </button>
  )
}

// ─── Cancel Button ────────────────────────────────────────────────────────────

function CancelBtn({ onClick, C, TY, SP, R, transitions }: any) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: '0 0 auto',
        padding: `${SP[2.5]} ${SP[5]}`,
        borderRadius: R.lg,
        border: 'none',
        backgroundColor: hovered ? 'rgba(255,255,255,0.06)' : 'transparent',
        color: hovered ? C.text.primary : C.text.secondary,
        fontSize: TY.fontSize.sm, fontWeight: TY.fontWeight.medium,
        cursor: 'pointer',
        transition: `all ${transitions.fast}`,
      }}
    >
      Cancel
    </button>
  )
}

// ─── Add Member Button ────────────────────────────────────────────────────────

function AddBtn({ onClick, disabled, C, TY, SP, R, transitions }: any) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-testid="confirm-add-member"
      style={{
        flex: 1,
        padding: `${SP[2.5]} ${SP[4]}`,
        borderRadius: R.lg,
        border: 'none',
        backgroundColor: disabled
          ? `${C.accent.DEFAULT}44`
          : hovered ? C.accent.fixedDim : C.accent.DEFAULT,
        color: disabled ? `${C.accent.on}88` : C.accent.on,
        fontSize: TY.fontSize.sm, fontWeight: TY.fontWeight.semibold,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: `all ${transitions.fast}`,
      }}
    >
      Add Member
    </button>
  )
}

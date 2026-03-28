/**
 * SprintArena — Design System
 *
 * Assembled theme object. Compose semantic aliases over raw tokens so that
 * callers think in intent ("text.secondary") not implementation ("#adaaad").
 *
 * Usage:
 *   import { useTheme } from '@/hooks'
 *   const { colors, typography, spacing } = useTheme()
 */

import { palette, typography, spacing, radius, shadows, transitions, breakpoints } from './tokens'

// ─── Semantic color map ───────────────────────────────────────────────────────

const colors = {
  // Page backgrounds
  page:               palette.surface,
  pageDim:            palette.surfaceDim,

  // Panel backgrounds (split-layout login, sidebar, etc.)
  panel: {
    left:             palette.surfaceDim,            // hero / brand side
    right:            palette.surfaceContainerLow,   // form / content side
  },

  // Card elevations
  card: {
    DEFAULT:          palette.surfaceContainerHigh,
    hover:            palette.surfaceBright,
    sunken:           palette.surfaceContainerLow,
  },

  // Text
  text: {
    primary:          palette.onSurface,
    secondary:        palette.onSurfaceVariant,
    muted:            'rgba(173,170,173,0.60)',
    accent:           palette.primary,
    disabled:         palette.outlineVariant,
  },

  // Interactive accent (primary)
  accent: {
    DEFAULT:          palette.primary,
    dim:              palette.primaryDim,
    fixedDim:         palette.primaryFixedDim,
    on:               palette.onPrimaryContainer,     // text on accent bg
    bgSubtle:         'rgba(204,151,255,0.10)',
  },

  // Borders / dividers
  border: {
    subtle:           'rgba(72,71,74,0.10)',
    DEFAULT:          'rgba(72,71,74,0.20)',
    strong:           palette.outlineVariant,
  },

  // Input fields
  input: {
    bg:               palette.surfaceContainerLowest,
    text:             palette.onSurface,
    placeholder:      'rgba(118,117,119,0.50)',
    focusRing:        'rgba(204,151,255,0.40)',
  },

  // Avatar
  avatar: {
    gradientFrom:     palette.primary,
    gradientTo:       palette.primaryDim,
    text:             palette.onPrimaryContainer,
    ring:             'rgba(204,151,255,0.20)',
    dot:              palette.primary,
  },

  // Grid / decorative overlay
  gridLine:           'rgba(204,151,255,0.05)',
  gradientOrb:        'rgba(204,151,255,0.10)',

  // Status
  success:            palette.success,
  successBg:          palette.successContainer,
  error:              palette.error,
  errorBg:            palette.errorContainer,
  warning:            palette.warning,

  // Raw palette (escape hatch only — prefer semantic aliases above)
  palette,
} as const

// ─── Assembled theme ──────────────────────────────────────────────────────────

export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  transitions,
  breakpoints,
} as const

export type Theme     = typeof theme
export type Colors    = typeof colors
export type Palette   = typeof palette

// Re-export raw tokens for direct use where needed
export * from './tokens'

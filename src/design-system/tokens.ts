/**
 * SprintArena — Kinetic Night Design Tokens
 *
 * Single source of truth for all visual values.
 * Change here → every screen updates automatically.
 *
 * Do NOT hardcode colors, spacing, radii, or font values elsewhere.
 * Import from `@/design-system` instead.
 */

// ─── Color Palette ────────────────────────────────────────────────────────────

export const palette = {
  // Surface scale (elevation: dim → bright)
  surfaceContainerLowest: '#000000',
  surfaceDim:             '#0e0e10',
  surface:                '#0e0e10',
  surfaceContainerLow:    '#131315',
  surfaceContainer:       '#19191c',
  surfaceContainerHigh:   '#1f1f22',
  surfaceBright:          '#2c2c2f',

  // Content
  onSurface:              '#f9f5f8',
  onSurfaceVariant:       '#adaaad',

  // Primary — violet/purple
  primary:                '#cc97ff',
  primaryDim:             '#9c48ea',
  primaryFixedDim:        '#b971ff',
  onPrimary:              '#47007c',
  onPrimaryContainer:     '#360061',

  // Outline
  outline:                '#767577',
  outlineVariant:         '#48474a',

  // Status
  success:                '#4ade80',
  successContainer:       'rgba(74,222,128,0.10)',
  warning:                '#fbbf24',
  error:                  '#f87171',
  errorContainer:         'rgba(248,113,113,0.10)',
} as const

// ─── Typography ───────────────────────────────────────────────────────────────

export const typography = {
  fontFamily: {
    headline: 'var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif',
    body:     'var(--font-inter), "Inter", system-ui, sans-serif',
    mono:     'var(--font-geist-mono), "Geist Mono", monospace',
  },
  fontSize: {
    '2xs':  '0.625rem',   //  10px
    xs:     '0.75rem',    //  12px
    sm:     '0.875rem',   //  14px
    base:   '1rem',       //  16px
    lg:     '1.125rem',   //  18px
    xl:     '1.25rem',    //  20px
    '2xl':  '1.5rem',     //  24px
    '3xl':  '1.875rem',   //  30px
    '4xl':  '2.25rem',    //  36px
    '5xl':  '3rem',       //  48px
    '6xl':  '3.75rem',    //  60px
    '7xl':  '4.5rem',     //  72px
  },
  fontWeight: {
    light:    300,
    regular:  400,
    medium:   500,
    semibold: 600,
    bold:     700,
    black:    900,
  },
  lineHeight: {
    none:    1,
    tight:   1.05,
    snug:    1.25,
    normal:  1.5,
    relaxed: 1.625,
  },
  letterSpacing: {
    tighter: '-0.04em',
    tight:   '-0.02em',
    normal:  '0em',
    wide:    '0.05em',
    wider:   '0.1em',
    widest:  '0.2em',
  },
} as const

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const spacing = {
  0.5: '0.125rem',  //  2px
  1:   '0.25rem',   //  4px
  1.5: '0.375rem',  //  6px
  2:   '0.5rem',    //  8px
  2.5: '0.625rem',  // 10px
  3:   '0.75rem',   // 12px
  3.5: '0.875rem',  // 14px
  4:   '1rem',      // 16px
  5:   '1.25rem',   // 20px
  6:   '1.5rem',    // 24px
  7:   '1.75rem',   // 28px
  8:   '2rem',      // 32px
  9:   '2.25rem',   // 36px
  10:  '2.5rem',    // 40px
  12:  '3rem',      // 48px
  14:  '3.5rem',    // 56px
  16:  '4rem',      // 64px
  20:  '5rem',      // 80px
  24:  '6rem',      // 96px
  32:  '8rem',      // 128px
  40:  '10rem',     // 160px
} as const

// ─── Border Radius ────────────────────────────────────────────────────────────

export const radius = {
  none:    '0',
  sm:      '0.25rem',   //  4px
  DEFAULT: '0.5rem',    //  8px
  md:      '0.5rem',    //  8px
  lg:      '0.75rem',   // 12px
  xl:      '1rem',      // 16px
  '2xl':   '1.5rem',    // 24px
  '3xl':   '2rem',      // 32px
  full:    '9999px',
} as const

// ─── Shadows ──────────────────────────────────────────────────────────────────

export const shadows = {
  none:         'none',
  sm:           '0 1px 2px rgba(0,0,0,0.4)',
  DEFAULT:      '0 4px 12px rgba(0,0,0,0.5)',
  lg:           '0 8px 24px rgba(0,0,0,0.6)',
  primaryGlow:  '0 0 20px rgba(204,151,255,0.30)',
  primaryRing:  '0 0 0 2px rgba(204,151,255,0.20)',
  inputFocus:   '0 0 0 1px rgba(204,151,255,0.40)',
} as const

// ─── Transitions ──────────────────────────────────────────────────────────────

export const transitions = {
  fast:    '100ms ease',
  DEFAULT: '200ms ease',
  slow:    '300ms ease',
  xSlow:   '500ms ease',
} as const

// ─── Breakpoints ──────────────────────────────────────────────────────────────

export const breakpoints = {
  sm:  '(min-width: 640px)',
  md:  '(min-width: 768px)',
  lg:  '(min-width: 1024px)',
  xl:  '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
} as const

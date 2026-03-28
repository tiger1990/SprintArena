/**
 * useTheme — access the SprintArena design system.
 *
 * Returns the assembled theme object (colors, typography, spacing, …).
 * All UI components should use this hook instead of importing tokens directly,
 * so a single design-system change propagates everywhere at runtime.
 *
 * Example:
 *   const { colors, typography, radius } = useTheme()
 *   <div style={{ color: colors.text.primary, borderRadius: radius.xl }}>…</div>
 */

import { theme, type Theme } from '@/design-system'

export function useTheme(): Theme {
  // Currently returns the static theme; this hook is intentionally abstracted
  // so that future requirements (user-switchable themes, server-driven tokens)
  // can be added here without touching any component.
  return theme
}

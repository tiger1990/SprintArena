/**
 * useBreakpoint — responsive screen size detection.
 *
 * Reads breakpoints from the design system so media queries stay in sync
 * with any token changes. SSR-safe: returns false for all on first render.
 *
 * Example:
 *   const { isDesktop, isMobile } = useBreakpoint()
 */

'use client'
import { useState, useEffect } from 'react'
import { breakpoints } from '@/design-system'

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

export function useBreakpoint() {
  const isSm  = useMediaQuery(breakpoints.sm)
  const isMd  = useMediaQuery(breakpoints.md)
  const isLg  = useMediaQuery(breakpoints.lg)
  const isXl  = useMediaQuery(breakpoints.xl)
  const is2xl = useMediaQuery(breakpoints['2xl'])

  return {
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,
    isMobile:  !isMd,
    isTablet:  isMd && !isLg,
    isDesktop: isLg,
  } as const
}

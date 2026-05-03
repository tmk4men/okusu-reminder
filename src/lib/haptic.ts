type Pattern = 'tap' | 'success' | 'celebrate'

const PATTERNS: Record<Pattern, number | number[]> = {
  tap: 10,
  success: [0, 18, 40, 30],
  celebrate: [0, 30, 60, 30, 60, 30, 80],
}

export function vibrate(pattern: Pattern): void {
  if (typeof navigator === 'undefined') return
  if (typeof navigator.vibrate !== 'function') return
  try {
    navigator.vibrate(PATTERNS[pattern])
  } catch {
    /* ignore */
  }
}

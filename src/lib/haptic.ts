import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { isNative } from './platform'

type Pattern = 'tap' | 'success' | 'celebrate'

const WEB_PATTERNS: Record<Pattern, number | number[]> = {
  tap: 10,
  success: [0, 18, 40, 30],
  celebrate: [0, 30, 60, 30, 60, 30, 80],
}

export function vibrate(pattern: Pattern): void {
  if (isNative()) {
    if (pattern === 'tap') {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})
    } else if (pattern === 'success') {
      Haptics.notification({ type: NotificationType.Success }).catch(() => {})
    } else {
      Haptics.notification({ type: NotificationType.Success }).catch(() => {})
      window.setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {}), 200)
    }
    return
  }
  if (typeof navigator === 'undefined') return
  if (typeof navigator.vibrate !== 'function') return
  try {
    navigator.vibrate(WEB_PATTERNS[pattern])
  } catch {
    /* ignore */
  }
}

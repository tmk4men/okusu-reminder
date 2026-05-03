import { Capacitor } from '@capacitor/core'

export function isNative(): boolean {
  return Capacitor.isNativePlatform()
}

export function platform(): 'web' | 'android' | 'ios' {
  const p = Capacitor.getPlatform()
  return p === 'android' || p === 'ios' ? p : 'web'
}

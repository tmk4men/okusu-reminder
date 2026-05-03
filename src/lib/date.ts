export function todayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayWeekday(d = new Date()): number {
  return d.getDay()
}

export function nowMinutes(d = new Date()): number {
  return d.getHours() * 60 + d.getMinutes()
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(min: number): string {
  const m = ((min % 1440) + 1440) % 1440
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export function formatRelativeOffset(offsetMin: number): string {
  if (offsetMin === 0) return 'ぴったり'
  const abs = Math.abs(offsetMin)
  const sign = offsetMin > 0 ? '後' : '前'
  if (abs >= 60) {
    const h = Math.floor(abs / 60)
    const m = abs % 60
    return m === 0 ? `${h}時間${sign}` : `${h}時間${m}分${sign}`
  }
  return `${abs}分${sign}`
}

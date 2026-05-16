import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'

export const FREE_MED_LIMIT = 3
const KEY = 'premium'

export function usePremium(): boolean {
  const row = useLiveQuery(() => db.settings.get(KEY))
  return row?.value === true
}

export async function getPremium(): Promise<boolean> {
  const row = await db.settings.get(KEY)
  return row?.value === true
}

export async function setPremium(value: boolean): Promise<void> {
  await db.settings.put({ key: KEY, value })
}

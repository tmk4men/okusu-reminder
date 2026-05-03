import { db } from '../db/schema'
import { DEFAULT_MEAL_TIMES, type MealTimes } from '../db/types'

export async function getMealTimes(): Promise<MealTimes> {
  const row = await db.settings.get('mealTimes')
  return (row?.value as MealTimes) ?? DEFAULT_MEAL_TIMES
}

export async function setMealTimes(v: MealTimes) {
  await db.settings.put({ key: 'mealTimes', value: v })
}

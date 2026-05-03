import Dexie, { type EntityTable } from 'dexie'
import type { Medication, Schedule, DoseLog, Setting } from './types'

export class OkusuDB extends Dexie {
  medications!: EntityTable<Medication, 'id'>
  schedules!: EntityTable<Schedule, 'id'>
  logs!: EntityTable<DoseLog, 'id'>
  settings!: EntityTable<Setting, 'key'>

  constructor() {
    super('okusu-reminder')
    this.version(1).stores({
      medications: '++id, archived, createdAt',
      schedules: '++id, medicationId, enabled',
      logs: '++id, scheduleId, date, [scheduleId+date]',
      settings: 'key',
    })
  }
}

export const db = new OkusuDB()

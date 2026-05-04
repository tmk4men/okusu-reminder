import Dexie, { type EntityTable } from 'dexie'
import type { Medication, Schedule, DoseLog, Setting, Snooze } from './types'

export class OkusuDB extends Dexie {
  medications!: EntityTable<Medication, 'id'>
  schedules!: EntityTable<Schedule, 'id'>
  logs!: EntityTable<DoseLog, 'id'>
  settings!: EntityTable<Setting, 'key'>
  snoozes!: EntityTable<Snooze, 'scheduleId'>

  constructor() {
    super('okusu-reminder')
    this.version(1).stores({
      medications: '++id, archived, createdAt',
      schedules: '++id, medicationId, enabled',
      logs: '++id, scheduleId, date, [scheduleId+date]',
      settings: 'key',
    })
    this.version(2).stores({
      medications: '++id, archived, createdAt',
      schedules: '++id, medicationId, enabled',
      logs: '++id, scheduleId, date, [scheduleId+date]',
      settings: 'key',
      snoozes: '&scheduleId, until',
    })
    this.version(3).stores({
      medications: '++id, archived, createdAt, endDate',
      schedules: '++id, medicationId, enabled',
      logs: '++id, scheduleId, date, [scheduleId+date]',
      settings: 'key',
      snoozes: '&scheduleId, until',
    })
  }
}

export const db = new OkusuDB()

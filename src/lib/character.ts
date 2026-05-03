export type Stage = 'egg' | 'hatched' | 'toddler' | 'child' | 'adult' | 'master'

export interface StageDef {
  stage: Stage
  minDoses: number
  name: string
  message: string
}

export const STAGES: StageDef[] = [
  { stage: 'egg', minDoses: 0, name: 'たまご', message: 'これから生まれるよ' },
  { stage: 'hatched', minDoses: 1, name: 'ふ化したて', message: '生まれたよ！' },
  { stage: 'toddler', minDoses: 5, name: 'よちよち', message: 'よちよち歩いてる' },
  { stage: 'child', minDoses: 30, name: 'こどもペン', message: '元気いっぱい' },
  { stage: 'adult', minDoses: 100, name: 'おとなペン', message: '頼れる相棒' },
  { stage: 'master', minDoses: 300, name: 'のんマスター', message: '王者のオーラ' },
]

export interface CharacterState {
  total: number
  stage: StageDef
  level: number
  nextStage?: StageDef
  toNext?: number
  progressPct: number
}

export function characterFromTotal(total: number): CharacterState {
  let stage = STAGES[0]
  let nextStage: StageDef | undefined
  for (let i = 0; i < STAGES.length; i++) {
    if (total >= STAGES[i].minDoses) {
      stage = STAGES[i]
      nextStage = STAGES[i + 1]
    }
  }

  const level = Math.max(1, Math.floor(Math.sqrt(total + 1)))

  let toNext: number | undefined
  let progressPct = 100
  if (nextStage) {
    toNext = nextStage.minDoses - total
    const span = nextStage.minDoses - stage.minDoses
    progressPct = Math.min(100, Math.round(((total - stage.minDoses) / span) * 100))
  }

  return { total, stage, level, nextStage, toNext, progressPct }
}

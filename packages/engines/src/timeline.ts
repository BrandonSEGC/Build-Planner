// SEGC Build Timeline engine — pure TS. Accepts `now` for deterministic output.

import { clamp } from "./format"

export interface TimelineState {
  stage: string
  region: string
  sqft: number
  complexity: string
  tier: string
  basement: boolean
  pool: boolean
  financing: string
  targetDate: string
}

// *** ALL DURATIONS LIVE HERE — SWAP FOR SEGC'S REAL NUMBERS *** // PLACEHOLDER
export const TIMELINE_CONFIG = {
  design: [8, 14] as [number, number],
  permitting: {
    sandhills: [6, 10],
    triad: [7, 11],
    charlotte: [8, 12],
    triangle: [9, 14],
    coastal: [10, 16],
    mountains: [9, 15],
  } as Record<string, number[]>, // PLACEHOLDER
  foundation: [4, 8] as [number, number],
  framing: [8, 12] as [number, number],
  mep: [4, 6] as [number, number],
  finishes: [10, 16] as [number, number],
  punch: [2, 4] as [number, number],
  financingDelay: [4, 6] as [number, number], // PLACEHOLDER
}

function addWeeks(date: Date, weeks: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + weeks * 7)
  return next
}

function stageIndex(stage: string) {
  const stages: Record<string, number> = {
    exploring: 0,
    design: 0,
    permits: 1,
    site: 2,
    framing: 3,
    mep: 4,
    finishes: 5,
  }
  return stages[stage] ?? 0
}

export function computeTimeline(
  state: TimelineState,
  config = TIMELINE_CONFIG,
  now: Date = new Date(),
) {
  const sqftScale = Math.sqrt(state.sqft / 2800)
  const complexityScale = ({ simple: 0.92, custom: 1, complex: 1.14 } as Record<string, number>)[state.complexity] ?? 1
  const tierScale = ({ essential: 0.94, signature: 1, bespoke: 1.16 } as Record<string, number>)[state.tier] ?? 1
  const permit = config.permitting[state.region] ?? [8, 12]
  const phases = [
    { id: "design", label: "Design", min: config.design[0], max: config.design[1] },
    { id: "permits", label: "Permits", min: permit[0], max: permit[1] },
    {
      id: "foundation",
      label: "Foundation",
      min: config.foundation[0] + (state.basement ? 3 : 0),
      max: config.foundation[1] + (state.basement ? 3 : 0),
    },
    { id: "framing", label: "Framing", min: config.framing[0], max: config.framing[1] },
    { id: "mep", label: "MEP", min: config.mep[0], max: config.mep[1] },
    { id: "finishes", label: "Finishes", min: config.finishes[0], max: config.finishes[1] },
    { id: "punch", label: "Punch", min: config.punch[0], max: config.punch[1] },
  ].map((phase, index) => {
    const scale = index >= 2 ? sqftScale * complexityScale * (phase.id === "finishes" ? tierScale : 1) : 1
    return { ...phase, min: Math.round(phase.min * scale), max: Math.round(phase.max * scale) }
  })
  if (state.pool) phases[5] = { ...phases[5], min: phases[5].min + 2, max: phases[5].max + 4 }
  const start = clamp(stageIndex(state.stage), 0, phases.length - 1)
  const remaining = phases.slice(start)
  let minWeeks = remaining.reduce((total, phase) => total + phase.min, 0)
  let maxWeeks = remaining.reduce((total, phase) => total + phase.max, 0)
  if (state.financing === "not-started") {
    minWeeks += config.financingDelay[0]
    maxWeeks += config.financingDelay[1]
  }
  const moveInStart = addWeeks(now, minWeeks)
  const moveInEnd = addWeeks(now, maxWeeks)
  const target = state.targetDate ? new Date(`${state.targetDate}T12:00:00`) : null
  const tight = Boolean(target && target < moveInStart)
  const designStartBy = target ? addWeeks(target, -maxWeeks) : now
  return {
    phases,
    currentIndex: start,
    minWeeks,
    maxWeeks,
    moveInStart: moveInStart.toISOString(),
    moveInEnd: moveInEnd.toISOString(),
    designStartBy: designStartBy.toISOString(),
    tight,
  }
}

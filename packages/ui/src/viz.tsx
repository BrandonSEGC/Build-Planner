"use client"

// Data-viz components per the design brief:
// DTI meter (green/gold/brown comfort zones), StackedCostBar (land/site/build/soft),
// GanttPhaseBar with gold "you are here" marker.

import { tokens } from "./tokens"

const ZONE_GREEN = "#4C7A3F" // comfort — the one sanctioned off-palette accent (design brief: green/gold/brown zones)

export function DTIMeter({ dti, cap = 50 }: { dti: number; cap?: number }) {
  const clamped = Math.min(cap, Math.max(0, dti))
  const pct = (clamped / cap) * 100
  const zone = dti <= 36 ? "COMFORTABLE" : dti <= 43 ? "WORKABLE" : "STRETCHED"
  const zoneColor = dti <= 36 ? ZONE_GREEN : dti <= 43 ? tokens.gold : tokens.brownMid
  return (
    <div aria-label={`Debt-to-income ratio ${dti.toFixed(1)} percent — ${zone}`} role="img" style={{ display: "grid", gap: 8 }}>
      <div style={{ alignItems: "baseline", display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontFamily: tokens.display, fontSize: 13, fontWeight: 700, letterSpacing: "-0.3px", textTransform: "uppercase" }}>
          DTI · {dti.toFixed(1)}%
        </span>
        <strong style={{ color: zoneColor, fontFamily: tokens.display, fontSize: 13, textTransform: "uppercase" }}>{zone}</strong>
      </div>
      <div style={{ display: "flex", height: 10, overflow: "hidden", position: "relative" }}>
        <span style={{ background: ZONE_GREEN, width: `${(36 / cap) * 100}%` }} />
        <span style={{ background: tokens.gold, width: `${((43 - 36) / cap) * 100}%` }} />
        <span style={{ background: tokens.brownMid, flexGrow: 1 }} />
        <span
          aria-hidden="true"
          style={{
            background: tokens.ink,
            border: "2px solid #fff",
            height: 18,
            left: `calc(${pct}% - 4px)`,
            position: "absolute",
            top: -4,
            width: 8,
          }}
        />
      </div>
      <span style={{ fontFamily: tokens.body, fontSize: 11, opacity: 0.6 }}>
        Under 36% comfortable · 36–43% workable · above 43% stretched
      </span>
    </div>
  )
}

export interface CostSegment {
  label: string
  value: string
  pct: number
  color: string
}

export const LAND_BUILD_COLORS = {
  land: tokens.gold,
  site: tokens.brownMid,
  build: tokens.brown,
  soft: "#857D72",
} as const

export function StackedCostBar({ segments, dark = false }: { segments: CostSegment[]; dark?: boolean }) {
  const fg = dark ? tokens.warm : tokens.ink
  // Deep brown vanishes on the dark spec panel — swap it for the brand's
  // white-overlay-on-dark variant so every segment stays legible.
  const displayColor = (color: string) =>
    dark && color.toLowerCase() === tokens.brown.toLowerCase() ? "rgba(255,251,245,.34)" : color
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div aria-hidden="true" style={{ display: "flex", height: 26, overflow: "hidden" }}>
        {segments.map((segment) => (
          <span
            key={segment.label}
            style={{
              background: displayColor(segment.color),
              borderRight: "1px solid rgba(255,255,255,.4)",
              width: `${Math.max(1, segment.pct)}%`,
            }}
          />
        ))}
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {segments.map((segment) => (
          <div key={segment.label} style={{ alignItems: "baseline", display: "flex", gap: 10, justifyContent: "space-between" }}>
            <span style={{ alignItems: "center", color: fg, display: "inline-flex", fontFamily: tokens.body, fontSize: 12, gap: 8, opacity: 0.85 }}>
              <span aria-hidden="true" style={{ background: displayColor(segment.color), display: "inline-block", height: 10, width: 10 }} />
              {segment.label}
            </span>
            <strong style={{ color: fg, fontFamily: tokens.display, fontSize: 13, textTransform: "uppercase" }}>
              {segment.value} · {Math.round(segment.pct)}%
            </strong>
          </div>
        ))}
      </div>
    </div>
  )
}

export interface GanttPhase {
  id: string
  label: string
  min: number
  max: number
}

export function GanttPhaseBar({
  phases,
  currentIndex,
  dark = false,
}: {
  phases: GanttPhase[]
  currentIndex: number
  dark?: boolean
}) {
  const fg = dark ? tokens.warm : tokens.ink
  const totalMax = phases.reduce((sum, phase) => sum + phase.max, 0) || 1
  let offset = 0
  return (
    <div style={{ display: "grid", gap: 7 }}>
      {phases.map((phase, index) => {
        const left = (offset / totalMax) * 100
        const width = (phase.max / totalMax) * 100
        offset += phase.max
        const done = index < currentIndex
        const current = index === currentIndex
        return (
          <div key={phase.id} style={{ alignItems: "center", display: "grid", gap: 10, gridTemplateColumns: "92px 1fr 74px" }}>
            <span
              style={{
                color: current ? tokens.gold : fg,
                fontFamily: tokens.display,
                fontSize: 11,
                fontWeight: 700,
                opacity: done ? 0.45 : 1,
                textTransform: "uppercase",
              }}
            >
              {phase.label}
            </span>
            <div style={{ background: dark ? "rgba(255,251,245,.12)" : "#EDE8E1", height: 14, position: "relative" }}>
              <span
                style={{
                  background: done ? (dark ? "rgba(255,251,245,.35)" : "#C9C1B6") : current ? tokens.gold : tokens.brownMid,
                  height: "100%",
                  left: `${left}%`,
                  position: "absolute",
                  width: `${Math.max(2, width)}%`,
                }}
              />
              {current && (
                <span
                  aria-label="You are here"
                  style={{
                    background: tokens.gold,
                    border: `2px solid ${dark ? tokens.brown : "#fff"}`,
                    height: 22,
                    left: `calc(${left}% - 3px)`,
                    position: "absolute",
                    top: -4,
                    width: 8,
                  }}
                />
              )}
            </div>
            <span style={{ color: fg, fontFamily: tokens.body, fontSize: 11, opacity: 0.7, textAlign: "right" }}>
              {phase.min}–{phase.max} wk
            </span>
          </div>
        )
      })}
    </div>
  )
}

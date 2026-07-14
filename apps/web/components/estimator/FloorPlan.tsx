"use client"

import type { HomeEstimateState } from "@segc/engines"

/** Live concept sketch — plan-view schematic that redraws with the configuration. */
export function FloorPlan({ state }: { state: HomeEstimateState }) {
  const rooms: [string, number, number, number, number][] = [
    ["GREAT ROOM", 18, 18, 120, 88],
    ["KITCHEN", 138, 18, 84, 54],
    ["DINING", 138, 72, 84, 34],
    ["PRIMARY", 18, 106, 104, 70],
    ["BATH", 122, 106, 50, 44],
    ["BED", 172, 106, 50, 44],
    ["GARAGE", 122, 150, 100, 50],
  ]
  const visible = state.garage ? rooms : rooms.slice(0, rooms.length - 1)
  return (
    <svg
      aria-label="Conceptual floor plan"
      role="img"
      viewBox="0 0 240 218"
      style={{
        background: "#FFFDF9",
        border: "1px solid rgba(244,178,20,.35)",
        display: "block",
        marginTop: 20,
        width: "100%",
      }}
    >
      <rect fill="none" height="196" stroke="rgba(244,178,20,.72)" strokeWidth="2" width="216" x="12" y="10" />
      {visible.map(([label, x, y, width, height]) => (
        <g key={label}>
          <rect
            fill="rgba(244,178,20,.035)"
            height={height}
            stroke="rgba(69,30,0,.32)"
            strokeWidth="1"
            width={width}
            x={x}
            y={y}
          />
          <text
            fill="rgba(69,30,0,.78)"
            fontFamily="var(--font-oswald), Oswald, sans-serif"
            fontSize="7"
            textAnchor="middle"
            x={x + width / 2}
            y={y + height / 2}
          >
            {label}
          </text>
        </g>
      ))}
      <text
        fill="#F4B214"
        fontFamily="var(--font-oswald), Oswald, sans-serif"
        fontSize="8"
        textAnchor="middle"
        x="120"
        y="214"
      >
        CONCEPT ONLY · {state.sqft.toLocaleString()} SQ FT · {state.stories} STORY
      </text>
    </svg>
  )
}

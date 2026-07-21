"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { PLAN_CHAPTERS } from "@/lib/planner"

const oswald = "var(--font-oswald), 'Oswald', 'Arial Narrow', sans-serif"
const inter = "var(--font-inter), 'Inter', Arial, sans-serif"

export function PlanJourneyHeader() {
  const pathname = usePathname()
  const chapterIndex = PLAN_CHAPTERS.findIndex((chapter) => pathname.startsWith(chapter.href))
  const onHub = pathname === "/plan"

  return (
    <nav
      aria-label="Build plan progress"
      style={{
        background: "#2E1400",
        borderBottom: "1px solid rgba(255,255,255,.12)",
        color: "#FFFBF5",
        padding: "12px 28px",
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexWrap: "wrap",
          gap: 14,
          justifyContent: "space-between",
          margin: "0 auto",
          maxWidth: 1180,
        }}
      >
        <Link
          href="/plan"
          style={{
            color: "#FFFBF5",
            fontFamily: oswald,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
            textTransform: "uppercase",
          }}
        >
          THE SEGC BUILD PLANNER
        </Link>
        <span style={{ fontFamily: inter, fontSize: 11, opacity: 0.68 }}>
          {chapterIndex >= 0
            ? `CHAPTER ${chapterIndex + 1} OF ${PLAN_CHAPTERS.length} · ${PLAN_CHAPTERS[chapterIndex].shortTitle.toUpperCase()}`
            : onHub
              ? "ONE GUIDED PLAN · SAVED AS YOU GO"
              : "YOUR PLAN"}
        </span>
        <div
          aria-hidden="true"
          style={{
            display: "grid",
            gap: 4,
            gridTemplateColumns: `repeat(${PLAN_CHAPTERS.length}, minmax(20px, 42px))`,
          }}
        >
          {PLAN_CHAPTERS.map((chapter, index) => (
            <span
              key={chapter.id}
              style={{
                background: chapterIndex >= 0 && index <= chapterIndex ? "#F4B214" : "rgba(255,255,255,.2)",
                display: "block",
                height: 4,
              }}
            />
          ))}
        </div>
      </div>
    </nav>
  )
}

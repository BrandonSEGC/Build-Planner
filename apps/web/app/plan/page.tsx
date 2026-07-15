// /plan — the hub. Anonymous visitors see the marketing hub;
// recognized visitors see "My Build Plan" progress.

import Link from "next/link"
import { getJourneyId } from "@/lib/journey"
import { getLead, listModuleRuns } from "@/lib/repo"
import { TOOL_LABELS } from "@/lib/fulfill"
import { ResumeCard } from "@/components/hub/ResumeCard"

export const dynamic = "force-dynamic"

const MODULES: {
  id: string
  title: string
  promise: string
  href: string
  live: boolean
  featured?: boolean
}[] = [
  {
    id: "estimator",
    title: "CUSTOM HOME COST ESTIMATOR",
    promise: "Design the footprint, finishes, and features — get a real planning range.",
    href: "/plan/estimator",
    live: true,
    featured: true,
  },
  {
    id: "affordability",
    title: "AFFORDABILITY CALCULATOR",
    promise: "See what you can build before you talk to a lender. VA-loan aware.",
    href: "/plan/affordability",
    live: true,
  },
  {
    id: "land",
    title: "LAND + BUILD ESTIMATOR",
    promise: "Most builders quote the house. We quote the whole picture.",
    href: "/plan/land",
    live: true,
  },
  {
    id: "style",
    title: "HOME STYLE QUIZ",
    promise: "8 questions. Your architectural identity. Zero math.",
    href: "/plan/style",
    live: true,
  },
  {
    id: "timeline",
    title: "BUILD TIMELINE ESTIMATOR",
    promise: "When can you move in? On time isn’t a slogan — it’s a schedule.",
    href: "/plan/timeline",
    live: true,
  },
]

const oswald = "var(--font-oswald), 'Oswald', 'Arial Narrow', sans-serif"
const inter = "var(--font-inter), 'Inter', Arial, sans-serif"

function PreHeader({ children, color = "#F4B214" }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      style={{
        color,
        fontFamily: oswald,
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: "-0.3px",
        textTransform: "uppercase",
      }}
    >
      ■ {children} ■
    </div>
  )
}

export default async function PlanHub({
  searchParams,
}: {
  searchParams: Promise<{ resumed?: string; resume?: string }>
}) {
  const params = await searchParams
  const journeyId = await getJourneyId()
  const lead = journeyId ? await getLead(journeyId) : null
  const runs = journeyId ? await listModuleRuns(journeyId) : []
  const completedByTool = new Map(runs.map((run) => [run.toolId, run]))
  const recognized = Boolean(lead)
  const firstName = lead?.name.split(" ")[0]
  const completedCount = MODULES.filter((m) => completedByTool.has(m.id)).length

  return (
    <div style={{ background: "#FFFCFC", minHeight: "100vh" }}>
      {/* RESUME BANNERS */}
      {params.resumed === "1" && recognized && (
        <div style={{ background: "#F4B214", color: "#000", fontFamily: oswald, fontSize: 14, fontWeight: 700, padding: "12px 28px", textTransform: "uppercase" }}>
          ⚑ WELCOME BACK{firstName ? `, ${firstName}` : ""} — YOUR BUILD PLAN IS RESTORED.
        </div>
      )}
      {params.resume === "expired" && (
        <div style={{ background: "#693709", color: "#FFFBF5", fontFamily: inter, fontSize: 13.5, padding: "12px 28px" }}>
          That sign-in link has expired or was already used — request a fresh one below.
        </div>
      )}
      {/* HERO — dark */}
      <section style={{ background: "#451E00", color: "#FFFBF5", padding: "72px 28px 64px" }}>
        <div style={{ margin: "0 auto", maxWidth: 1140 }}>
          <PreHeader>{recognized ? "MY BUILD PLAN" : "THE SEGC BUILD PLANNER"}</PreHeader>
          <h1
            style={{
              fontFamily: oswald,
              fontSize: "clamp(38px, 7vw, 76px)",
              fontWeight: 700,
              letterSpacing: "-1.88px",
              lineHeight: 0.98,
              margin: "16px 0 0",
              maxWidth: "18ch",
              textTransform: "uppercase",
            }}
          >
            {recognized && firstName
              ? `${firstName}, YOUR PLAN IS TAKING SHAPE.`
              : "PLAN YOUR BUILD BEFORE YOU SPEND A DOLLAR."}
          </h1>
          <p style={{ fontFamily: inter, fontSize: 17, lineHeight: 1.55, margin: "20px 0 26px", maxWidth: "52ch", opacity: 0.8 }}>
            {recognized
              ? "Pick up where you left off — every answer you’ve given carries into the next tool."
              : "Know your numbers before you spend a dollar. Cost, affordability, land, style, and timeline — real math, real documents, before you ever talk to anyone."}
          </p>
          {recognized && (
            <div style={{ margin: "0 0 26px", maxWidth: 520 }}>
              <div style={{ alignItems: "baseline", display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "#F4B214", fontFamily: oswald, fontSize: 13, fontWeight: 700, textTransform: "uppercase" }}>
                  ■ PLAN PROGRESS ■
                </span>
                <strong style={{ fontFamily: oswald, fontSize: 14, textTransform: "uppercase" }}>
                  {completedCount} OF {MODULES.length} COMPLETE
                </strong>
              </div>
              <div style={{ background: "rgba(255,251,245,.15)", display: "flex", height: 6 }}>
                <span style={{ background: "#F4B214", width: `${(completedCount / MODULES.length) * 100}%` }} />
              </div>
              <a
                href={process.env.NEXT_PUBLIC_CAL_LINK ?? "https://southeasterngc.com/contact"}
                style={{
                  background: "#F4B214",
                  color: "#000",
                  display: "inline-block",
                  fontFamily: oswald,
                  fontSize: 15,
                  fontWeight: 700,
                  marginTop: 18,
                  padding: "15px 22px",
                  textDecoration: "none",
                  textTransform: "uppercase",
                }}
              >
                BOOK A FREE DESIGN CONSULTATION ›
              </a>
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
            {["20+ Years of Experience", "SBA 8(a) & HUBZone Certified", "Fayetteville’s #1 Rated Contractor"].map(
              (item) => (
                <span
                  key={item}
                  style={{
                    alignItems: "center",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: 54,
                    display: "inline-flex",
                    fontFamily: inter,
                    fontSize: 12,
                    fontWeight: 600,
                    gap: 8,
                    padding: "8px 14px",
                  }}
                >
                  <span aria-hidden="true" style={{ color: "#F4B214" }}>●</span>
                  {item}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      {/* RESUME BY EMAIL — anonymous visitors only */}
      {!recognized && (
        <section style={{ margin: "0 auto", maxWidth: 1140, padding: "28px 28px 0" }}>
          <ResumeCard />
        </section>
      )}

      {/* MODULE GRID */}
      <section style={{ margin: "0 auto", maxWidth: 1140, padding: "56px 28px 24px" }}>
        <PreHeader color="#693709">FIVE TOOLS. ONE PLAN.</PreHeader>
        <h2
          style={{
            color: "#141414",
            fontFamily: oswald,
            fontSize: "clamp(30px, 4.5vw, 46px)",
            fontWeight: 700,
            letterSpacing: "-1.64px",
            margin: "12px 0 30px",
            textTransform: "uppercase",
          }}
        >
          START WHERE IT HURTS MOST.
        </h2>
        <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          {MODULES.map((module) => {
            const done = completedByTool.get(module.id)
            const card = (
              <div
                key={module.id}
                style={{
                  background: module.featured ? "#451E00" : "#FFFFFF",
                  border: "1px solid rgba(69,30,0,0.09)",
                  borderRadius: 20,
                  boxShadow: "0 18px 55px rgba(69,30,0,0.07)",
                  color: module.featured ? "#FFFBF5" : "#141414",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  gridColumn: module.featured ? "1 / -1" : undefined,
                  padding: 28,
                  position: "relative",
                }}
              >
                {module.featured && (
                  <span
                    style={{
                      background: "#F4B214",
                      color: "#000",
                      fontFamily: oswald,
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "6px 12px",
                      position: "absolute",
                      right: 24,
                      top: 24,
                      textTransform: "uppercase",
                    }}
                  >
                    MOST POPULAR
                  </span>
                )}
                <span
                  style={{
                    color: module.featured ? "#F4B214" : "#693709",
                    fontFamily: oswald,
                    fontSize: 13,
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  ■ {TOOL_LABELS[module.id] ?? module.id} ■
                </span>
                <h3
                  style={{
                    fontFamily: oswald,
                    fontSize: module.featured ? "clamp(26px, 4vw, 40px)" : 24,
                    fontWeight: 700,
                    letterSpacing: "-0.64px",
                    lineHeight: 1.05,
                    margin: 0,
                    textTransform: "uppercase",
                  }}
                >
                  {module.title}
                </h3>
                <p
                  style={{
                    fontFamily: inter,
                    fontSize: 14,
                    lineHeight: 1.5,
                    margin: 0,
                    maxWidth: "52ch",
                    opacity: module.featured ? 0.78 : 0.72,
                  }}
                >
                  {module.promise}
                </p>
                {done ? (
                  <div style={{ marginTop: 6 }}>
                    <span style={{ display: "block", fontFamily: inter, fontSize: 12, opacity: 0.6 }}>
                      YOUR RESULT
                    </span>
                    <strong style={{ fontFamily: oswald, fontSize: 26, letterSpacing: "-0.6px" }}>
                      {done.headlineResult}
                    </strong>
                  </div>
                ) : null}
                <div style={{ marginTop: "auto", paddingTop: 10 }}>
                  {module.live ? (
                    <span
                      style={{
                        background: "#F4B214",
                        color: "#000",
                        display: "inline-block",
                        fontFamily: oswald,
                        fontSize: 15,
                        fontWeight: 700,
                        padding: "15px 22px",
                        textTransform: "uppercase",
                      }}
                    >
                      {done ? "RUN IT AGAIN ›" : module.featured ? "GET YOUR ESTIMATE ›" : "START ›"}
                    </span>
                  ) : (
                    <span
                      style={{
                        border: `1px solid ${module.featured ? "#FFFBF5" : "#141414"}`,
                        display: "inline-block",
                        fontFamily: oswald,
                        fontSize: 13,
                        fontWeight: 700,
                        opacity: 0.5,
                        padding: "13px 20px",
                        textTransform: "uppercase",
                      }}
                    >
                      COMING SOON
                    </span>
                  )}
                </div>
              </div>
            )
            return module.live ? (
              <Link
                href={module.href}
                key={module.id}
                style={{ display: "contents", textDecoration: "none", color: "inherit" }}
              >
                {card}
              </Link>
            ) : (
              card
            )
          })}
        </div>
      </section>

      {/* CTA BAND — dark */}
      <section style={{ background: "#451E00", color: "#FFFBF5", marginTop: 56, padding: "56px 28px" }}>
        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "space-between", margin: "0 auto", maxWidth: 1140 }}>
          <div>
            <PreHeader>READY WHEN YOU ARE</PreHeader>
            <h2
              style={{
                fontFamily: oswald,
                fontSize: "clamp(28px, 4.5vw, 44px)",
                fontWeight: 700,
                letterSpacing: "-1.4px",
                margin: "12px 0 0",
                maxWidth: "22ch",
                textTransform: "uppercase",
              }}
            >
              WE DON’T SELL CONSTRUCTION. WE SELL CERTAINTY.
            </h2>
          </div>
          <a
            href={process.env.NEXT_PUBLIC_CAL_LINK ?? "https://southeasterngc.com/contact"}
            style={{
              background: "#F4B214",
              color: "#000",
              fontFamily: oswald,
              fontSize: 16,
              fontWeight: 700,
              padding: "18px 26px",
              textDecoration: "none",
              textTransform: "uppercase",
            }}
          >
            BOOK A FREE DESIGN CONSULTATION ›
          </a>
        </div>
      </section>
    </div>
  )
}

// /plan — the hub. Anonymous visitors see the marketing hub;
// recognized visitors see "My Build Plan" progress.

import Link from "next/link"
import { getJourneyId } from "@/lib/journey"
import { getLead, getLatestPlanDraft, listModuleRuns } from "@/lib/repo"
import {
  getPlanChapter,
  latestRunsByTool,
  nextIncompleteChapter,
  PLAN_CHAPTERS,
} from "@/lib/planner"
import { ResumeCard } from "@/components/hub/ResumeCard"

export const dynamic = "force-dynamic"

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
  searchParams: Promise<{ complete?: string; resumed?: string; resume?: string }>
}) {
  const params = await searchParams
  const journeyId = await getJourneyId()
  const [lead, runs, draft] = journeyId
    ? await Promise.all([
        getLead(journeyId),
        listModuleRuns(journeyId),
        getLatestPlanDraft(journeyId),
      ])
    : [null, [], null]
  const completedByTool = latestRunsByTool(runs)
  const recognized = Boolean(lead)
  const firstName = lead?.name.split(" ")[0]
  const completedCount = PLAN_CHAPTERS.filter((chapter) => completedByTool.has(chapter.id)).length
  const activeChapter = (draft ? getPlanChapter(draft.toolId) : null) ?? nextIncompleteChapter(runs)

  return (
    <div style={{ background: "#FFFCFC", minHeight: "100vh" }}>
      {/* RESUME BANNERS */}
      {params.resumed === "1" && recognized && (
        <div style={{ background: "#F4B214", color: "#000", fontFamily: oswald, fontSize: 14, fontWeight: 700, padding: "12px 28px", textTransform: "uppercase" }}>
          ⚑ WELCOME BACK{firstName ? `, ${firstName}` : ""} — YOUR BUILD PLAN IS RESTORED.
        </div>
      )}
      {params.complete === "1" && completedCount === PLAN_CHAPTERS.length && (
        <div style={{ background: "#F4B214", color: "#000", fontFamily: oswald, fontSize: 14, fontWeight: 700, padding: "12px 28px", textTransform: "uppercase" }}>
          ⚑ ALL FIVE CHAPTERS ARE COMPLETE — YOUR UNIFIED BUILD PLAN IS READY TO EXPORT.
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
                  {completedCount} OF {PLAN_CHAPTERS.length} COMPLETE
                </strong>
              </div>
              <div style={{ background: "rgba(255,251,245,.15)", display: "flex", height: 6 }}>
                <span style={{ background: "#F4B214", width: `${(completedCount / PLAN_CHAPTERS.length) * 100}%` }} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
                <Link
                  href="/plan/continue"
                  style={{
                    background: "#F4B214",
                    color: "#000",
                    display: "inline-block",
                    fontFamily: oswald,
                    fontSize: 15,
                    fontWeight: 700,
                    padding: "15px 22px",
                    textDecoration: "none",
                    textTransform: "uppercase",
                  }}
                >
                  {activeChapter ? "CONTINUE MY BUILD PLAN ›" : "REVIEW MY BUILD PLAN ›"}
                </Link>
                {completedCount > 0 && (
                  <a
                    href="/api/plan/pdf"
                    style={{
                      border: "1px solid rgba(255,251,245,.7)",
                      color: "#FFFBF5",
                      display: "inline-block",
                      fontFamily: oswald,
                      fontSize: 15,
                      fontWeight: 700,
                      padding: "14px 22px",
                      textDecoration: "none",
                      textTransform: "uppercase",
                    }}
                  >
                    EXPORT RESULTS PDF ↓
                  </a>
                )}
              </div>
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

      {/* UNIFIED PLAN ROADMAP */}
      <section style={{ margin: "0 auto", maxWidth: 1140, padding: "56px 28px 24px" }}>
        <PreHeader color="#693709">ONE TOOL. FIVE CONNECTED CHAPTERS.</PreHeader>
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
          FOLLOW ONE PATH FROM IDEA TO BUILD-READY.
        </h2>
        <p style={{ color: "#5E574F", fontFamily: inter, fontSize: 15, lineHeight: 1.55, margin: "-16px 0 26px", maxWidth: "62ch" }}>
          No tool picker and no repeated setup. Your answers carry forward, each step saves
          automatically, and your results come together in one build plan.
        </p>
        <Link
          href="/plan/continue"
          style={{
            background: "#F4B214",
            color: "#000",
            display: "inline-block",
            fontFamily: oswald,
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 28,
            padding: "17px 24px",
            textDecoration: "none",
            textTransform: "uppercase",
          }}
        >
          {activeChapter
            ? `${completedCount ? "CONTINUE" : "START"} MY BUILD PLAN ›`
            : "REVIEW MY COMPLETED PLAN ›"}
        </Link>
        <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          {PLAN_CHAPTERS.map((module, index) => {
            const done = completedByTool.get(module.id)
            const active = activeChapter?.id === module.id
            const card = (
              <div
                key={module.id}
                style={{
                  background: active ? "#451E00" : "#FFFFFF",
                  border: "1px solid rgba(69,30,0,0.09)",
                  borderRadius: 20,
                  boxShadow: "0 18px 55px rgba(69,30,0,0.07)",
                  color: active ? "#FFFBF5" : "#141414",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  padding: 28,
                  position: "relative",
                }}
              >
                {active && (
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
                    {draft?.toolId === module.id ? "SAVED HERE" : "UP NEXT"}
                  </span>
                )}
                <span
                  style={{
                    color: active ? "#F4B214" : "#693709",
                    fontFamily: oswald,
                    fontSize: 13,
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  ■ CHAPTER {index + 1} OF {PLAN_CHAPTERS.length} ■
                </span>
                <h3
                  style={{
                    fontFamily: oswald,
                    fontSize: active ? "clamp(26px, 4vw, 36px)" : 24,
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
                    opacity: active ? 0.78 : 0.72,
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
                  <span
                    style={{
                      color: active ? "#F4B214" : done ? "#2E7D32" : "#857D72",
                      fontFamily: oswald,
                      fontSize: 13,
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    {done ? "✓ COMPLETE" : active ? "→ CONTINUES HERE" : "○ AHEAD"}
                  </span>
                </div>
              </div>
            )
            return card
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

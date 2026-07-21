// /plan — the hub for ONE unified experience: The Build Plan Journey.
// Anonymous visitors get the marketing hub + resume-by-email;
// recognized visitors see "My Build Plan" progress. The five chapter cards
// are SEO entry doors into the same journey.

import Link from "next/link"
import { getJourneyId } from "@/lib/journey"
import { getLead, listModuleRuns } from "@/lib/repo"
import { ResumeCard } from "@/components/hub/ResumeCard"

export const dynamic = "force-dynamic"

const CHAPTERS: { id: string; number: number; title: string; promise: string; href: string }[] = [
  {
    id: "style",
    number: 1,
    title: "YOUR STYLE",
    promise: "8 taps. Your architectural identity. Zero math.",
    href: "/plan/style",
  },
  {
    id: "estimator",
    number: 2,
    title: "YOUR HOME",
    promise: "Footprint, finishes, features — a real planning range.",
    href: "/plan/estimator",
  },
  {
    id: "land",
    number: 3,
    title: "LAND & SITE",
    promise: "The whole picture — land, site work, and the all-in number.",
    href: "/plan/land",
  },
  {
    id: "affordability",
    number: 4,
    title: "YOUR BUDGET",
    promise: "What you can build, before you talk to a lender. VA-aware.",
    href: "/plan/affordability",
  },
  {
    id: "timeline",
    number: 5,
    title: "YOUR TIMELINE",
    promise: "A phase-by-phase schedule and an honest move-in window.",
    href: "/plan/timeline",
  },
]

const oswald = "var(--font-oswald), 'Oswald', 'Arial Narrow', sans-serif"
const inter = "var(--font-inter), 'Inter', Arial, sans-serif"

function PreHeader({ children, color = "#F4B214" }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ color, fontFamily: oswald, fontSize: 14, fontWeight: 700, letterSpacing: "-0.3px", textTransform: "uppercase" }}>
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
  const planRun = completedByTool.get("plan")
  const completedCount = CHAPTERS.filter((c) => completedByTool.has(c.id)).length

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
              : "PLAN YOUR ENTIRE BUILD. BEFORE YOU SPEND A DOLLAR."}
          </h1>
          <p style={{ fontFamily: inter, fontSize: 17, lineHeight: 1.55, margin: "20px 0 26px", maxWidth: "52ch", opacity: 0.8 }}>
            {recognized
              ? "Pick up where you left off — every answer carries forward, and your Master Build Plan updates as you go."
              : "One guided journey — your style, your home, your land, your budget, your timeline. Fifteen minutes. One master document in your inbox."}
          </p>

          {/* Primary CTA */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 26 }}>
            <Link
              href="/plan/journey"
              style={{
                background: "#F4B214",
                color: "#000",
                fontFamily: oswald,
                fontSize: 17,
                fontWeight: 700,
                padding: "18px 28px",
                textDecoration: "none",
                textTransform: "uppercase",
              }}
            >
              {recognized ? (planRun ? "UPDATE MY BUILD PLAN ›" : "CONTINUE MY BUILD PLAN ›") : "START MY BUILD PLAN ›"}
            </Link>
            {recognized && (
              <a
                href={process.env.NEXT_PUBLIC_CAL_LINK ?? "https://southeasterngc.com/contact"}
                style={{
                  border: "1px solid #FFFBF5",
                  color: "#FFFBF5",
                  fontFamily: oswald,
                  fontSize: 17,
                  fontWeight: 700,
                  padding: "17px 28px",
                  textDecoration: "none",
                  textTransform: "uppercase",
                }}
              >
                BOOK A FREE CONSULTATION ›
              </a>
            )}
          </div>

          {recognized && (
            <div style={{ margin: "0 0 26px", maxWidth: 520 }}>
              <div style={{ alignItems: "baseline", display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "#F4B214", fontFamily: oswald, fontSize: 13, fontWeight: 700, textTransform: "uppercase" }}>
                  ■ PLAN PROGRESS ■
                </span>
                <strong style={{ fontFamily: oswald, fontSize: 14, textTransform: "uppercase" }}>
                  {completedCount} OF {CHAPTERS.length} CHAPTERS
                </strong>
              </div>
              <div style={{ background: "rgba(255,251,245,.15)", display: "flex", height: 6 }}>
                <span style={{ background: "#F4B214", width: `${(completedCount / CHAPTERS.length) * 100}%` }} />
              </div>
              {planRun && (
                <p style={{ fontFamily: inter, fontSize: 13, margin: "12px 0 0", opacity: 0.75 }}>
                  Your Master Build Plan: <strong style={{ fontFamily: oswald, fontSize: 15 }}>{planRun.headlineResult}</strong>
                </p>
              )}
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
            {["20+ Years of Experience", "SBA 8(a) & HUBZone Certified", "Fayetteville’s #1 Rated Contractor"].map((item) => (
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
            ))}
          </div>
        </div>
      </section>

      {/* RESUME BY EMAIL — anonymous visitors only */}
      {!recognized && (
        <section style={{ margin: "0 auto", maxWidth: 1140, padding: "28px 28px 0" }}>
          <ResumeCard />
        </section>
      )}

      {/* CHAPTER GRID — entry doors into the one journey */}
      <section style={{ margin: "0 auto", maxWidth: 1140, padding: "56px 28px 24px" }}>
        <PreHeader color="#693709">ONE JOURNEY. FIVE CHAPTERS.</PreHeader>
        <h2
          style={{
            color: "#141414",
            fontFamily: oswald,
            fontSize: "clamp(30px, 4.5vw, 46px)",
            fontWeight: 700,
            letterSpacing: "-1.64px",
            margin: "12px 0 10px",
            textTransform: "uppercase",
          }}
        >
          START ANYWHERE. FINISH WITH EVERYTHING.
        </h2>
        <p style={{ color: "#5E574F", fontFamily: inter, fontSize: 15, lineHeight: 1.55, margin: "0 0 30px", maxWidth: "62ch" }}>
          Every door leads into the same journey — jump in at the chapter that matters most to you
          and the rest follows. Your answers carry through everything.
        </p>
        <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          {CHAPTERS.map((chapter) => {
            const done = completedByTool.get(chapter.id)
            return (
              <Link href={chapter.href} key={chapter.id} style={{ color: "inherit", display: "contents", textDecoration: "none" }}>
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid rgba(69,30,0,0.09)",
                    borderRadius: 20,
                    boxShadow: "0 18px 55px rgba(69,30,0,0.07)",
                    color: "#141414",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    padding: 28,
                    position: "relative",
                  }}
                >
                  <span style={{ color: "#693709", fontFamily: oswald, fontSize: 13, fontWeight: 700, textTransform: "uppercase" }}>
                    ■ CHAPTER {chapter.number} ■
                  </span>
                  {done && (
                    <span
                      style={{
                        background: "#F4B214",
                        color: "#000",
                        fontFamily: oswald,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "5px 10px",
                        position: "absolute",
                        right: 24,
                        top: 24,
                        textTransform: "uppercase",
                      }}
                    >
                      ✓ DONE
                    </span>
                  )}
                  <h3 style={{ fontFamily: oswald, fontSize: 26, fontWeight: 700, letterSpacing: "-0.64px", lineHeight: 1.05, margin: 0, textTransform: "uppercase" }}>
                    {chapter.title}
                  </h3>
                  <p style={{ fontFamily: inter, fontSize: 14, lineHeight: 1.5, margin: 0, opacity: 0.72 }}>{chapter.promise}</p>
                  {done ? (
                    <div style={{ marginTop: 6 }}>
                      <span style={{ display: "block", fontFamily: inter, fontSize: 12, opacity: 0.6 }}>YOUR RESULT</span>
                      <strong style={{ fontFamily: oswald, fontSize: 24, letterSpacing: "-0.6px" }}>{done.headlineResult}</strong>
                    </div>
                  ) : null}
                  <div style={{ marginTop: "auto", paddingTop: 10 }}>
                    <span style={{ background: "#F4B214", color: "#000", display: "inline-block", fontFamily: oswald, fontSize: 14, fontWeight: 700, padding: "13px 20px", textTransform: "uppercase" }}>
                      {done ? "REVISIT ›" : "START HERE ›"}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* CTA BAND — dark */}
      <section style={{ background: "#451E00", color: "#FFFBF5", marginTop: 56, padding: "56px 28px" }}>
        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "space-between", margin: "0 auto", maxWidth: 1140 }}>
          <div>
            <PreHeader>READY WHEN YOU ARE</PreHeader>
            <h2 style={{ fontFamily: oswald, fontSize: "clamp(28px, 4.5vw, 44px)", fontWeight: 700, letterSpacing: "-1.4px", margin: "12px 0 0", maxWidth: "22ch", textTransform: "uppercase" }}>
              WE DON’T SELL CONSTRUCTION. WE SELL CERTAINTY.
            </h2>
          </div>
          <a
            href={process.env.NEXT_PUBLIC_CAL_LINK ?? "https://southeasterngc.com/contact"}
            style={{ background: "#F4B214", color: "#000", fontFamily: oswald, fontSize: 16, fontWeight: 700, padding: "18px 26px", textDecoration: "none", textTransform: "uppercase" }}
          >
            BOOK A FREE DESIGN CONSULTATION ›
          </a>
        </div>
      </section>
    </div>
  )
}

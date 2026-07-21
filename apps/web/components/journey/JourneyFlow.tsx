"use client"

// THE BUILD PLAN JOURNEY — one unified experience, one gate, one big reveal.
// Chapters: STYLE (8 taps) → HOME (5 steps) → LAND & SITE (skippable) →
// MONEY (skippable) → TIMELINE (skippable) → gate → master Build Plan.
// The five old module URLs are entry doors: they start the journey at their
// chapter, then continue through everything not yet answered.

import { useEffect, useMemo, useRef, useState } from "react"
import {
  computeAffordability,
  computeHomeEstimate,
  computeLandBuild,
  computeTimeline,
  fmt,
  HOME_CONFIG,
  scoreStyleQuiz,
  STYLE_PROFILES,
  type AffordabilityState,
  type HomeEstimateState,
  type StyleId,
} from "@segc/engines"
import {
  BreakdownCard,
  btnGhostStyle,
  btnPrimaryStyle,
  cardStyle,
  Counter,
  DTIMeter,
  fieldLabelStyle,
  FunnelBlock,
  GanttPhaseBar,
  LAND_BUILD_COLORS,
  NextModuleCard,
  PdfConfirmStrip,
  PillGroup,
  ProgressBar,
  RangeField,
  SpecPanel,
  StackedCostBar,
  StepShell,
  SwatchGrid,
  TierCards,
  tokens,
  ToolFrame,
  ToolNavigation,
} from "@segc/ui"
import { useUnlock } from "@/components/shared/useUnlock"
import { GateStep } from "@/components/shared/GateStep"
import { FloorPlan } from "@/components/estimator/FloorPlan"
import { QUIZ } from "@/components/style/quizData"

export type ChapterId = "style" | "home" | "land" | "money" | "timeline"

const CANONICAL: ChapterId[] = ["style", "home", "land", "money", "timeline"]
const OPTIONAL: ChapterId[] = ["land", "money", "timeline"]

const CHAPTER_TITLES: Record<ChapterId, string> = {
  style: "YOUR STYLE",
  home: "YOUR HOME",
  land: "LAND & SITE",
  money: "YOUR BUDGET",
  timeline: "YOUR TIMELINE",
}

const REGIONS = HOME_CONFIG.regions.map((r) => ({ value: r.id, label: r.name, sub: r.sub }))

const DESIGN_GROUP_NAMES: Record<string, string> = {
  counter: "Kitchen countertop",
  backsplash: "Kitchen backsplash",
  bathCounter: "Bath countertop",
  shower: "Primary shower",
  tub: "Primary tub",
  bathTile: "Bath flooring",
  paint: "Interior paint",
  trim: "Trim package",
  suite: "Primary suite",
}

const initialDesign = Object.fromEntries(
  Object.entries(HOME_CONFIG.design).map(([group, options]) => [group, options[0].id]),
)

const INITIAL_HOME: HomeEstimateState = {
  region: "sandhills",
  sqft: 2800,
  stories: "1",
  foundation: "slab",
  ceiling: "9",
  beds: 4,
  fullBaths: 3,
  halfBaths: 1,
  garage: 2,
  garageType: "attached",
  bonus: 1,
  porches: 1,
  tier: "signature",
  kitchen: "standard",
  primaryBath: "standard",
  flooring: "lvp",
  exterior: "fiber",
  roof: "standard",
  features: [],
  ownLand: "yes",
  clearing: "none",
  utilities: "municipal",
  driveway: "short",
  style: "farmhouse",
  timeline: "6-12",
  designMode: "A",
  design: { ...initialDesign },
}

interface LandState {
  landStatus: "owned" | "contract" | "shopping"
  acreage: number
  landPrice: number
  clearing: string
  topography: string
  utilities: string
  powerRun: string
  driveway: string
}

const INITIAL_LAND: LandState = {
  landStatus: "shopping",
  acreage: 2,
  landPrice: 0,
  clearing: "light",
  topography: "flat",
  utilities: "septicWell",
  powerRun: "short",
  driveway: "medium",
}

const INITIAL_MONEY: AffordabilityState = {
  annualIncome: 120000,
  monthlyDebts: 800,
  credit: "good",
  cash: 50000,
  landValue: 0,
  loanType: "ctp",
  termYears: 30,
  rate: 6.75, // PLACEHOLDER default rate
}

interface TimelineChapterState {
  stage: string
  complexity: string
  basement: boolean
  pool: boolean
  financing: string
  targetDate: string
}

const INITIAL_TIMELINE: TimelineChapterState = {
  stage: "exploring",
  complexity: "custom",
  basement: false,
  pool: false,
  financing: "not-started",
  targetDate: "",
}

function monthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase()
}

function quarterOptions(): { value: string; label: string }[] {
  const now = new Date()
  const options: { value: string; label: string }[] = [{ value: "", label: "No hard target" }]
  let year = now.getFullYear()
  let quarter = Math.floor(now.getMonth() / 3) + 1
  for (let i = 0; i < 8; i++) {
    quarter += 1
    if (quarter > 4) {
      quarter = 1
      year += 1
    }
    const month = (quarter - 1) * 3 + 2
    options.push({ value: `${year}-${String(month + 1).padStart(2, "0")}-01`, label: `Q${quarter} ${year}` })
  }
  return options
}

interface PlanOutputs {
  style: { primary: StyleId; secondary: StyleId; percentage: number }
  estimate: ReturnType<typeof computeHomeEstimate>
  land: ReturnType<typeof computeLandBuild> | null
  afford: ReturnType<typeof computeAffordability> | null
  fit: { verdict: "FITS" | "STRETCH" | "GAP"; line: string } | null
  schedule: ReturnType<typeof computeTimeline> | null
  completedChapters: string[]
}

export function JourneyFlow({ initialChapter }: { initialChapter?: ChapterId }) {
  // Entry doors rotate the chapter queue: the door's chapter first, the rest canonical.
  const queue = useMemo<ChapterId[]>(
    () =>
      initialChapter && initialChapter !== "style"
        ? [initialChapter, ...CANONICAL.filter((c) => c !== initialChapter)]
        : CANONICAL,
    [initialChapter],
  )

  const [home, setHome] = useState<HomeEstimateState>(INITIAL_HOME)
  const [picks, setPicks] = useState<(string | null)[]>(Array(QUIZ.length).fill(null))
  const [land, setLand] = useState<LandState>(INITIAL_LAND)
  const [money, setMoney] = useState<AffordabilityState>(INITIAL_MONEY)
  const [sched, setSched] = useState<TimelineChapterState>(INITIAL_TIMELINE)
  const [skipped, setSkipped] = useState<Record<string, boolean>>({})
  const [intent, setIntent] = useState("6-12")
  const [step, setStep] = useState(0)
  const prefilled = useRef(false)
  const { unlocked, pending, gateError, unlock, hydrated, profile, lead } = useUnlock("plan")

  useEffect(() => {
    if (!hydrated || prefilled.current) return
    prefilled.current = true
    const params = new URLSearchParams(window.location.search)
    const requestedSqft = Number(params.get("sqft"))
    setHome((current) => ({
      ...current,
      ...(profile.region ? { region: profile.region } : {}),
      ...(profile.sqft ? { sqft: profile.sqft } : {}),
      ...(profile.tier ? { tier: profile.tier } : {}),
      ...(Number.isFinite(requestedSqft) && requestedSqft >= 1200 && requestedSqft <= 8000
        ? { sqft: Math.round(requestedSqft / 100) * 100 }
        : {}),
    }))
    if (profile.timeline) setIntent(profile.timeline)
    if (profile.landStatus === "owned" || profile.landStatus === "contract" || profile.landStatus === "shopping") {
      setLand((current) => ({ ...current, landStatus: profile.landStatus as LandState["landStatus"] }))
    }
  }, [hydrated, profile])

  /* ---------- derived live results ---------- */

  const answers = useMemo(
    () =>
      picks.map((pick, index) => {
        const answer = QUIZ[index].answers.find((a) => a.id === pick)
        return (answer?.weights ?? {}) as Partial<Record<StyleId, number>>
      }),
    [picks],
  )
  const answeredCount = picks.filter(Boolean).length
  const liveStyle = answeredCount > 0 ? scoreStyleQuiz(answers) : null
  const styleId = (liveStyle?.primary ?? "farmhouse") as StyleId

  const estimate = useMemo(
    () => computeHomeEstimate({ ...home, style: styleId }),
    [home, styleId],
  )
  const range = `${fmt(estimate.low)}–${fmt(estimate.high)}`
  const liveAfford = useMemo(() => computeAffordability(money), [money])
  const liveLand = useMemo(
    () => computeLandBuild({ region: home.region, sqft: home.sqft, tier: home.tier, garage: home.garage, ...land }),
    [home.region, home.sqft, home.tier, home.garage, land],
  )
  const liveSched = useMemo(
    () => computeTimeline({ region: home.region, sqft: home.sqft, tier: home.tier, ...sched }),
    [home.region, home.sqft, home.tier, sched],
  )
  const quarters = useMemo(quarterOptions, [])

  const updateHome = <K extends keyof HomeEstimateState>(key: K, value: HomeEstimateState[K]) =>
    setHome((current) => ({ ...current, [key]: value }))

  /* ---------- step list (flattened from the chapter queue) ---------- */

  interface JourneyStep {
    chapter: ChapterId | "gate"
    kind: string
    quizIndex?: number
  }

  const steps = useMemo<JourneyStep[]>(() => {
    const list: JourneyStep[] = []
    for (const chapter of queue) {
      if (chapter === "style") {
        for (let i = 0; i < QUIZ.length; i++) list.push({ chapter, kind: "quiz", quizIndex: i })
      } else if (chapter === "home") {
        list.push({ chapter, kind: "footprint" }, { chapter, kind: "program" }, { chapter, kind: "finishes" }, { chapter, kind: "studio" }, { chapter, kind: "features" })
      } else {
        list.push({ chapter, kind: chapter })
      }
    }
    list.push({ chapter: "gate", kind: "gate" })
    return list
  }, [queue])

  const TOTAL = steps.length
  const current = steps[Math.min(step, TOTAL - 1)]
  const chapterNumber = current.chapter === "gate" ? queue.length : queue.indexOf(current.chapter as ChapterId) + 1

  function next() {
    setStep((value) => Math.min(TOTAL - 1, value + 1))
  }
  function back() {
    setStep((value) => Math.max(0, value - 1))
  }
  function skipChapter(chapter: ChapterId) {
    setSkipped((current) => ({ ...current, [chapter]: true }))
    // jump past every step of this chapter
    const idx = steps.findIndex((s, i) => i > step && s.chapter !== chapter)
    setStep(idx === -1 ? TOTAL - 1 : idx)
  }

  function pickQuiz(questionIndex: number, answerId: string) {
    setPicks((current) => {
      const nextPicks = [...current]
      nextPicks[questionIndex] = answerId
      return nextPicks
    })
    window.setTimeout(next, 180)
  }

  function submit(contact: Parameters<typeof unlock>[0]) {
    const inputs = {
      quizAnswers: answers,
      home: { ...home, style: styleId, timeline: intent },
      land: skipped.land ? null : land,
      money: skipped.money ? null : money,
      timeline: skipped.timeline ? null : sched,
      intent,
    }
    void unlock(contact, inputs, {
      region: home.region,
      sqft: home.sqft,
      tier: home.tier,
      style: styleId,
      timeline: intent,
    })
  }

  /* ---------- THE REVEAL ---------- */

  if (unlocked) {
    const outputs = unlocked.result as PlanOutputs
    const firstName = unlocked.lead.name.split(" ")[0] || unlocked.lead.name
    const primary = STYLE_PROFILES[outputs.style.primary]
    const secondary = STYLE_PROFILES[outputs.style.secondary]
    const fitColor =
      outputs.fit?.verdict === "FITS" ? "#4C7A3F" : outputs.fit?.verdict === "STRETCH" ? tokens.gold : tokens.brownMid
    return (
      <ToolFrame
        heading="YOUR BUILD PLAN IS READY."
        sub="One document. Your style, your numbers, your schedule — everything a first conversation needs."
      >
        <section style={{ display: "grid", gap: 22 }}>
          {/* Master payoff */}
          <div style={{ ...cardStyle(), background: tokens.brown, color: tokens.white }}>
            <span style={{ color: tokens.gold, fontFamily: tokens.display, fontSize: 13, fontWeight: 700 }}>
              ■ {firstName.toUpperCase()}, THIS IS YOUR BUILD ■
            </span>
            <h2
              style={{
                fontFamily: tokens.display,
                fontSize: "clamp(38px, 7vw, 72px)",
                letterSpacing: "-2px",
                lineHeight: 1,
                margin: "14px 0 8px",
                textTransform: "uppercase",
              }}
            >
              {unlocked.headline}
            </h2>
            <p style={{ fontFamily: tokens.body, margin: "0 0 4px", opacity: 0.72 }}>
              {outputs.style.percentage}% {primary.name} with a {secondary.name} streak ·{" "}
              {fmt(outputs.estimate.psfEff)} effective per sq ft
            </p>
            {outputs.fit && (
              <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
                <span
                  style={{
                    background: fitColor,
                    color: outputs.fit.verdict === "STRETCH" ? "#000" : "#fff",
                    fontFamily: tokens.display,
                    fontSize: 13,
                    fontWeight: 700,
                    padding: "7px 12px",
                    textTransform: "uppercase",
                  }}
                >
                  BUDGET: {outputs.fit.verdict}
                </span>
                <span style={{ fontFamily: tokens.body, fontSize: 13, opacity: 0.78 }}>{outputs.fit.line}</span>
              </div>
            )}
          </div>

          <PdfConfirmStrip email={unlocked.lead.email} name="Master Build Plan" />

          {/* Chapter results grid */}
          <div className="segc-grid-2">
            <BreakdownCard
              title="■ Your Home ■"
              rows={[
                ["Planning range", unlocked.headline],
                ["Base construction", fmt(outputs.estimate.shell)],
                ["Finishes + features", fmt(outputs.estimate.interiorAdds)],
                ["Soft costs + contingency", fmt(outputs.estimate.soft + outputs.estimate.contingency)],
                ["Estimated midpoint", fmt(outputs.estimate.total)],
              ]}
            />
            <BreakdownCard
              title="■ Your Style ■"
              rows={[
                ["You are", `${outputs.style.percentage}% ${primary.name}`],
                ["With a streak of", secondary.name],
                ...primary.signatures.map((s, i) => [`Signature 0${i + 1}`, s] as [string, string]),
              ]}
            />
          </div>

          {outputs.afford && (
            <div style={{ ...cardStyle() }}>
              <h3 style={{ fontFamily: tokens.display, fontSize: 21, margin: "0 0 16px", textTransform: "uppercase" }}>
                ■ Your Budget ■
              </h3>
              <div className="segc-grid-2" style={{ alignItems: "center" }}>
                <div>
                  <span style={{ color: tokens.muted, display: "block", fontFamily: tokens.body, fontSize: 12 }}>
                    Comfortable build budget
                  </span>
                  <strong style={{ color: tokens.brown, fontFamily: tokens.display, fontSize: 30, letterSpacing: "-0.8px" }}>
                    {fmt(outputs.afford.low)}–{fmt(outputs.afford.high)}
                  </strong>
                  <span style={{ color: tokens.muted, display: "block", fontFamily: tokens.body, fontSize: 12, marginTop: 4 }}>
                    est. {fmt(outputs.afford.piPayment)}/mo P&I
                  </span>
                </div>
                <DTIMeter dti={outputs.afford.dti} />
              </div>
            </div>
          )}

          {outputs.land && (
            <div style={{ ...cardStyle() }}>
              <h3 style={{ fontFamily: tokens.display, fontSize: 21, margin: "0 0 16px", textTransform: "uppercase" }}>
                ■ Land + All-In ■
              </h3>
              <StackedCostBar
                segments={[
                  { label: "Land", value: fmt(outputs.land.land), pct: outputs.land.percentages.land, color: LAND_BUILD_COLORS.land },
                  { label: "Site work", value: fmt(outputs.land.site), pct: outputs.land.percentages.site, color: LAND_BUILD_COLORS.site },
                  { label: "Build", value: fmt(outputs.land.build), pct: outputs.land.percentages.build, color: LAND_BUILD_COLORS.build },
                  { label: "Soft + contingency", value: fmt(outputs.land.soft), pct: outputs.land.percentages.soft, color: LAND_BUILD_COLORS.soft },
                ]}
              />
            </div>
          )}

          {outputs.schedule && (
            <div style={{ ...cardStyle() }}>
              <h3 style={{ fontFamily: tokens.display, fontSize: 21, margin: "0 0 6px", textTransform: "uppercase" }}>
                ■ Your Timeline ■
              </h3>
              <p style={{ color: tokens.muted, fontFamily: tokens.body, fontSize: 13, margin: "0 0 16px" }}>
                Estimated move-in: <strong style={{ color: tokens.ink }}>{monthYear(outputs.schedule.moveInStart)} – {monthYear(outputs.schedule.moveInEnd)}</strong>
                {outputs.schedule.tight && " · ⚑ THAT TARGET IS TIGHT"}
              </p>
              <GanttPhaseBar phases={outputs.schedule.phases} currentIndex={outputs.schedule.currentIndex} />
            </div>
          )}

          {/* Unfinished chapters — pull them back in */}
          {(["land", "money", "timeline"] as const)
            .filter((chapter) => skipped[chapter])
            .map((chapter) => (
              <NextModuleCard
                key={chapter}
                title={`FINISH ${CHAPTER_TITLES[chapter]}`}
                carried="You skipped this chapter — your answers so far are saved, it takes about a minute."
                href={`/plan/${chapter === "money" ? "affordability" : chapter}`}
                cta="FINISH IT ›"
              />
            ))}

          <FunnelBlock
            bookingUrl={process.env.NEXT_PUBLIC_CAL_LINK ?? "https://southeasterngc.com/contact"}
            briefUrl="/plan/brief"
            contact={{ name: unlocked.lead.name, email: unlocked.lead.email, phone: "", consent: true }}
            tool="plan"
            headlineResult={unlocked.headline}
            timeline={intent}
          />
        </section>
      </ToolFrame>
    )
  }

  /* ---------- step rendering ---------- */

  const chapterLabel =
    current.chapter === "gate"
      ? "THE REVEAL"
      : `CHAPTER ${chapterNumber} / ${queue.length} · ${CHAPTER_TITLES[current.chapter as ChapterId]}`

  const skipButton = (chapter: ChapterId) =>
    OPTIONAL.includes(chapter) ? (
      <button onClick={() => skipChapter(chapter)} type="button" style={{ ...btnGhostStyle(tokens.muted), marginTop: 18 }}>
        SKIP — I’LL DO THIS LATER ›
      </button>
    ) : null

  let content: React.ReactNode = null

  if (current.kind === "quiz" && current.quizIndex !== undefined) {
    const q = QUIZ[current.quizIndex]
    content = (
      <section className="segc-step-enter" key={q.id}>
        <div style={{ color: tokens.brown, fontFamily: tokens.display, fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: "uppercase" }}>
          ■ {chapterLabel} · {current.quizIndex + 1}/{QUIZ.length} ■
        </div>
        <h2 style={{ color: tokens.ink, fontFamily: tokens.display, fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 700, letterSpacing: "-1.2px", lineHeight: 1, margin: 0, textTransform: "uppercase" }}>
          {q.prompt}
        </h2>
        <p style={{ color: "#5E574F", fontFamily: tokens.body, fontSize: 14, margin: "10px 0 22px" }}>{q.sub}</p>
        <div className="segc-grid-2">
          {q.answers.map((answer) => {
            const active = picks[current.quizIndex!] === answer.id
            return (
              <button
                aria-pressed={active}
                key={answer.id}
                onClick={() => pickQuiz(current.quizIndex!, answer.id)}
                type="button"
                style={{ background: tokens.white, border: `2px solid ${active ? tokens.gold : "#DED9D2"}`, borderRadius: tokens.radTag, cursor: "pointer", overflow: "hidden", padding: 0, textAlign: "left" }}
              >
                <span
                  className="segc-swatch-img"
                  style={{ background: answer.image ? `url(${answer.image}) center / cover, ${answer.art}` : answer.art, display: "block", height: 120 }}
                />
                <span style={{ display: "block", padding: "11px 13px 13px" }}>
                  <strong style={{ display: "block", fontFamily: tokens.display, fontSize: 14, textTransform: "uppercase" }}>{answer.label}</strong>
                  {answer.sub && <span style={{ color: tokens.muted, display: "block", fontFamily: tokens.body, fontSize: 11.5, marginTop: 3 }}>{answer.sub}</span>}
                </span>
              </button>
            )
          })}
        </div>
        {step > 0 && (
          <button onClick={back} type="button" style={{ ...btnGhostStyle(tokens.ink), marginTop: 22 }}>
            ‹ BACK
          </button>
        )}
        {liveStyle && (
          <p style={{ fontFamily: tokens.body, fontSize: 12, margin: "14px 0 0", opacity: 0.55 }}>
            Trending: <strong style={{ fontFamily: tokens.display, textTransform: "uppercase" }}>{STYLE_PROFILES[liveStyle.primary].name}</strong>…
          </p>
        )}
      </section>
    )
  } else if (current.kind === "footprint") {
    content = (
      <StepShell step={step} total={TOTAL} title="START WITH THE FOOTPRINT." sub="Choose the market, conditioned square footage, stories, foundation, and ceiling height.">
        <PillGroup label="Where are you building?" value={home.region} onChange={(v) => updateHome("region", v)} columns={3} options={REGIONS} />
        <RangeField label="Conditioned square footage" value={home.sqft} min={1200} max={8000} step={100} onChange={(v) => updateHome("sqft", v)} formatValue={(v) => `${v.toLocaleString()} SQ FT`} />
        <PillGroup label="Stories" value={home.stories} onChange={(v) => updateHome("stories", v)} options={[{ value: "1", label: "1 Story" }, { value: "1.5", label: "1½ Story" }, { value: "2", label: "2 Story" }]} />
        <PillGroup label="Foundation" value={home.foundation} onChange={(v) => updateHome("foundation", v)} columns={4} options={[{ value: "slab", label: "Slab" }, { value: "crawl", label: "Crawlspace" }, { value: "basement", label: "Basement" }, { value: "piling", label: "Piling" }]} />
        <PillGroup label="Ceiling height" value={home.ceiling} onChange={(v) => updateHome("ceiling", v)} options={[{ value: "9", label: "9 FT" }, { value: "10", label: "10 FT" }, { value: "12", label: "12 FT" }]} />
      </StepShell>
    )
  } else if (current.kind === "program") {
    content = (
      <StepShell step={step} total={TOTAL} title="SHAPE THE FLOOR PLAN." sub="Set the rooms, garage, and covered spaces that define daily life.">
        <div className="segc-grid-2">
          <Counter label="Bedrooms" value={home.beds} min={2} max={8} onChange={(v) => updateHome("beds", v)} />
          <Counter label="Full baths" value={home.fullBaths} min={2} max={7} onChange={(v) => updateHome("fullBaths", v)} />
          <Counter label="Half baths" value={home.halfBaths} min={0} max={4} onChange={(v) => updateHome("halfBaths", v)} />
          <Counter label="Garage bays" value={home.garage} min={0} max={5} onChange={(v) => updateHome("garage", v)} />
          <Counter label="Bonus rooms" value={home.bonus} min={0} max={4} onChange={(v) => updateHome("bonus", v)} />
          <Counter label="Covered porches" value={home.porches} min={0} max={4} onChange={(v) => updateHome("porches", v)} />
        </div>
        <PillGroup label="Garage type" value={home.garageType} onChange={(v) => updateHome("garageType", v)} columns={2} options={[{ value: "attached", label: "Attached" }, { value: "detached", label: "Detached" }]} />
      </StepShell>
    )
  } else if (current.kind === "finishes") {
    content = (
      <StepShell step={step} total={TOTAL} title="SET THE FINISH LEVEL." sub="Choose the overall specification, then define the highest-impact selections.">
        <TierCards value={home.tier} onChange={(v) => updateHome("tier", v)} prices={HOME_CONFIG.psfByTier} />
        <PillGroup label="Kitchen" value={home.kitchen} onChange={(v) => updateHome("kitchen", v)} options={[{ value: "standard", label: "Standard" }, { value: "chef", label: "Chef", badge: "+$35K" }, { value: "luxury", label: "Luxury", badge: "+$75K" }]} />
        <PillGroup label="Primary bath" value={home.primaryBath} onChange={(v) => updateHome("primaryBath", v)} columns={2} options={[{ value: "standard", label: "Standard" }, { value: "spa", label: "Spa", badge: "+$25K" }]} />
        <PillGroup label="Flooring" value={home.flooring} onChange={(v) => updateHome("flooring", v)} options={[{ value: "lvp", label: "LVP" }, { value: "hardwood", label: "Hardwood" }, { value: "tile", label: "Tile-forward" }]} />
        <PillGroup label="Exterior" value={home.exterior} onChange={(v) => updateHome("exterior", v)} columns={4} options={[{ value: "vinyl", label: "Vinyl" }, { value: "fiber", label: "Fiber cement" }, { value: "brick", label: "Brick" }, { value: "stone", label: "Stone" }]} />
        <PillGroup label="Roof form" value={home.roof} onChange={(v) => updateHome("roof", v)} options={[{ value: "simple", label: "Simple" }, { value: "standard", label: "Standard" }, { value: "complex", label: "Complex" }]} />
      </StepShell>
    )
  } else if (current.kind === "studio") {
    content = (
      <StepShell step={step} total={TOTAL} title="ENTER THE DESIGN STUDIO." sub="Select the materials and spaces that make the plan feel like your home.">
        {Object.entries(HOME_CONFIG.design).map(([group, options]) => (
          <SwatchGrid
            key={group}
            label={DESIGN_GROUP_NAMES[group] ?? group}
            value={home.design[group]}
            onChange={(v) => updateHome("design", { ...home.design, [group]: v })}
            options={options.map((item) => ({ value: item.id, label: item.name, color: item.sw, cost: item.cost }))}
          />
        ))}
      </StepShell>
    )
  } else if (current.kind === "features") {
    content = (
      <StepShell step={step} total={TOTAL} title="ADD THE WANT-TO-HAVES." sub="Outdoor living, specialty rooms, resilience, smart home.">
        <div className="segc-grid-3">
          {HOME_CONFIG.features.map((feature) => {
            const active = home.features.includes(feature.id)
            return (
              <button
                aria-pressed={active}
                key={feature.id}
                onClick={() =>
                  updateHome(
                    "features",
                    active ? home.features.filter((f) => f !== feature.id) : [...home.features, feature.id],
                  )
                }
                type="button"
                style={{ background: active ? tokens.brown : tokens.white, border: `1px solid ${active ? tokens.brown : "#DED9D2"}`, borderRadius: tokens.radTag, color: active ? tokens.white : tokens.ink, cursor: "pointer", minHeight: 76, padding: 15, textAlign: "left" }}
              >
                <strong style={{ display: "block", fontFamily: tokens.display, fontSize: 14, textTransform: "uppercase" }}>{feature.label}</strong>
                <span style={{ color: active ? tokens.gold : tokens.muted, display: "block", fontFamily: tokens.body, fontSize: 11, marginTop: 6 }}>+{fmt(feature.cost)}</span>
              </button>
            )
          })}
        </div>
      </StepShell>
    )
  } else if (current.kind === "land") {
    content = (
      <StepShell step={step} total={TOTAL} title="NOW, THE DIRT." sub="Land and site conditions — the line items most builders leave out of the quote. Optional, but it completes the picture.">
        <PillGroup label="Land status" value={land.landStatus} onChange={(v) => setLand({ ...land, landStatus: v as LandState["landStatus"] })} options={[{ value: "owned", label: "I own it" }, { value: "contract", label: "Under contract" }, { value: "shopping", label: "Still shopping" }]} />
        {land.landStatus !== "owned" && (
          <div className="segc-grid-2">
            <RangeField label="Acreage" value={land.acreage} min={0.5} max={25} step={0.5} onChange={(v) => setLand({ ...land, acreage: v })} formatValue={(v) => `${v} ACRES`} />
            <RangeField label="Land price (0 = estimate)" value={land.landPrice} min={0} max={500000} step={5000} onChange={(v) => setLand({ ...land, landPrice: v })} formatValue={(v) => (v ? fmt(v) : "USE ESTIMATE")} />
          </div>
        )}
        <PillGroup label="Clearing" value={land.clearing} onChange={(v) => setLand({ ...land, clearing: v })} options={[{ value: "light", label: "Light" }, { value: "moderate", label: "Moderate" }, { value: "heavy", label: "Heavily wooded" }]} />
        <PillGroup label="Topography" value={land.topography} onChange={(v) => setLand({ ...land, topography: v })} options={[{ value: "flat", label: "Mostly flat" }, { value: "slope", label: "Gentle slope" }, { value: "steep", label: "Steep" }]} />
        <div className="segc-grid-2">
          <PillGroup label="Water & sewer" value={land.utilities} onChange={(v) => setLand({ ...land, utilities: v })} columns={2} options={[{ value: "municipal", label: "Municipal" }, { value: "septicWell", label: "Well + septic" }]} />
          <PillGroup label="Power at road?" value={land.powerRun} onChange={(v) => setLand({ ...land, powerRun: v })} columns={2} options={[{ value: "short", label: "Yes / close" }, { value: "long", label: "Long run" }]} />
        </div>
        <PillGroup label="Driveway" value={land.driveway} onChange={(v) => setLand({ ...land, driveway: v })} options={[{ value: "short", label: "Short" }, { value: "medium", label: "Medium" }, { value: "long", label: "Long / private" }]} />
        {skipButton("land")}
      </StepShell>
    )
  } else if (current.kind === "money") {
    content = (
      <StepShell step={step} total={TOTAL} title="LET'S TALK BUDGET." sub="Educational pre-qualification math — SEGC is not a lender, and this stays between us. Optional, but it turns a wish into a plan.">
        <RangeField label="Household annual income" value={money.annualIncome} min={40000} max={500000} step={5000} onChange={(v) => setMoney({ ...money, annualIncome: v })} formatValue={(v) => fmt(v)} />
        <div className="segc-grid-2">
          <RangeField label="Monthly debt payments" value={money.monthlyDebts} min={0} max={8000} step={50} onChange={(v) => setMoney({ ...money, monthlyDebts: v })} formatValue={(v) => `${fmt(v)} / MO`} />
          <RangeField label="Cash + land equity" value={money.cash} min={0} max={500000} step={5000} onChange={(v) => setMoney({ ...money, cash: v })} formatValue={(v) => fmt(v)} />
        </div>
        <PillGroup label="Loan type" value={money.loanType} onChange={(v) => setMoney({ ...money, loanType: v as AffordabilityState["loanType"] & string })} columns={4} options={[{ value: "ctp", label: "Construction-to-perm" }, { value: "va", label: "VA", badge: "FORT LIBERTY" }, { value: "fha", label: "FHA" }, { value: "conventional", label: "Conventional" }]} />
        <div className="segc-grid-2">
          <PillGroup label="Term" value={String(money.termYears)} onChange={(v) => setMoney({ ...money, termYears: Number(v) })} options={[{ value: "15", label: "15 yr" }, { value: "20", label: "20 yr" }, { value: "30", label: "30 yr" }]} />
          <RangeField label="Rate" value={money.rate} min={4} max={10} step={0.125} onChange={(v) => setMoney({ ...money, rate: v })} formatValue={(v) => `${v}%`} />
        </div>
        <DTIMeter dti={liveAfford.dti} />
        {skipButton("money")}
      </StepShell>
    )
  } else if (current.kind === "timeline") {
    content = (
      <StepShell step={step} total={TOTAL} title="WHEN DO YOU WANT THE KEYS?" sub="Three answers and we'll schedule the whole build backward from your move-in date. Optional — but 'someday' never poured a foundation.">
        <PillGroup label="Where are you today?" value={sched.stage} onChange={(v) => setSched({ ...sched, stage: v })} columns={2} options={[{ value: "exploring", label: "Dreaming & researching" }, { value: "design", label: "Ready to design" }, { value: "permits", label: "Plans done" }, { value: "site", label: "Permitted" }]} />
        <div className="segc-grid-2">
          <PillGroup label="Complexity" value={sched.complexity} onChange={(v) => setSched({ ...sched, complexity: v })} columns={3} options={[{ value: "simple", label: "Simple" }, { value: "custom", label: "Custom" }, { value: "complex", label: "Complex" }]} />
          <PillGroup label="Financing" value={sched.financing} onChange={(v) => setSched({ ...sched, financing: v })} columns={3} options={[{ value: "approved", label: "Approved" }, { value: "in-process", label: "In process" }, { value: "not-started", label: "Not started" }]} />
        </div>
        <PillGroup label="Target move-in" value={sched.targetDate} onChange={(v) => setSched({ ...sched, targetDate: v })} columns={3} options={quarters} />
        <div style={{ marginTop: 4 }}>
          <GanttPhaseBar phases={liveSched.phases} currentIndex={liveSched.currentIndex} />
        </div>
        {skipButton("timeline")}
      </StepShell>
    )
  } else {
    // gate
    content = (
      <StepShell step={step} total={TOTAL} title="YOUR BUILD PLAN IS READY." sub="One last thing — where do we send the Master Build Plan PDF?">
        <PillGroup label="When do you want to build?" value={intent} onChange={setIntent} columns={4} options={[{ value: "asap", label: "ASAP" }, { value: "0-6", label: "0–6 months" }, { value: "6-12", label: "6–12 months" }, { value: "explore", label: "Exploring" }]} />
        <GateStep lead={lead} pending={pending} error={gateError} onUnlock={submit} />
      </StepShell>
    )
  }

  /* ---------- running Build Plan panel ---------- */

  const specRows: [string, string][] = [
    ["Style", liveStyle ? `${STYLE_PROFILES[liveStyle.primary].name}` : "Chapter 1 pending"],
    ["Region", HOME_CONFIG.regions.find((r) => r.id === home.region)?.name ?? home.region],
    ["Footprint", `${home.sqft.toLocaleString()} sq ft · ${home.stories} story`],
    ["Finish", home.tier],
    ["Land", skipped.land ? "Skipped" : land.landStatus === "owned" ? "Owned" : `${land.acreage} ac (${land.landStatus})`],
    ["Budget", skipped.money ? "Skipped" : `${fmt(liveAfford.low)}+ comfortable`],
    ["Move-in", skipped.timeline ? "Skipped" : `${monthYear(liveSched.moveInStart)}–${monthYear(liveSched.moveInEnd)}`],
  ]

  const isQuiz = current.kind === "quiz"

  return (
    <ToolFrame
      heading="PLAN YOUR ENTIRE BUILD. ONCE."
      sub="Style, home, land, budget, and timeline — one guided journey, one master document. Know your numbers before you spend a dollar."
    >
      <ProgressBar current={step} total={TOTAL} />
      <div className="segc-stage" style={{ marginTop: 24 }}>
        <div className="segc-card" style={cardStyle()}>
          {!isQuiz && current.chapter !== "gate" && (
            <div style={{ color: tokens.brown, fontFamily: tokens.display, fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: "uppercase" }}>
              ■ {chapterLabel} ■
            </div>
          )}
          {content}
          {!isQuiz && current.chapter !== "gate" && (
            <ToolNavigation step={step} total={TOTAL} onBack={back} onNext={next} nextLabel="NEXT ›" />
          )}
        </div>
        <SpecPanel title="YOUR BUILD PLAN" rows={specRows} estimate={range} unlocked={false}>
          <FloorPlan state={{ ...home, style: styleId }} />
        </SpecPanel>
      </div>
    </ToolFrame>
  )
}

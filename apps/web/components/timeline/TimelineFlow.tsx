"use client"

// Build Timeline Estimator — 3 steps + Gantt with "you are here" marker.
// "On time isn't a slogan — it's a schedule." Honest TIGHT callout included.

import { useEffect, useMemo, useRef, useState } from "react"
import { computeTimeline, type TimelineState } from "@segc/engines"
import {
  BreakdownCard,
  cardStyle,
  FunnelBlock,
  GanttPhaseBar,
  NextModuleCard,
  PdfConfirmStrip,
  PillGroup,
  ProgressBar,
  RangeField,
  SpecPanel,
  StepShell,
  TierCards,
  tokens,
  ToolFrame,
  ToolNavigation,
} from "@segc/ui"
import { useUnlock } from "@/components/shared/useUnlock"
import { GateStep } from "@/components/shared/GateStep"
import { usePlanDraft } from "@/components/shared/usePlanDraft"

const TOTAL_STEPS = 4

const REGIONS = [
  { value: "sandhills", label: "Sandhills", sub: "Fayetteville · Lumberton" },
  { value: "triad", label: "Triad", sub: "Greensboro · Winston" },
  { value: "charlotte", label: "Piedmont", sub: "Charlotte · metro" },
  { value: "triangle", label: "Triangle", sub: "Raleigh · Durham" },
  { value: "coastal", label: "Coastal", sub: "Wilmington · Brunswick" },
  { value: "mountains", label: "Mountains", sub: "Asheville · WNC" },
]

const TIER_PRICES = { essential: 225, signature: 285, bespoke: 350 } // display only

const INITIAL: TimelineState = {
  stage: "exploring",
  region: "sandhills",
  sqft: 2800,
  complexity: "custom",
  tier: "signature",
  basement: false,
  pool: false,
  financing: "not-started",
  targetDate: "",
}

function monthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase()
}

/** Next 8 quarters as target options, computed client-side. */
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
    const month = (quarter - 1) * 3 + 2 // middle month of the quarter
    options.push({ value: `${year}-${String(month + 1).padStart(2, "0")}-01`, label: `Q${quarter} ${year}` })
  }
  return options
}

export function TimelineFlow() {
  const [step, setStep] = useState(0)
  const [state, setState] = useState<TimelineState>(INITIAL)
  const prefilled = useRef(false)
  const { unlocked, pending, gateError, unlock, lead, hydrated, profile } = useUnlock("timeline")
  const { draftReady, draftRestored } = usePlanDraft({
    toolId: "timeline",
    step,
    inputs: state,
    maxStep: TOTAL_STEPS - 1,
    onRestore: (draft) => {
      setState(draft.inputs)
      setStep(draft.step)
    },
  })

  useEffect(() => {
    if (!hydrated || !draftReady || prefilled.current) return
    prefilled.current = true
    if (draftRestored) return
    setState((current) => ({
      ...current,
      ...(profile.region ? { region: profile.region } : {}),
      ...(profile.sqft ? { sqft: profile.sqft } : {}),
      ...(profile.tier ? { tier: profile.tier as TimelineState["tier"] } : {}),
    }))
  }, [draftReady, draftRestored, hydrated, profile])

  const result = useMemo(() => computeTimeline(state), [state])
  const windowLabel = `${monthYear(result.moveInStart)} – ${monthYear(result.moveInEnd)}`
  const quarters = useMemo(quarterOptions, [])

  const update = <K extends keyof TimelineState>(key: K, value: TimelineState[K]) =>
    setState((current) => ({ ...current, [key]: value }))

  if (unlocked) {
    const firstName = unlocked.lead.name.split(" ")[0] || unlocked.lead.name
    return (
      <ToolFrame
        heading="WHEN CAN YOU MOVE IN?"
        sub="On time isn't a slogan — it's a schedule. Here's yours, phase by phase, with the honest version of what your target requires."
      >
        <section style={{ display: "grid", gap: 22 }}>
          <div style={{ ...cardStyle(), background: tokens.brown, color: tokens.white }}>
            <span style={{ color: tokens.gold, fontFamily: tokens.display, fontSize: 13, fontWeight: 700 }}>
              ■ {firstName.toUpperCase()}, YOUR ESTIMATED MOVE-IN WINDOW ■
            </span>
            <h2
              style={{
                fontFamily: tokens.display,
                fontSize: "clamp(30px, 5.5vw, 58px)",
                letterSpacing: "-2px",
                lineHeight: 1,
                margin: "14px 0 8px",
                textTransform: "uppercase",
              }}
            >
              {unlocked.headline}
            </h2>
            <p style={{ fontFamily: tokens.body, margin: "0 0 20px", opacity: 0.68 }}>
              {result.minWeeks}–{result.maxWeeks} weeks from today, phase by phase
            </p>
            <GanttPhaseBar dark phases={result.phases} currentIndex={result.currentIndex} />
          </div>
          {result.tight && state.targetDate && (
            <div
              style={{
                background: tokens.brownMid,
                borderRadius: tokens.radTag,
                color: tokens.warm,
                fontFamily: tokens.body,
                fontSize: 13.5,
                lineHeight: 1.55,
                padding: "16px 18px",
              }}
            >
              <strong style={{ display: "block", fontFamily: tokens.display, fontSize: 18, letterSpacing: "-0.4px", marginBottom: 6, textTransform: "uppercase" }}>
                ⚑ THAT TARGET IS TIGHT.
              </strong>
              Your target lands before the earliest realistic finish. The window above is the honest
              schedule — and honest schedules are how we deliver on time. To protect your date,
              design would need to start by <strong>{monthYear(result.designStartBy)}</strong>.
            </div>
          )}
          {!result.tight && state.targetDate && (
            <div
              style={{
                background: "rgba(244,178,20,.08)",
                border: `1px dashed ${tokens.gold}`,
                borderRadius: tokens.radTag,
                fontFamily: tokens.body,
                fontSize: 13,
                padding: "14px 16px",
              }}
            >
              <strong style={{ fontFamily: tokens.display, textTransform: "uppercase" }}>
                TO HIT YOUR TARGET, DESIGN MUST START BY {monthYear(result.designStartBy)} —{" "}
              </strong>
              backward-planned from your move-in goal.
            </div>
          )}
          <PdfConfirmStrip
            email={unlocked.lead.email}
            name="build timeline"
            downloadHref="/api/plan/pdf"
          />
          <BreakdownCard
            title="Phase Durations"
            rows={result.phases.map((phase) => [phase.label, `${phase.min}–${phase.max} weeks`] as [string, string])}
          />
          <NextModuleCard
            title="YOUR UNIFIED BUILD PLAN IS READY"
            carried="Review every chapter together and download one PDF with all of your results."
            href="/plan/continue"
            cta="VIEW MY PLAN ›"
          />
          <FunnelBlock
            bookingUrl={process.env.NEXT_PUBLIC_CAL_LINK ?? "https://southeasterngc.com/contact"}
            briefUrl="/plan/brief"
            contact={{ name: unlocked.lead.name, email: unlocked.lead.email, phone: "", consent: true }}
            tool="timeline"
            headlineResult={unlocked.headline}
            timeline={state.stage === "exploring" ? "explore" : "asap"}
          />
        </section>
      </ToolFrame>
    )
  }

  const stepContent = [
    <StepShell
      key="stage"
      step={0}
      total={TOTAL_STEPS}
      title="WHERE ARE YOU TODAY?"
      sub="Your starting line sets the whole schedule. Be honest — the timeline will be."
    >
      <PillGroup
        label="Current stage"
        value={state.stage}
        onChange={(value) => update("stage", value)}
        columns={2}
        options={[
          { value: "exploring", label: "Dreaming & researching", sub: "No land, no plans yet" },
          { value: "design", label: "Ready to design", sub: "Have land or close to it" },
          { value: "permits", label: "Plans done", sub: "Ready for permitting" },
          { value: "site", label: "Permitted", sub: "Ready to break ground" },
        ]}
      />
      <PillGroup
        label="Where are you building?"
        value={state.region}
        onChange={(value) => update("region", value)}
        columns={3}
        options={REGIONS}
      />
      <PillGroup
        label="Financing"
        value={state.financing}
        onChange={(value) => update("financing", value)}
        options={[
          { value: "approved", label: "Approved / cash" },
          { value: "in-process", label: "In process" },
          { value: "not-started", label: "Not started", badge: "+4–6 WKS" },
        ]}
      />
    </StepShell>,
    <StepShell
      key="scope"
      step={1}
      total={TOTAL_STEPS}
      title="SIZE THE PROJECT."
      sub="Bigger, more complex, and more finished all take longer. The schedule scales with what you're building."
    >
      <RangeField
        label="Conditioned square footage"
        value={state.sqft}
        min={1200}
        max={8000}
        step={100}
        onChange={(value) => update("sqft", value)}
        formatValue={(value) => `${value.toLocaleString()} SQ FT`}
      />
      <PillGroup
        label="Design complexity"
        value={state.complexity}
        onChange={(value) => update("complexity", value)}
        options={[
          { value: "simple", label: "Simple / proven plan" },
          { value: "custom", label: "Custom" },
          { value: "complex", label: "Highly complex" },
        ]}
      />
      <TierCards value={state.tier} onChange={(value) => update("tier", value)} prices={TIER_PRICES} />
      <div className="segc-grid-2">
        <PillGroup
          label="Basement?"
          value={state.basement ? "yes" : "no"}
          onChange={(value) => update("basement", value === "yes")}
          columns={2}
          options={[
            { value: "no", label: "No" },
            { value: "yes", label: "Yes", badge: "+3 WKS" },
          ]}
        />
        <PillGroup
          label="Pool?"
          value={state.pool ? "yes" : "no"}
          onChange={(value) => update("pool", value === "yes")}
          columns={2}
          options={[
            { value: "no", label: "No" },
            { value: "yes", label: "Yes", badge: "+2–4 WKS" },
          ]}
        />
      </div>
    </StepShell>,
    <StepShell
      key="target"
      step={2}
      total={TOTAL_STEPS}
      title="NAME THE TARGET."
      sub="When do you want to be moved in? We'll plan backward from it — and tell you the truth if it's tight."
    >
      <PillGroup
        label="Target move-in"
        value={state.targetDate}
        onChange={(value) => update("targetDate", value)}
        columns={3}
        options={quarters}
      />
    </StepShell>,
    <StepShell
      key="gate"
      step={3}
      total={TOTAL_STEPS}
      title="YOUR SCHEDULE IS READY."
      sub="Tell us where to send your phase-by-phase timeline."
    >
      <GateStep
        lead={lead}
        pending={pending}
        error={gateError}
        onUnlock={(contact) =>
          void unlock(contact, state, { region: state.region, sqft: state.sqft, tier: state.tier })
        }
      />
    </StepShell>,
  ][step]

  const rows: [string, string][] = [
    ["Stage", state.stage === "exploring" ? "Researching" : state.stage],
    ["Scope", `${state.sqft.toLocaleString()} sq ft · ${state.complexity}`],
    ["Finish", state.tier],
    ["Financing", state.financing.replace("-", " ")],
    ["Target", state.targetDate ? monthYear(`${state.targetDate}T12:00:00`) : "Open"],
  ]

  return (
    <ToolFrame
      heading="WHEN CAN YOU MOVE IN?"
      sub="On time isn't a slogan — it's a schedule. Answer three questions and get your phase-by-phase build timeline."
    >
      <ProgressBar current={step} total={TOTAL_STEPS} />
      <div className="segc-stage" style={{ marginTop: 24 }}>
        <div className="segc-card" style={cardStyle()}>
          {stepContent}
          {step < TOTAL_STEPS - 1 && (
            <ToolNavigation
              step={step}
              total={TOTAL_STEPS}
              onBack={() => setStep((value) => Math.max(0, value - 1))}
              onNext={() => setStep((value) => Math.min(TOTAL_STEPS - 1, value + 1))}
            />
          )}
        </div>
        <SpecPanel title="YOUR SCHEDULE SPEC" rows={rows} estimate={windowLabel} unlocked={false}>
          <div style={{ marginTop: 22 }}>
            <GanttPhaseBar dark phases={result.phases} currentIndex={result.currentIndex} />
          </div>
        </SpecPanel>
      </div>
    </ToolFrame>
  )
}

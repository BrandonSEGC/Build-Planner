"use client"

// Land + Build All-In Estimator — 4 steps + stacked LAND/SITE/BUILD/SOFT preview.
// "Most builders quote the house. We quote the whole picture."

import { useEffect, useMemo, useRef, useState } from "react"
import { computeLandBuild, fmt, LAND_BUILD_CONFIG, type LandBuildState } from "@segc/engines"
import {
  BreakdownCard,
  cardStyle,
  Counter,
  FunnelBlock,
  LAND_BUILD_COLORS,
  NextModuleCard,
  PdfConfirmStrip,
  PillGroup,
  ProgressBar,
  RangeField,
  SpecPanel,
  StackedCostBar,
  StepShell,
  TierCards,
  tokens,
  ToolFrame,
  ToolNavigation,
  type CostSegment,
} from "@segc/ui"
import { useUnlock } from "@/components/shared/useUnlock"
import { GateStep } from "@/components/shared/GateStep"
import { usePlanDraft } from "@/components/shared/usePlanDraft"

const TOTAL_STEPS = 4

interface LandBuildInputs extends LandBuildState {
  timeline: string
}

const REGIONS = [
  { value: "sandhills", label: "Sandhills", sub: "Fayetteville · Lumberton" },
  { value: "triad", label: "Triad", sub: "Greensboro · Winston" },
  { value: "charlotte", label: "Piedmont", sub: "Charlotte · metro" },
  { value: "triangle", label: "Triangle", sub: "Raleigh · Durham" },
  { value: "coastal", label: "Coastal", sub: "Wilmington · Brunswick" },
  { value: "mountains", label: "Mountains", sub: "Asheville · WNC" },
]

const INITIAL: LandBuildInputs = {
  region: "sandhills",
  landStatus: "shopping",
  acreage: 2,
  landPrice: 0,
  clearing: "light",
  topography: "flat",
  utilities: "septicWell",
  powerRun: "short",
  driveway: "medium",
  sqft: 2400,
  tier: "signature",
  garage: 2,
  timeline: "6-12",
}

function segmentsFrom(result: ReturnType<typeof computeLandBuild>): CostSegment[] {
  return [
    { label: "Land", value: fmt(result.land), pct: result.percentages.land, color: LAND_BUILD_COLORS.land },
    { label: "Site work", value: fmt(result.site), pct: result.percentages.site, color: LAND_BUILD_COLORS.site },
    { label: "Build", value: fmt(result.build), pct: result.percentages.build, color: LAND_BUILD_COLORS.build },
    { label: "Soft + contingency", value: fmt(result.soft), pct: result.percentages.soft, color: LAND_BUILD_COLORS.soft },
  ]
}

export function LandBuildFlow() {
  const [step, setStep] = useState(0)
  const [state, setState] = useState<LandBuildInputs>(INITIAL)
  const prefilled = useRef(false)
  const { unlocked, pending, gateError, unlock, lead, hydrated, profile } = useUnlock("land")
  const { draftReady, draftRestored } = usePlanDraft({
    toolId: "land",
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
      ...(profile.tier ? { tier: profile.tier as LandBuildInputs["tier"] } : {}),
      ...(profile.landStatus
        ? { landStatus: profile.landStatus as LandBuildInputs["landStatus"] }
        : {}),
      ...(profile.timeline ? { timeline: profile.timeline } : {}),
    }))
  }, [draftReady, draftRestored, hydrated, profile])

  const result = useMemo(() => computeLandBuild(state), [state])
  const range = `${fmt(result.low)}–${fmt(result.high)}`
  const suggestedLand = Math.round(
    state.acreage * (LAND_BUILD_CONFIG.landPerAcre[state.region] ?? 0),
  )

  const update = <K extends keyof LandBuildInputs>(key: K, value: LandBuildInputs[K]) =>
    setState((current) => ({ ...current, [key]: value }))

  if (unlocked) {
    const firstName = unlocked.lead.name.split(" ")[0] || unlocked.lead.name
    const siteLandPct = Math.round(result.percentages.land + result.percentages.site)
    return (
      <ToolFrame
        heading="THE WHOLE PICTURE. ONE NUMBER."
        sub="Most builders quote the house. We quote land, site work, build, and soft costs together — so nothing ambushes your budget."
      >
        <section style={{ display: "grid", gap: 22 }}>
          <div style={{ ...cardStyle(), background: tokens.brown, color: tokens.white }}>
            <span style={{ color: tokens.gold, fontFamily: tokens.display, fontSize: 13, fontWeight: 700 }}>
              ■ {firstName.toUpperCase()}, YOUR ALL-IN RANGE ■
            </span>
            <h2
              style={{
                fontFamily: tokens.display,
                fontSize: "clamp(36px, 6.5vw, 68px)",
                letterSpacing: "-2px",
                lineHeight: 1,
                margin: "14px 0 18px",
                textTransform: "uppercase",
              }}
            >
              {unlocked.headline}
            </h2>
            <StackedCostBar dark segments={segmentsFrom(result)} />
          </div>
          <PdfConfirmStrip
            email={unlocked.lead.email}
            name="land + build estimate"
            downloadHref="/api/plan/pdf"
          />
          <div
            style={{
              background: "rgba(244,178,20,.08)",
              border: `1px dashed ${tokens.gold}`,
              borderRadius: tokens.radTag,
              fontFamily: tokens.body,
              fontSize: 13,
              lineHeight: 1.5,
              padding: "14px 16px",
            }}
          >
            <strong style={{ fontFamily: tokens.display, textTransform: "uppercase" }}>
              SITE & LAND ARE {siteLandPct}% OF YOUR TOTAL —{" "}
            </strong>
            this is why lot selection matters. We walk lots with clients before they buy, so the
            cheap acreage doesn’t become the expensive build.
          </div>
          <BreakdownCard
            title="All-In Breakdown"
            rows={[
              ["Land", `${fmt(result.land)} · ${Math.round(result.percentages.land)}%`],
              ["Site work", `${fmt(result.site)} · ${Math.round(result.percentages.site)}%`],
              ["Build", `${fmt(result.build)} · ${Math.round(result.percentages.build)}%`],
              ["Soft costs + contingency", `${fmt(result.soft)} · ${Math.round(result.percentages.soft)}%`],
              ["All-in total", fmt(result.total)],
            ]}
          />
          <NextModuleCard
            title="WHEN COULD YOU MOVE IN?"
            carried={`We kept your ${state.sqft.toLocaleString()} sq ft ${state.tier} build — see the schedule next.`}
            href="/plan/continue"
            cta="CONTINUE MY PLAN ›"
          />
          <FunnelBlock
            bookingUrl={process.env.NEXT_PUBLIC_CAL_LINK ?? "https://southeasterngc.com/contact"}
            briefUrl="/plan/brief"
            contact={{ name: unlocked.lead.name, email: unlocked.lead.email, phone: "", consent: true }}
            tool="land"
            headlineResult={unlocked.headline}
            timeline={state.timeline}
          />
        </section>
      </ToolFrame>
    )
  }

  const stepContent = [
    <StepShell
      key="land"
      step={0}
      total={TOTAL_STEPS}
      title="START WITH THE DIRT."
      sub="Where you're building and where the land stands. If you're still shopping, we'll estimate acreage cost for your region."
    >
      <PillGroup
        label="Where are you building?"
        value={state.region}
        onChange={(value) => update("region", value)}
        columns={3}
        options={REGIONS}
      />
      <PillGroup
        label="Land status"
        value={state.landStatus}
        onChange={(value) => update("landStatus", value as LandBuildInputs["landStatus"])}
        options={[
          { value: "owned", label: "I own it" },
          { value: "contract", label: "Under contract" },
          { value: "shopping", label: "Still shopping" },
        ]}
      />
      {state.landStatus !== "owned" && (
        <>
          <RangeField
            label="Acreage"
            value={state.acreage}
            min={0.5}
            max={25}
            step={0.5}
            onChange={(value) => update("acreage", value)}
            formatValue={(value) => `${value} ACRES`}
          />
          <RangeField
            label="Land price (if known)"
            value={state.landPrice}
            min={0}
            max={500000}
            step={5000}
            onChange={(value) => update("landPrice", value)}
            formatValue={(value) => (value ? fmt(value) : `EST. ${fmt(suggestedLand)}`)}
            hint={`Leave at zero to use the regional estimate: ~${fmt(LAND_BUILD_CONFIG.landPerAcre[state.region] ?? 0)}/acre in this market.`}
          />
        </>
      )}
    </StepShell>,
    <StepShell
      key="site"
      step={1}
      total={TOTAL_STEPS}
      title="ACCOUNT FOR THE SITE."
      sub="Clearing, slope, utilities, power, and driveway — the invisible line items that surprise people who only got a house quote."
    >
      <PillGroup
        label="Clearing"
        value={state.clearing}
        onChange={(value) => update("clearing", value)}
        options={[
          { value: "light", label: "Light" },
          { value: "moderate", label: "Moderate" },
          { value: "heavy", label: "Heavily wooded" },
        ]}
      />
      <PillGroup
        label="Topography"
        value={state.topography}
        onChange={(value) => update("topography", value)}
        options={[
          { value: "flat", label: "Mostly flat" },
          { value: "slope", label: "Gentle slope" },
          { value: "steep", label: "Steep / graded" },
        ]}
      />
      <PillGroup
        label="Water & sewer"
        value={state.utilities}
        onChange={(value) => update("utilities", value)}
        columns={2}
        options={[
          { value: "municipal", label: "Municipal tap" },
          { value: "septicWell", label: "Well + septic" },
        ]}
      />
      <PillGroup
        label="Power at the road?"
        value={state.powerRun}
        onChange={(value) => update("powerRun", value)}
        options={[
          { value: "short", label: "At the road" },
          { value: "medium", label: "Short run" },
          { value: "long", label: "Long run" },
        ]}
      />
      <PillGroup
        label="Driveway length"
        value={state.driveway}
        onChange={(value) => update("driveway", value)}
        options={[
          { value: "short", label: "Short" },
          { value: "medium", label: "Medium" },
          { value: "long", label: "Long / private" },
        ]}
      />
    </StepShell>,
    <StepShell
      key="build"
      step={2}
      total={TOTAL_STEPS}
      title="NOW THE HOUSE."
      sub="The build basics. For the full configuration — finishes, features, design studio — the Cost Estimator goes deeper."
    >
      <RangeField
        label="Conditioned square footage"
        value={state.sqft}
        min={1200}
        max={6000}
        step={100}
        onChange={(value) => update("sqft", value)}
        formatValue={(value) => `${value.toLocaleString()} SQ FT`}
      />
      <TierCards value={state.tier} onChange={(value) => update("tier", value)} prices={LAND_BUILD_CONFIG.psfByTier} />
      <div className="segc-grid-2">
        <Counter label="Garage bays" value={state.garage} min={0} max={5} onChange={(value) => update("garage", value)} />
      </div>
      <PillGroup
        label="When do you want to build?"
        value={state.timeline}
        onChange={(value) => update("timeline", value)}
        columns={4}
        options={[
          { value: "asap", label: "ASAP" },
          { value: "0-6", label: "0–6 months" },
          { value: "6-12", label: "6–12 months" },
          { value: "explore", label: "Exploring" },
        ]}
      />
    </StepShell>,
    <StepShell
      key="gate"
      step={3}
      total={TOTAL_STEPS}
      title="YOUR ALL-IN NUMBER IS READY."
      sub="Tell us where to send the full land + site + build breakdown."
    >
      <GateStep
        lead={lead}
        pending={pending}
        error={gateError}
        onUnlock={(contact) =>
          void unlock(contact, state, {
            region: state.region,
            sqft: state.sqft,
            tier: state.tier,
            landStatus: state.landStatus,
            timeline: state.timeline,
          })
        }
      />
    </StepShell>,
  ][step]

  const rows: [string, string][] = [
    ["Region", REGIONS.find((r) => r.value === state.region)?.label ?? state.region],
    ["Land", state.landStatus === "owned" ? "Owned" : `${state.acreage} ac · ${state.landPrice ? fmt(state.landPrice) : "est."}`],
    ["Build", `${state.sqft.toLocaleString()} sq ft · ${state.tier}`],
    ["Garage", `${state.garage} bays`],
  ]

  return (
    <ToolFrame
      heading="THE WHOLE PICTURE. ONE NUMBER."
      sub="Most builders quote the house. We quote land, site work, build, and soft costs together — so nothing ambushes your budget."
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
        <SpecPanel title="YOUR ALL-IN SPEC" rows={rows} estimate={range} unlocked={false}>
          <div style={{ marginTop: 22 }}>
            <StackedCostBar dark segments={segmentsFrom(result)} />
          </div>
        </SpecPanel>
      </div>
    </ToolFrame>
  )
}

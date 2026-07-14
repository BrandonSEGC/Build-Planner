"use client"

// The flagship module: Custom Home Cost Estimator, end-to-end.
// Guided steps → live blurred estimate → gate → unlock (server-computed) →
// payoff + breakdown + PDF confirm + funnel. Returning leads skip the gate.

import { useEffect, useMemo, useRef, useState } from "react"
import {
  computeHomeEstimate,
  fmt,
  HOME_CONFIG,
  monthlyPayment,
  STYLE_PROFILES,
  type HomeEstimateState,
} from "@segc/engines"
import {
  BreakdownCard,
  btnPrimaryStyle,
  cardStyle,
  Counter,
  fieldLabelStyle,
  FunnelBlock,
  Gate,
  NextModuleCard,
  PdfConfirmStrip,
  PillGroup,
  ProgressBar,
  RangeField,
  SpecPanel,
  StepShell,
  SwatchGrid,
  TierCards,
  tokens,
  ToolFrame,
  ToolNavigation,
  type Contact,
} from "@segc/ui"
import { useBuildProfile } from "@/lib/store"
import { FloorPlan } from "./FloorPlan"

// Generated brand imagery (Higgsfield) served from /public/images.
// Swap for real SEGC project photography when available — filenames stay stable.
const STYLE_IMAGES: Record<string, string> = {
  farmhouse: "/images/style-modern-farmhouse.webp",
  lowcountry: "/images/style-lowcountry.webp",
  craftsman: "/images/style-craftsman.webp",
  modern: "/images/style-modern.webp",
  traditional: "/images/style-traditional-brick.webp",
  transitional: "/images/style-transitional.webp",
}

const STYLE_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(STYLE_PROFILES).map(([id, profile]) => [id, profile.name]),
)

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

function createInitialState(): HomeEstimateState {
  return {
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
}

interface UnlockResponse {
  ok: boolean
  returning: boolean
  lead: { name: string; email: string }
  headline: string
  nextModule: string
  error?: string
}

const TOTAL_STEPS = 8

export function EstimatorFlow() {
  const [step, setStep] = useState(0)
  const [state, setState] = useState<HomeEstimateState>(createInitialState)
  const [unlocked, setUnlocked] = useState<UnlockResponse | null>(null)
  const [pending, setPending] = useState(false)
  const [gateError, setGateError] = useState<string | null>(null)
  const prefilled = useRef(false)
  const { hydrate, hydrated, profile, lead, patch } = useBuildProfile()

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  // Shared-profile prefill (once, on hydration) + ?style= deep link from the quiz.
  useEffect(() => {
    if (!hydrated || prefilled.current) return
    prefilled.current = true
    const params = new URLSearchParams(window.location.search)
    const requestedStyle = params.get("style")
    const requestedSqft = Number(params.get("sqft"))
    const sqftFromParam =
      Number.isFinite(requestedSqft) && requestedSqft >= 1200 && requestedSqft <= 8000
        ? Math.round(requestedSqft / 100) * 100
        : null
    setState((current) => ({
      ...current,
      ...(profile.region ? { region: profile.region } : {}),
      ...(profile.sqft ? { sqft: profile.sqft } : {}),
      ...(profile.tier ? { tier: profile.tier } : {}),
      ...(profile.timeline ? { timeline: profile.timeline } : {}),
      ...(profile.style && STYLE_NAMES[profile.style] ? { style: profile.style } : {}),
      ...(requestedStyle && STYLE_NAMES[requestedStyle] ? { style: requestedStyle } : {}),
      ...(sqftFromParam ? { sqft: sqftFromParam } : {}),
    }))
  }, [hydrated, profile])

  const estimate = useMemo(() => computeHomeEstimate(state), [state])
  const range = `${fmt(estimate.low)}–${fmt(estimate.high)}`
  const regionName = HOME_CONFIG.regions.find((item) => item.id === state.region)?.name ?? state.region

  const update = <K extends keyof HomeEstimateState>(key: K, value: HomeEstimateState[K]) =>
    setState((current) => ({ ...current, [key]: value }))

  function toggleFeature(id: string) {
    update(
      "features",
      state.features.includes(id)
        ? state.features.filter((item) => item !== id)
        : [...state.features, id],
    )
  }

  async function unlock(contact: Contact | null) {
    setPending(true)
    setGateError(null)
    try {
      const response = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId: "estimator", contact, inputs: state }),
      })
      const data = (await response.json()) as UnlockResponse
      if (!response.ok || !data.ok) {
        setGateError(data.error ?? "Something went wrong. Please try again.")
        return
      }
      patch({
        region: state.region,
        sqft: state.sqft,
        tier: state.tier,
        style: state.style,
        timeline: state.timeline,
      })
      setUnlocked(data)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch {
      setGateError("Network error. Please try again.")
    } finally {
      setPending(false)
    }
  }

  /* ---------- unlocked result screen ---------- */

  if (unlocked) {
    const firstName = unlocked.lead.name.split(" ")[0] || unlocked.lead.name
    const pi = monthlyPayment(estimate.total * 0.8, 6.75, 30) // PLACEHOLDER rate
    return (
      <ToolFrame
        heading="BUILD YOUR CUSTOM HOME ESTIMATE."
        sub="Design the footprint, finishes, and features. We’ll calculate a directional planning range for your North Carolina custom home."
      >
        <section style={{ display: "grid", gap: 22 }}>
          <div style={{ ...cardStyle(), background: tokens.brown, color: tokens.white }}>
            <span style={{ color: tokens.gold, fontFamily: tokens.display, fontSize: 13, fontWeight: 700 }}>
              ■ {firstName.toUpperCase()}, YOUR CUSTOM HOME RANGE ■
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
            <p style={{ fontFamily: tokens.body, margin: 0, opacity: 0.68 }}>
              Directional planning range · {fmt(estimate.psfEff)} effective cost per sq ft
            </p>
          </div>
          <PdfConfirmStrip email={unlocked.lead.email} name="custom-home estimate" />
          <div className="segc-grid-2">
            <BreakdownCard
              title="Estimate Breakdown"
              rows={[
                ["Base construction", fmt(estimate.shell)],
                ["Garage + program", fmt(estimate.garage + estimate.bonus + estimate.porch)],
                ["Finishes + features", fmt(estimate.interiorAdds)],
                ["Site work", fmt(estimate.site)],
                ["Soft costs + contingency", fmt(estimate.soft + estimate.contingency)],
              ]}
            />
            <BreakdownCard
              title="Planning Snapshot"
              rows={[
                ["Estimated midpoint", fmt(estimate.total)],
                ["Illustrative 80% loan P&I", `${fmt(pi)} / mo`],
                ["Region", regionName],
                ["Style", STYLE_NAMES[state.style] ?? state.style],
                ["Timeline", state.timeline],
              ]}
            />
          </div>
          <NextModuleCard
            title="SEE WHAT FITS YOUR MONTHLY BUDGET"
            carried={`We kept your ${state.sqft.toLocaleString()} sq ft and ${state.tier} finish — check affordability next.`}
            href="/plan"
            cta="KEEP PLANNING ›"
          />
          <FunnelBlock
            bookingUrl={process.env.NEXT_PUBLIC_CAL_LINK ?? "https://southeasterngc.com/contact"}
            briefUrl="/plan/brief"
            contact={{ name: unlocked.lead.name, email: unlocked.lead.email, phone: "", consent: true }}
            tool="estimator"
            headlineResult={unlocked.headline}
            timeline={state.timeline}
          />
        </section>
      </ToolFrame>
    )
  }

  /* ---------- step content ---------- */

  const stepContent = [
    <StepShell
      key="footprint"
      step={0}
      total={TOTAL_STEPS}
      title="START WITH THE FOOTPRINT."
      sub="Choose the market, conditioned square footage, stories, foundation, and ceiling height."
    >
      <PillGroup
        label="Where are you building?"
        value={state.region}
        onChange={(value) => update("region", value)}
        columns={3}
        options={HOME_CONFIG.regions.map((item) => ({ value: item.id, label: item.name, sub: item.sub }))}
      />
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
        label="Stories"
        value={state.stories}
        onChange={(value) => update("stories", value)}
        options={[
          { value: "1", label: "1 Story" },
          { value: "1.5", label: "1½ Story" },
          { value: "2", label: "2 Story" },
        ]}
      />
      <PillGroup
        label="Foundation"
        value={state.foundation}
        onChange={(value) => update("foundation", value)}
        columns={4}
        options={[
          { value: "slab", label: "Slab" },
          { value: "crawl", label: "Crawlspace" },
          { value: "basement", label: "Basement" },
          { value: "piling", label: "Piling" },
        ]}
      />
      <PillGroup
        label="Ceiling height"
        value={state.ceiling}
        onChange={(value) => update("ceiling", value)}
        options={[
          { value: "9", label: "9 FT" },
          { value: "10", label: "10 FT" },
          { value: "12", label: "12 FT" },
        ]}
      />
    </StepShell>,
    <StepShell
      key="program"
      step={1}
      total={TOTAL_STEPS}
      title="SHAPE THE FLOOR PLAN."
      sub="Set the rooms, garage, and covered spaces that define daily life."
    >
      <div className="segc-grid-2">
        <Counter label="Bedrooms" value={state.beds} min={2} max={8} onChange={(value) => update("beds", value)} />
        <Counter label="Full baths" value={state.fullBaths} min={2} max={7} onChange={(value) => update("fullBaths", value)} />
        <Counter label="Half baths" value={state.halfBaths} min={0} max={4} onChange={(value) => update("halfBaths", value)} />
        <Counter label="Garage bays" value={state.garage} min={0} max={5} onChange={(value) => update("garage", value)} />
        <Counter label="Bonus rooms" value={state.bonus} min={0} max={4} onChange={(value) => update("bonus", value)} />
        <Counter label="Covered porches" value={state.porches} min={0} max={4} onChange={(value) => update("porches", value)} />
      </div>
      <PillGroup
        label="Garage type"
        value={state.garageType}
        onChange={(value) => update("garageType", value)}
        columns={2}
        options={[
          { value: "attached", label: "Attached" },
          { value: "detached", label: "Detached" },
        ]}
      />
    </StepShell>,
    <StepShell
      key="finishes"
      step={2}
      total={TOTAL_STEPS}
      title="SET THE FINISH LEVEL."
      sub="Choose the overall specification, then define the highest-impact construction selections."
    >
      <TierCards value={state.tier} onChange={(value) => update("tier", value)} prices={HOME_CONFIG.psfByTier} />
      <PillGroup
        label="Kitchen"
        value={state.kitchen}
        onChange={(value) => update("kitchen", value)}
        options={[
          { value: "standard", label: "Standard" },
          { value: "chef", label: "Chef", badge: "+$35K" },
          { value: "luxury", label: "Luxury", badge: "+$75K" },
        ]}
      />
      <PillGroup
        label="Primary bath"
        value={state.primaryBath}
        onChange={(value) => update("primaryBath", value)}
        columns={2}
        options={[
          { value: "standard", label: "Standard" },
          { value: "spa", label: "Spa", badge: "+$25K" },
        ]}
      />
      <PillGroup
        label="Flooring"
        value={state.flooring}
        onChange={(value) => update("flooring", value)}
        options={[
          { value: "lvp", label: "LVP" },
          { value: "hardwood", label: "Hardwood" },
          { value: "tile", label: "Tile-forward" },
        ]}
      />
      <PillGroup
        label="Exterior"
        value={state.exterior}
        onChange={(value) => update("exterior", value)}
        columns={4}
        options={[
          { value: "vinyl", label: "Vinyl" },
          { value: "fiber", label: "Fiber cement" },
          { value: "brick", label: "Brick" },
          { value: "stone", label: "Stone" },
        ]}
      />
      <PillGroup
        label="Roof form"
        value={state.roof}
        onChange={(value) => update("roof", value)}
        options={[
          { value: "simple", label: "Simple" },
          { value: "standard", label: "Standard" },
          { value: "complex", label: "Complex" },
        ]}
      />
    </StepShell>,
    <StepShell
      key="studio"
      step={3}
      total={TOTAL_STEPS}
      title="ENTER THE DESIGN STUDIO."
      sub="Select the materials and spaces that make the estimate feel like your home."
    >
      {Object.entries(HOME_CONFIG.design).map(([group, options]) => (
        <SwatchGrid
          key={group}
          label={DESIGN_GROUP_NAMES[group] ?? group}
          value={state.design[group]}
          onChange={(value) => update("design", { ...state.design, [group]: value })}
          options={options.map((item) => ({ value: item.id, label: item.name, color: item.sw, cost: item.cost }))}
        />
      ))}
    </StepShell>,
    <StepShell
      key="features"
      step={4}
      total={TOTAL_STEPS}
      title="ADD THE WANT-TO-HAVES."
      sub="Layer in outdoor living, specialty rooms, resilience, and smart-home features."
    >
      <div className="segc-grid-3">
        {HOME_CONFIG.features.map((feature) => {
          const active = state.features.includes(feature.id)
          return (
            <button
              aria-pressed={active}
              key={feature.id}
              onClick={() => toggleFeature(feature.id)}
              type="button"
              style={{
                background: active ? tokens.brown : tokens.white,
                border: `1px solid ${active ? tokens.brown : "#DED9D2"}`,
                borderRadius: tokens.radTag,
                color: active ? tokens.white : tokens.ink,
                cursor: "pointer",
                minHeight: 76,
                padding: 15,
                textAlign: "left",
              }}
            >
              <strong style={{ display: "block", fontFamily: tokens.display, fontSize: 14, textTransform: "uppercase" }}>
                {feature.label}
              </strong>
              <span
                style={{
                  color: active ? tokens.gold : tokens.muted,
                  display: "block",
                  fontFamily: tokens.body,
                  fontSize: 11,
                  marginTop: 6,
                }}
              >
                +{fmt(feature.cost)}
              </span>
            </button>
          )
        })}
      </div>
    </StepShell>,
    <StepShell
      key="site"
      step={5}
      total={TOTAL_STEPS}
      title="ACCOUNT FOR THE SITE."
      sub="Land conditions can materially change a build. Add the known site-work assumptions."
    >
      <PillGroup
        label="Do you own the land?"
        value={state.ownLand}
        onChange={(value) => update("ownLand", value)}
        columns={2}
        options={[
          { value: "yes", label: "Yes" },
          { value: "no", label: "Not yet" },
        ]}
      />
      <PillGroup
        label="Clearing"
        value={state.clearing}
        onChange={(value) => update("clearing", value)}
        options={[
          { value: "none", label: "None" },
          { value: "light", label: "Light" },
          { value: "heavy", label: "Heavy" },
        ]}
      />
      <PillGroup
        label="Utilities"
        value={state.utilities}
        onChange={(value) => update("utilities", value)}
        columns={2}
        options={[
          { value: "municipal", label: "Municipal" },
          { value: "well", label: "Well + septic" },
        ]}
      />
      <PillGroup
        label="Driveway"
        value={state.driveway}
        onChange={(value) => update("driveway", value)}
        columns={2}
        options={[
          { value: "short", label: "Standard" },
          { value: "long", label: "Long / private" },
        ]}
      />
    </StepShell>,
    <StepShell
      key="concept"
      step={6}
      total={TOTAL_STEPS}
      title="CHOOSE THE ARCHITECTURAL DIRECTION."
      sub="Pick the exterior language and tell us how soon you want to move."
    >
      <PillGroup
        label="Design approach"
        value={state.designMode}
        onChange={(value) => update("designMode", value)}
        columns={2}
        options={[
          { value: "A", label: "Start with a proven plan", sub: "Customize a strong base concept." },
          { value: "B", label: "Design from scratch", sub: "Begin with your site and wish list." },
        ]}
      />
      <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
        <legend style={fieldLabelStyle()}>Home style</legend>
        <div className="segc-grid-3">
          {Object.entries(STYLE_NAMES).map(([id, name]) => {
            const active = state.style === id
            return (
              <button
                aria-pressed={active}
                key={id}
                onClick={() => update("style", id)}
                type="button"
                style={{
                  background: tokens.white,
                  border: `2px solid ${active ? tokens.gold : "#DED9D2"}`,
                  borderRadius: tokens.radTag,
                  cursor: "pointer",
                  overflow: "hidden",
                  padding: 0,
                  textAlign: "left",
                }}
              >
                <span
                  className="segc-swatch-img"
                  style={{
                    background: `linear-gradient(rgba(69,30,0,.08),rgba(69,30,0,.22)), url(${STYLE_IMAGES[id]}) center / cover, linear-gradient(135deg,#693709,#451E00)`,
                    display: "block",
                    height: 128,
                  }}
                />
                <strong style={{ display: "block", fontFamily: tokens.display, fontSize: 15, padding: 14, textTransform: "uppercase" }}>
                  {name}
                </strong>
              </button>
            )
          })}
        </div>
      </fieldset>
      <PillGroup
        label="Target timeline"
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
      step={7}
      total={TOTAL_STEPS}
      title="YOUR RANGE IS READY."
      sub="Tell us where to send the detailed result and planning summary."
    >
      {lead ? (
        <div style={{ display: "grid", gap: 18 }}>
          <p style={{ fontFamily: tokens.body, fontSize: 15, lineHeight: 1.55, margin: 0 }}>
            Welcome back, <strong>{lead.name.split(" ")[0]}</strong> — we recognize you, so no form this
            time. Your result unlocks instantly and the PDF goes to <strong>{lead.email}</strong>.
          </p>
          {gateError && (
            <span style={{ color: tokens.error, fontFamily: tokens.body, fontSize: 12 }}>{gateError}</span>
          )}
          <button
            disabled={pending}
            onClick={() => void unlock(null)}
            type="button"
            style={{ ...btnPrimaryStyle(), opacity: pending ? 0.6 : 1, width: "100%" }}
          >
            {pending ? "UNLOCKING…" : "UNLOCK MY RESULT ›"}
          </button>
        </div>
      ) : (
        <Gate onSubmit={(contact) => void unlock(contact)} pending={pending} error={gateError} />
      )}
    </StepShell>,
  ][step]

  const rows: [string, string][] = [
    ["Region", regionName],
    ["Footprint", `${state.sqft.toLocaleString()} sq ft · ${state.stories} story`],
    ["Program", `${state.beds} bd · ${state.fullBaths}.${state.halfBaths ? 5 : 0} ba`],
    ["Finish", state.tier],
    ["Style", STYLE_NAMES[state.style] ?? state.style],
    [
      "Target",
      state.timeline === "asap"
        ? "As soon as possible"
        : state.timeline === "explore"
          ? "Exploring"
          : `${state.timeline} months`,
    ],
  ]

  return (
    <ToolFrame
      heading="BUILD YOUR CUSTOM HOME ESTIMATE."
      sub="Design the footprint, finishes, and features. We’ll calculate a directional planning range for your North Carolina custom home."
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
        <SpecPanel rows={rows} estimate={range} unlocked={false}>
          <FloorPlan state={state} />
        </SpecPanel>
      </div>
    </ToolFrame>
  )
}

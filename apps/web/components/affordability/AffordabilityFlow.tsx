"use client"

// Affordability & Construction Loan Calculator — 4 steps + live DTI meter.
// "See what you can build before you talk to a lender." SEGC is not a lender.

import { useEffect, useMemo, useRef, useState } from "react"
import { computeAffordability, fmt, type AffordabilityState } from "@segc/engines"
import {
  BreakdownCard,
  cardStyle,
  DTIMeter,
  FunnelBlock,
  NextModuleCard,
  PdfConfirmStrip,
  PillGroup,
  ProgressBar,
  RangeField,
  SpecPanel,
  StepShell,
  tokens,
  ToolFrame,
  ToolNavigation,
} from "@segc/ui"
import { useUnlock } from "@/components/shared/useUnlock"
import { GateStep } from "@/components/shared/GateStep"
import { usePlanDraft } from "@/components/shared/usePlanDraft"

const TOTAL_STEPS = 4

interface AffordabilityInputs extends AffordabilityState {
  timeline: string
}

const INITIAL: AffordabilityInputs = {
  annualIncome: 120000,
  monthlyDebts: 800,
  credit: "good",
  cash: 50000,
  landValue: 0,
  loanType: "ctp",
  termYears: 30,
  rate: 6.75, // PLACEHOLDER default rate
  timeline: "6-12",
}

export function AffordabilityFlow() {
  const [step, setStep] = useState(0)
  const [state, setState] = useState<AffordabilityInputs>(INITIAL)
  const prefilled = useRef(false)
  const { unlocked, pending, gateError, unlock, lead, hydrated, profile } = useUnlock("affordability")
  const { draftReady, draftRestored } = usePlanDraft({
    toolId: "affordability",
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
    if (draftRestored || !profile.timeline) return
    setState((current) => ({ ...current, timeline: profile.timeline! }))
  }, [draftReady, draftRestored, hydrated, profile.timeline])

  const result = useMemo(() => computeAffordability(state), [state])
  const range = `${fmt(result.low)}–${fmt(result.high)}`

  const update = <K extends keyof AffordabilityInputs>(key: K, value: AffordabilityInputs[K]) =>
    setState((current) => ({ ...current, [key]: value }))

  if (unlocked) {
    const firstName = unlocked.lead.name.split(" ")[0] || unlocked.lead.name
    const sqftLow = Math.round(result.sqftLow)
    const sqftHigh = Math.round(result.sqftHigh)
    const sqftMid = Math.round((sqftLow + sqftHigh) / 2 / 50) * 50
    return (
      <ToolFrame
        heading="SEE WHAT YOU CAN BUILD."
        sub="Before you talk to a lender. Educational pre-qualification math for your North Carolina construction loan."
      >
        <section style={{ display: "grid", gap: 22 }}>
          <div style={{ ...cardStyle(), background: tokens.brown, color: tokens.white }}>
            <span style={{ color: tokens.gold, fontFamily: tokens.display, fontSize: 13, fontWeight: 700 }}>
              ■ {firstName.toUpperCase()}, YOUR COMFORTABLE BUILD BUDGET ■
            </span>
            <h2
              style={{
                fontFamily: tokens.display,
                fontSize: "clamp(36px, 6.5vw, 68px)",
                letterSpacing: "-2px",
                lineHeight: 1,
                margin: "14px 0 8px",
                textTransform: "uppercase",
              }}
            >
              {unlocked.headline}
            </h2>
            <p style={{ fontFamily: tokens.body, margin: "0 0 18px", opacity: 0.68 }}>
              Est. {fmt(result.piPayment)}/mo principal & interest at your comfortable payment
            </p>
            <DTIMeter dti={result.dti} />
          </div>
          <PdfConfirmStrip
            email={unlocked.lead.email}
            name="affordability report"
            downloadHref="/api/plan/pdf"
          />
          <div className="segc-grid-2">
            <BreakdownCard
              title="The Math"
              rows={[
                ["Comfortable housing payment", `${fmt(result.comfortPayment)} / mo`],
                ["Est. principal & interest", `${fmt(result.piPayment)} / mo`],
                ["Amount financed", fmt(result.financed)],
                ["Cash + land equity applied", fmt(state.cash + state.landValue)],
                ["Debt-to-income", `${result.dti.toFixed(1)}%`],
              ]}
            />
            <BreakdownCard
              title="What That Builds"
              rows={[
                ["Build budget range", range],
                ["At $350/sq ft (Bespoke)", `~${sqftLow.toLocaleString()} sq ft`],
                ["At $225/sq ft (Essential)", `~${sqftHigh.toLocaleString()} sq ft`],
                ["Loan type", state.loanType.toUpperCase()],
                ["Term · rate", `${state.termYears} yr · ${state.rate}%`],
              ]}
            />
          </div>
          <div
            style={{
              background: "rgba(244,178,20,.08)",
              border: `1px dashed ${tokens.gold}`,
              borderRadius: tokens.radTag,
              fontFamily: tokens.body,
              fontSize: 12.5,
              lineHeight: 1.5,
              padding: "13px 16px",
            }}
          >
            <strong style={{ fontFamily: tokens.display, textTransform: "uppercase" }}>Not a lender — </strong>
            this is educational pre-qualification math. Your lender's underwriting governs. We're happy
            to introduce you to construction-loan lenders we trust.
          </div>
          <NextModuleCard
            title="ADD LAND + SITE COSTS TO THE PLAN"
            carried={`Your budget supports roughly ${sqftMid.toLocaleString()} sq ft — now account for the whole property.`}
            href="/plan/continue"
            cta="CONTINUE MY PLAN ›"
          />
          <FunnelBlock
            bookingUrl={process.env.NEXT_PUBLIC_CAL_LINK ?? "https://southeasterngc.com/contact"}
            briefUrl="/plan/brief"
            contact={{ name: unlocked.lead.name, email: unlocked.lead.email, phone: "", consent: true }}
            tool="affordability"
            headlineResult={unlocked.headline}
            timeline={state.timeline}
          />
        </section>
      </ToolFrame>
    )
  }

  const stepContent = [
    <StepShell
      key="income"
      step={0}
      total={TOTAL_STEPS}
      title="START WITH THE HOUSEHOLD."
      sub="Income and existing debts set the ceiling every lender works from. Estimates are fine — this stays directional."
    >
      <RangeField
        label="Household annual income"
        value={state.annualIncome}
        min={40000}
        max={500000}
        step={5000}
        onChange={(value) => update("annualIncome", value)}
        formatValue={(value) => fmt(value)}
      />
      <RangeField
        label="Monthly debt payments"
        value={state.monthlyDebts}
        min={0}
        max={8000}
        step={50}
        onChange={(value) => update("monthlyDebts", value)}
        formatValue={(value) => `${fmt(value)} / MO`}
        hint="Car payments, student loans, cards, existing mortgage you'll keep — not utilities or groceries."
      />
      <PillGroup
        label="Credit range"
        value={state.credit}
        onChange={(value) => update("credit", value)}
        columns={4}
        options={[
          { value: "excellent", label: "740+" },
          { value: "good", label: "680–739" },
          { value: "fair", label: "620–679" },
          { value: "building", label: "Below 620" },
        ]}
      />
    </StepShell>,
    <StepShell
      key="cash"
      step={1}
      total={TOTAL_STEPS}
      title="COUNT WHAT YOU BRING."
      sub="Cash down and land equity both count toward your build. Land you own outright is real money to a construction lender."
    >
      <RangeField
        label="Cash available for the project"
        value={state.cash}
        min={0}
        max={500000}
        step={5000}
        onChange={(value) => update("cash", value)}
        formatValue={(value) => fmt(value)}
      />
      <RangeField
        label="Land equity (if you own your lot)"
        value={state.landValue}
        min={0}
        max={500000}
        step={5000}
        onChange={(value) => update("landValue", value)}
        formatValue={(value) => (value ? fmt(value) : "NONE YET")}
        hint="Current market value of land you own free and clear, or your equity in it."
      />
    </StepShell>,
    <StepShell
      key="loan"
      step={2}
      total={TOTAL_STEPS}
      title="SHAPE THE LOAN."
      sub="Construction-to-perm is the standard path. VA construction loans are real — and around Fort Liberty, we know the lenders who close them."
    >
      <PillGroup
        label="Loan type"
        value={state.loanType}
        onChange={(value) => update("loanType", value as AffordabilityInputs["loanType"])}
        columns={4}
        options={[
          { value: "ctp", label: "Construction-to-perm" },
          { value: "va", label: "VA", badge: "FORT LIBERTY" },
          { value: "fha", label: "FHA" },
          { value: "conventional", label: "Conventional" },
        ]}
      />
      <PillGroup
        label="Term"
        value={String(state.termYears)}
        onChange={(value) => update("termYears", Number(value))}
        options={[
          { value: "15", label: "15 years" },
          { value: "20", label: "20 years" },
          { value: "30", label: "30 years" },
        ]}
      />
      <RangeField
        label="Interest rate"
        value={state.rate}
        min={4}
        max={10}
        step={0.125}
        onChange={(value) => update("rate", value)}
        formatValue={(value) => `${value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}%`}
        hint="Today's construction-to-perm rates are the default. Adjust if you've been quoted."
      />
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
      title="YOUR BUDGET IS READY."
      sub="Tell us where to send your affordability report and the square-footage bridge into the estimator."
    >
      <GateStep lead={lead} pending={pending} error={gateError} onUnlock={(contact) => void unlock(contact, state, { timeline: state.timeline })} />
    </StepShell>,
  ][step]

  const rows: [string, string][] = [
    ["Income", fmt(state.annualIncome)],
    ["Monthly debts", `${fmt(state.monthlyDebts)}/mo`],
    ["Cash + land", fmt(state.cash + state.landValue)],
    ["Loan", `${state.loanType.toUpperCase()} · ${state.termYears}yr · ${state.rate}%`],
  ]

  return (
    <ToolFrame
      heading="SEE WHAT YOU CAN BUILD."
      sub="Before you talk to a lender. Educational pre-qualification math for your North Carolina construction loan — VA-aware for the Fort Liberty community."
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
        <SpecPanel title="YOUR LOAN SPEC" rows={rows} estimate={range} unlocked={false}>
          <div style={{ marginTop: 22 }}>
            <DTIMeter dti={result.dti} />
          </div>
        </SpecPanel>
      </div>
    </ToolFrame>
  )
}

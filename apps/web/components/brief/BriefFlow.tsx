"use client"

// Native project brief — multi-step, prefilled from the shared profile
// ("from your plan" tags), writing to the same DB. Typeform retired.

import { useEffect, useRef, useState, type FormEvent } from "react"
import {
  btnPrimaryStyle,
  cardStyle,
  Counter,
  fieldLabelStyle,
  PillGroup,
  ProgressBar,
  RangeField,
  StepShell,
  tokens,
  ToolFrame,
  ToolNavigation,
  TrustBadges,
} from "@segc/ui"
import { useBuildProfile } from "@/lib/store"

const TOTAL_STEPS = 4

const REGIONS = [
  { value: "sandhills", label: "Sandhills", sub: "Fayetteville · Lumberton" },
  { value: "triad", label: "Triad", sub: "Greensboro · Winston" },
  { value: "charlotte", label: "Piedmont", sub: "Charlotte · metro" },
  { value: "triangle", label: "Triangle", sub: "Raleigh · Durham" },
  { value: "coastal", label: "Coastal", sub: "Wilmington · Brunswick" },
  { value: "mountains", label: "Mountains", sub: "Asheville · WNC" },
]

interface BriefState {
  projectType: "custom-home" | "land-build" | "renovation" | "commercial"
  region: string
  sqft: number
  beds: number
  baths: number
  landStatus: "owned" | "contract" | "shopping"
  budgetRange: "under-500k" | "500-750k" | "750k-1m" | "over-1m" | "unsure"
  timeline: string
  notes: string
}

const INITIAL: BriefState = {
  projectType: "custom-home",
  region: "sandhills",
  sqft: 2400,
  beds: 4,
  baths: 3,
  landStatus: "shopping",
  budgetRange: "unsure",
  timeline: "6-12",
  notes: "",
}

function FromPlanTag() {
  return (
    <span
      style={{
        background: "rgba(244,178,20,.14)",
        border: `1px solid ${tokens.gold}`,
        borderRadius: 8,
        color: tokens.brownMid,
        fontFamily: tokens.display,
        fontSize: 10,
        fontWeight: 700,
        marginLeft: 8,
        padding: "3px 7px",
        textTransform: "uppercase",
        verticalAlign: "middle",
      }}
    >
      FROM YOUR PLAN
    </span>
  )
}

const inputStyle = {
  background: tokens.white,
  border: "1px solid #CFC9C1",
  borderRadius: tokens.radTag,
  color: tokens.ink,
  fontFamily: tokens.body,
  fontSize: 15,
  minHeight: 50,
  padding: "13px 14px",
  width: "100%",
} as const

export function BriefFlow() {
  const [step, setStep] = useState(0)
  const [state, setState] = useState<BriefState>(INITIAL)
  const [contact, setContact] = useState({ name: "", email: "", phone: "", consent: false })
  const [attempted, setAttempted] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ name: string; email: string } | null>(null)
  const prefilled = useRef(false)
  const prefilledKeys = useRef<Set<string>>(new Set())
  const { hydrate, hydrated, profile, lead } = useBuildProfile()

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!hydrated || prefilled.current) return
    prefilled.current = true
    const keys = new Set<string>()
    setState((current) => {
      const next = { ...current }
      if (profile.region) {
        next.region = profile.region
        keys.add("region")
      }
      if (profile.sqft) {
        next.sqft = profile.sqft
        keys.add("sqft")
      }
      if (profile.landStatus === "owned" || profile.landStatus === "contract" || profile.landStatus === "shopping") {
        next.landStatus = profile.landStatus
        keys.add("landStatus")
      }
      if (profile.timeline) {
        next.timeline = profile.timeline
        keys.add("timeline")
      }
      return next
    })
    prefilledKeys.current = keys
  }, [hydrated, profile])

  const update = <K extends keyof BriefState>(key: K, value: BriefState[K]) =>
    setState((current) => ({ ...current, [key]: value }))

  const validName = contact.name.trim().length >= 2
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())
  const validPhone = contact.phone.replace(/\D/g, "").length >= 10
  const contactValid = lead ? true : validName && validEmail && validPhone && contact.consent

  async function submit(event?: FormEvent) {
    event?.preventDefault()
    setAttempted(true)
    if (!contactValid || pending) return
    setPending(true)
    setError(null)
    try {
      const response = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...state, contact: lead ? null : contact }),
      })
      const data = await response.json()
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Something went wrong. Please try again.")
        return
      }
      setDone(data.lead)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setPending(false)
    }
  }

  if (done) {
    const firstName = done.name.split(" ")[0] || done.name
    return (
      <ToolFrame
        heading="YOUR BRIEF IS IN."
        sub="Someone who has actually built what you're describing will review it and reach out within one business day."
      >
        <section style={{ display: "grid", gap: 22, maxWidth: 760 }}>
          <div style={{ ...cardStyle(), background: tokens.brown, color: tokens.white }}>
            <span style={{ color: tokens.gold, fontFamily: tokens.display, fontSize: 13, fontWeight: 700 }}>
              ■ PROJECT BRIEF RECEIVED ■
            </span>
            <h2
              style={{
                fontFamily: tokens.display,
                fontSize: "clamp(30px, 5vw, 52px)",
                letterSpacing: "-1.6px",
                lineHeight: 1,
                margin: "14px 0 10px",
                textTransform: "uppercase",
              }}
            >
              {firstName.toUpperCase()}, WE’RE ALREADY READING IT.
            </h2>
            <p style={{ fontFamily: tokens.body, fontSize: 14, lineHeight: 1.55, margin: 0, opacity: 0.75 }}>
              Confirmation sent to {done.email}. Expect a call or email within one business day —
              or grab a consultation slot now and skip the queue.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <a
              href={process.env.NEXT_PUBLIC_CAL_LINK ?? "https://southeasterngc.com/contact"}
              style={{ ...btnPrimaryStyle(), textDecoration: "none" }}
            >
              BOOK A FREE DESIGN CONSULTATION ›
            </a>
            <a href="/plan" style={{ ...btnPrimaryStyle("transparent", tokens.ink), border: `1px solid ${tokens.ink}`, textDecoration: "none" }}>
              BACK TO MY BUILD PLAN ›
            </a>
          </div>
        </section>
      </ToolFrame>
    )
  }

  const steps = [
    <StepShell
      key="project"
      step={0}
      total={TOTAL_STEPS}
      title="TELL US WHAT WE'RE BUILDING."
      sub="The shape of the project. Everything you've already told the planner is filled in — adjust anything."
    >
      <PillGroup
        label="Project type"
        value={state.projectType}
        onChange={(value) => update("projectType", value as BriefState["projectType"])}
        columns={4}
        options={[
          { value: "custom-home", label: "Custom home" },
          { value: "land-build", label: "Land + build" },
          { value: "renovation", label: "Renovation / addition" },
          { value: "commercial", label: "Commercial" },
        ]}
      />
      <div>
        <span style={fieldLabelStyle()}>
          Where {prefilledKeys.current.has("region") && <FromPlanTag />}
        </span>
        <PillGroup label="" value={state.region} onChange={(value) => update("region", value)} columns={3} options={REGIONS} />
      </div>
      <div>
        <span style={fieldLabelStyle()}>
          Target size {prefilledKeys.current.has("sqft") && <FromPlanTag />}
        </span>
        <RangeField
          label=""
          value={state.sqft}
          min={0}
          max={8000}
          step={100}
          onChange={(value) => update("sqft", value)}
          formatValue={(value) => (value ? `${value.toLocaleString()} SQ FT` : "NOT SURE YET")}
        />
      </div>
    </StepShell>,
    <StepShell
      key="money"
      step={1}
      total={TOTAL_STEPS}
      title="LAND, BUDGET, TIMING."
      sub="Honest ranges are enough — this brief starts a conversation, not a contract."
    >
      <div>
        <span style={fieldLabelStyle()}>
          Land status {prefilledKeys.current.has("landStatus") && <FromPlanTag />}
        </span>
        <PillGroup
          label=""
          value={state.landStatus}
          onChange={(value) => update("landStatus", value as BriefState["landStatus"])}
          options={[
            { value: "owned", label: "I own it" },
            { value: "contract", label: "Under contract" },
            { value: "shopping", label: "Still shopping" },
          ]}
        />
      </div>
      <PillGroup
        label="All-in budget range"
        value={state.budgetRange}
        onChange={(value) => update("budgetRange", value as BriefState["budgetRange"])}
        columns={3}
        options={[
          { value: "under-500k", label: "Under $500K" },
          { value: "500-750k", label: "$500–750K" },
          { value: "750k-1m", label: "$750K–1M" },
          { value: "over-1m", label: "$1M+" },
          { value: "unsure", label: "Not sure yet" },
        ]}
      />
      <div>
        <span style={fieldLabelStyle()}>
          Timeline {prefilledKeys.current.has("timeline") && <FromPlanTag />}
        </span>
        <PillGroup
          label=""
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
      </div>
    </StepShell>,
    <StepShell
      key="details"
      step={2}
      total={TOTAL_STEPS}
      title="THE DETAILS THAT MATTER TO YOU."
      sub="Rooms, and anything we should know — the lot you're eyeing, the porch you've always wanted, the deadline that isn't moving."
    >
      <div className="segc-grid-2">
        <Counter label="Bedrooms" value={state.beds} min={0} max={8} onChange={(value) => update("beds", value)} />
        <Counter label="Bathrooms" value={state.baths} min={0} max={8} onChange={(value) => update("baths", value)} />
      </div>
      <label style={{ display: "grid", gap: 8 }}>
        <span style={{ ...fieldLabelStyle(), margin: 0 }}>Anything else? (optional)</span>
        <textarea
          maxLength={2000}
          onChange={(event) => update("notes", event.target.value)}
          placeholder="Tell us about your land, your must-haves, your inspiration…"
          rows={5}
          value={state.notes}
          style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
        />
      </label>
    </StepShell>,
    <StepShell
      key="send"
      step={3}
      total={TOTAL_STEPS}
      title="SEND IT TO THE BUILDERS."
      sub={lead ? "You're recognized — one tap and it's on our desk." : "Where should we follow up?"}
    >
      {lead ? (
        <div style={{ display: "grid", gap: 18 }}>
          <p style={{ fontFamily: tokens.body, fontSize: 15, lineHeight: 1.55, margin: 0 }}>
            Sending as <strong>{lead.name}</strong> ({lead.email}).
          </p>
          {error && <span style={{ color: tokens.error, fontFamily: tokens.body, fontSize: 12 }}>{error}</span>}
          <button disabled={pending} onClick={() => void submit()} type="button" style={{ ...btnPrimaryStyle(), opacity: pending ? 0.6 : 1, width: "100%" }}>
            {pending ? "SENDING…" : "SUBMIT MY PROJECT BRIEF ›"}
          </button>
        </div>
      ) : (
        <form noValidate onSubmit={submit} style={{ display: "grid", gap: 16 }}>
          <div className="segc-grid-2">
            <label style={{ display: "grid", gap: 7 }}>
              <span style={{ ...fieldLabelStyle(), margin: 0 }}>Name</span>
              <input
                aria-invalid={attempted && !validName}
                autoComplete="name"
                onChange={(event) => setContact({ ...contact, name: event.target.value })}
                placeholder="Jane Smith"
                style={{ ...inputStyle, borderColor: attempted && !validName ? tokens.error : "#CFC9C1" }}
                value={contact.name}
              />
            </label>
            <label style={{ display: "grid", gap: 7 }}>
              <span style={{ ...fieldLabelStyle(), margin: 0 }}>Email</span>
              <input
                aria-invalid={attempted && !validEmail}
                autoComplete="email"
                onChange={(event) => setContact({ ...contact, email: event.target.value })}
                placeholder="jane@email.com"
                style={{ ...inputStyle, borderColor: attempted && !validEmail ? tokens.error : "#CFC9C1" }}
                type="email"
                value={contact.email}
              />
            </label>
          </div>
          <label style={{ display: "grid", gap: 7 }}>
            <span style={{ ...fieldLabelStyle(), margin: 0 }}>Phone</span>
            <input
              aria-invalid={attempted && !validPhone}
              autoComplete="tel"
              onChange={(event) => setContact({ ...contact, phone: event.target.value })}
              placeholder="(910) 555-0123"
              style={{ ...inputStyle, borderColor: attempted && !validPhone ? tokens.error : "#CFC9C1" }}
              type="tel"
              value={contact.phone}
            />
          </label>
          <label style={{ alignItems: "start", display: "grid", gridTemplateColumns: "22px 1fr", gap: 10 }}>
            <input
              checked={contact.consent}
              onChange={(event) => setContact({ ...contact, consent: event.target.checked })}
              style={{ accentColor: tokens.brown, height: 20, margin: 0, width: 20 }}
              type="checkbox"
            />
            <span style={{ color: tokens.muted, fontFamily: tokens.body, fontSize: 11.5, lineHeight: 1.45 }}>
              I agree that SEGC may contact me about my project. Message and data rates may apply.
            </span>
          </label>
          {attempted && !contactValid && (
            <span style={{ color: tokens.error, fontFamily: tokens.body, fontSize: 11 }}>
              Complete all fields and check the consent box.
            </span>
          )}
          {error && <span style={{ color: tokens.error, fontFamily: tokens.body, fontSize: 12 }}>{error}</span>}
          <button disabled={pending} type="submit" style={{ ...btnPrimaryStyle(), opacity: pending ? 0.6 : 1, width: "100%" }}>
            {pending ? "SENDING…" : "SUBMIT MY PROJECT BRIEF ›"}
          </button>
        </form>
      )}
    </StepShell>,
  ][step]

  return (
    <ToolFrame
      heading="START YOUR PROJECT BRIEF."
      sub="Four minutes. No pressure. It lands directly on the desks of the people who will actually build your home."
    >
      <ProgressBar current={step} total={TOTAL_STEPS} />
      <div style={{ margin: "24px auto 0", maxWidth: 860 }}>
        <div className="segc-card" style={cardStyle()}>
          {steps}
          {step < TOTAL_STEPS - 1 && (
            <ToolNavigation
              step={step}
              total={TOTAL_STEPS}
              onBack={() => setStep((value) => Math.max(0, value - 1))}
              onNext={() => setStep((value) => Math.min(TOTAL_STEPS - 1, value + 1))}
              nextLabel="NEXT ›"
            />
          )}
        </div>
        <div style={{ marginTop: 22 }}>
          <TrustBadges />
        </div>
      </div>
    </ToolFrame>
  )
}

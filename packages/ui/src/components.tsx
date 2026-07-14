"use client"

import { useState, type CSSProperties, type FormEvent, type ReactNode } from "react"
import { fmt } from "@segc/engines"
import { tokens, TRUST_BADGES } from "./tokens"

export interface Contact {
  name: string
  email: string
  phone: string
  consent: boolean
}

export interface Choice {
  value: string
  label: string
  sub?: string
  badge?: string
}

/* ---------- style helpers ---------- */

export function preHeaderStyle(color: string = tokens.gold): CSSProperties {
  return {
    color,
    fontFamily: tokens.display,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "-0.3px",
    lineHeight: 1.1,
    textTransform: "uppercase",
  }
}

export function btnPrimaryStyle(accent: string = tokens.gold, ink: string = tokens.ink): CSSProperties {
  return {
    appearance: "none",
    border: 0,
    borderRadius: 0,
    background: accent,
    color: ink,
    cursor: "pointer",
    fontFamily: tokens.display,
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: "-0.3px",
    lineHeight: 1,
    minHeight: 48,
    padding: "16px 22px",
    textTransform: "uppercase",
  }
}

export function btnGhostStyle(color: string = tokens.ink): CSSProperties {
  return {
    ...btnPrimaryStyle("transparent", color),
    border: `1px solid ${color}`,
  }
}

export function cardStyle(): CSSProperties {
  return {
    background: tokens.white,
    border: "1px solid rgba(69, 30, 0, 0.09)",
    borderRadius: tokens.radCard,
    boxShadow: tokens.shadow,
    padding: 28,
  }
}

export function badgeStyle(): CSSProperties {
  return {
    alignItems: "center",
    background: tokens.gray,
    border: "1px solid rgba(69, 30, 0, 0.08)",
    borderRadius: tokens.radPill,
    display: "inline-flex",
    fontFamily: tokens.body,
    fontSize: 12,
    fontWeight: 600,
    gap: 8,
    minHeight: 36,
    padding: "7px 13px",
  }
}

export function h1Style(color: string = tokens.ink): CSSProperties {
  return {
    color,
    fontFamily: tokens.display,
    fontSize: "clamp(36px, 6vw, 68px)",
    fontWeight: 700,
    letterSpacing: "-1.88px",
    lineHeight: 0.98,
    margin: 0,
    maxWidth: "16ch",
    textTransform: "uppercase",
  }
}

export function fieldLabelStyle(): CSSProperties {
  return {
    color: tokens.ink,
    display: "block",
    fontFamily: tokens.display,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "-0.3px",
    marginBottom: 10,
    textTransform: "uppercase",
  }
}

/* ---------- signature marks ---------- */

export function PreHeader({ children, color }: { children: ReactNode; color?: string }) {
  return <div style={preHeaderStyle(color)}>■ {children} ■</div>
}

export function TrustBadges() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
      {TRUST_BADGES.map((item) => (
        <span key={item} style={badgeStyle()}>
          <span aria-hidden="true" style={{ color: tokens.gold, fontSize: 16 }}>
            ●
          </span>
          {item}
        </span>
      ))}
    </div>
  )
}

export function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div
      aria-label={`Step ${current + 1} of ${total}`}
      style={{ display: "grid", gridTemplateColumns: `repeat(${total}, 1fr)`, gap: 6 }}
    >
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          style={{ background: index <= current ? tokens.brown : "#E9E5DF", display: "block", height: 4 }}
        />
      ))}
    </div>
  )
}

export function StepShell({
  step,
  total,
  title,
  sub,
  children,
}: {
  step: number
  total: number
  title: string
  sub: string
  children: ReactNode
}) {
  return (
    <section aria-labelledby={`segc-step-${step}`} className="segc-step-enter">
      <div style={{ ...preHeaderStyle(tokens.brown), marginBottom: 12 }}>
        STEP {step + 1} / {total}
      </div>
      <h2
        id={`segc-step-${step}`}
        style={{
          color: tokens.ink,
          fontFamily: tokens.display,
          fontSize: "clamp(28px, 4vw, 44px)",
          fontWeight: 700,
          letterSpacing: "-1.2px",
          lineHeight: 1,
          margin: 0,
          textTransform: "uppercase",
        }}
      >
        {title}
      </h2>
      <p
        style={{
          color: "#5E574F",
          fontFamily: tokens.body,
          fontSize: 15,
          lineHeight: 1.55,
          margin: "12px 0 28px",
          maxWidth: "62ch",
        }}
      >
        {sub}
      </p>
      <div style={{ display: "grid", gap: 26 }}>{children}</div>
    </section>
  )
}

/* ---------- input controls ---------- */

export function PillGroup({
  label,
  value,
  options,
  onChange,
  columns = 3,
}: {
  label: string
  value: string
  options: Choice[]
  onChange: (value: string) => void
  columns?: 2 | 3 | 4
}) {
  return (
    <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
      <legend style={fieldLabelStyle()}>{label}</legend>
      <div className={`segc-grid-${columns}`}>
        {options.map((option) => {
          const active = option.value === value
          return (
            <button
              aria-pressed={active}
              key={option.value}
              onClick={() => onChange(option.value)}
              type="button"
              style={{
                background: active ? tokens.brown : tokens.white,
                border: `1px solid ${active ? tokens.brown : "#DED9D2"}`,
                borderRadius: tokens.radTag,
                color: active ? tokens.warm : tokens.ink,
                cursor: "pointer",
                minHeight: 54,
                padding: "12px 14px",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontFamily: tokens.display,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "-0.3px",
                  textTransform: "uppercase",
                }}
              >
                {option.label}
              </span>
              {option.badge && (
                <span
                  style={{
                    color: tokens.gold,
                    display: "block",
                    fontFamily: tokens.display,
                    fontSize: 11,
                    fontWeight: 700,
                    marginTop: 5,
                    textTransform: "uppercase",
                  }}
                >
                  {option.badge}
                </span>
              )}
              {option.sub && (
                <span
                  style={{
                    display: "block",
                    fontFamily: tokens.body,
                    fontSize: 11,
                    lineHeight: 1.35,
                    marginTop: 4,
                    opacity: 0.72,
                  }}
                >
                  {option.sub}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export function Counter({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <div
      style={{
        alignItems: "center",
        border: "1px solid #DED9D2",
        borderRadius: tokens.radTag,
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 16,
        minHeight: 62,
        padding: "10px 12px 10px 16px",
      }}
    >
      <div>
        <span style={{ ...fieldLabelStyle(), margin: 0 }}>{label}</span>
        <strong style={{ fontFamily: tokens.display, fontSize: 24 }}>{value}</strong>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {[-1, 1].map((delta) => (
          <button
            aria-label={`${delta < 0 ? "Decrease" : "Increase"} ${label}`}
            disabled={delta < 0 ? value <= min : value >= max}
            key={delta}
            onClick={() => onChange(Math.min(max, Math.max(min, value + delta)))}
            type="button"
            style={{
              background: delta < 0 ? tokens.gray : tokens.gold,
              border: 0,
              borderRadius: 0,
              color: tokens.ink,
              cursor: "pointer",
              fontFamily: tokens.display,
              fontSize: 22,
              fontWeight: 700,
              height: 44,
              opacity: (delta < 0 ? value <= min : value >= max) ? 0.4 : 1,
              width: 44,
            }}
          >
            {delta < 0 ? "−" : "+"}
          </button>
        ))}
      </div>
    </div>
  )
}

export function RangeField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue = (item) => item.toLocaleString("en-US"),
  hint,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  formatValue?: (value: number) => string
  hint?: string
}) {
  const fill = ((value - min) / (max - min)) * 100
  return (
    <label style={{ display: "grid", gap: 10 }}>
      <span style={{ alignItems: "end", display: "flex", justifyContent: "space-between", gap: 16 }}>
        <span style={{ ...fieldLabelStyle(), margin: 0 }}>{label}</span>
        <strong style={{ color: tokens.brown, fontFamily: tokens.display, fontSize: 22 }}>
          {formatValue(value)}
        </strong>
      </span>
      <input
        aria-label={label}
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        style={{
          appearance: "none",
          background: `linear-gradient(90deg, var(--segc-brown) 0 ${fill}%, #E5E0D9 ${fill}% 100%)`,
          borderRadius: 0,
          height: 5,
          margin: "10px 0",
          width: "100%",
        }}
        type="range"
        value={value}
      />
      {hint && <span style={{ color: tokens.muted, fontFamily: tokens.body, fontSize: 12 }}>{hint}</span>}
    </label>
  )
}

export function TierCards({
  value,
  onChange,
  prices,
}: {
  value: string
  onChange: (value: string) => void
  prices: Record<string, number>
}) {
  const options = [
    ["essential", "Essential", "Proven selections and disciplined value."],
    ["signature", "Signature", "SEGC’s balanced custom-home standard."],
    ["bespoke", "Bespoke", "Premium materials and architectural detail."],
  ]
  return (
    <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
      <legend style={fieldLabelStyle()}>Finish level</legend>
      <div className="segc-grid-3">
        {options.map(([id, label, sub]) => {
          const active = id === value
          return (
            <button
              aria-pressed={active}
              key={id}
              onClick={() => onChange(id)}
              type="button"
              style={{
                background: active ? tokens.brown : tokens.white,
                border: `1px solid ${active ? tokens.brown : "#DED9D2"}`,
                borderRadius: tokens.radTag,
                color: active ? tokens.white : tokens.ink,
                cursor: "pointer",
                minHeight: 140,
                padding: 18,
                textAlign: "left",
              }}
            >
              <span
                style={{ display: "block", fontFamily: tokens.display, fontSize: 22, fontWeight: 700, textTransform: "uppercase" }}
              >
                {label}
              </span>
              <span
                style={{ color: tokens.gold, display: "block", fontFamily: tokens.display, fontSize: 13, fontWeight: 700, margin: "8px 0" }}
              >
                {fmt(prices[id])} / SQ FT
              </span>
              <span style={{ display: "block", fontFamily: tokens.body, fontSize: 12, lineHeight: 1.45, opacity: 0.72 }}>
                {sub}
              </span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export interface SwatchChoice extends Choice {
  color: string
  cost?: number
  image?: string
}

export function SwatchGrid({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: SwatchChoice[]
  onChange: (value: string) => void
}) {
  return (
    <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
      <legend style={fieldLabelStyle()}>{label}</legend>
      <div className="segc-grid-4">
        {options.map((option) => {
          const active = value === option.value
          return (
            <button
              aria-pressed={active}
              key={option.value}
              onClick={() => onChange(option.value)}
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
                  background: option.image ? `url(${option.image}) center / cover, ${option.color}` : option.color,
                  display: "block",
                  height: 68,
                }}
              />
              <span style={{ display: "block", padding: "10px 11px 12px" }}>
                <strong style={{ display: "block", fontFamily: tokens.display, fontSize: 13, textTransform: "uppercase" }}>
                  {option.label}
                </strong>
                <span
                  style={{
                    color: option.cost ? tokens.brown : tokens.muted,
                    display: "block",
                    fontFamily: tokens.body,
                    fontSize: 11,
                    marginTop: 4,
                  }}
                >
                  {option.cost ? `+${fmt(option.cost)}` : "Included"}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

/* ---------- panels ---------- */

export function SpecPanel({
  title = "YOUR BUILD SPEC",
  rows,
  estimate,
  unlocked = false,
  children,
}: {
  title?: string
  rows: [string, string][]
  estimate: string
  unlocked?: boolean
  children?: ReactNode
}) {
  return (
    <aside
      className="segc-spec"
      style={{ background: tokens.brown, borderRadius: tokens.radCard, color: tokens.warm, overflow: "hidden" }}
    >
      <div style={{ padding: "26px 24px" }}>
        <PreHeader>{title}</PreHeader>
        <div style={{ marginTop: 22 }}>
          {rows.map(([key, value]) => (
            <div
              key={key}
              style={{
                alignItems: "baseline",
                borderBottom: "1px dashed rgba(255,251,245,.2)",
                display: "flex",
                gap: 16,
                justifyContent: "space-between",
                padding: "11px 0",
              }}
            >
              <span style={{ fontFamily: tokens.body, fontSize: 12, opacity: 0.64 }}>{key}</span>
              <strong style={{ fontFamily: tokens.display, fontSize: 13, textAlign: "right", textTransform: "uppercase" }}>
                {value}
              </strong>
            </div>
          ))}
        </div>
        {children}
        <div style={{ marginTop: 24 }}>
          <span style={{ ...preHeaderStyle(), display: "block", marginBottom: 10 }}>■ ESTIMATED RANGE ■</span>
          <strong
            aria-label={unlocked ? estimate : "Complete the form to unlock"}
            style={{
              display: "block",
              filter: unlocked ? "none" : "blur(8px)",
              fontFamily: tokens.display,
              fontSize: "clamp(24px, 4vw, 34px)",
              lineHeight: 1,
              userSelect: unlocked ? "auto" : "none",
            }}
          >
            {estimate}
          </strong>
          <span style={{ display: "block", fontFamily: tokens.body, fontSize: 11, marginTop: 10, opacity: 0.55 }}>
            {unlocked ? "Directional planning range" : "Complete the form to unlock"}
          </span>
        </div>
      </div>
    </aside>
  )
}

export function BreakdownCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div style={{ ...cardStyle(), boxShadow: "none" }}>
      <h3 style={{ fontFamily: tokens.display, fontSize: 21, margin: "0 0 16px", textTransform: "uppercase" }}>{title}</h3>
      {rows.map(([key, value]) => (
        <div
          key={key}
          style={{
            borderBottom: "1px dashed #D7D0C8",
            display: "flex",
            fontFamily: tokens.body,
            fontSize: 13,
            gap: 14,
            justifyContent: "space-between",
            padding: "10px 0",
          }}
        >
          <span>{key}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  )
}

export function PdfConfirmStrip({ email, name }: { email: string; name: string }) {
  return (
    <div
      style={{
        background: "rgba(244,178,20,.08)",
        border: "1px dashed var(--segc-gold)",
        borderRadius: tokens.radTag,
        color: tokens.ink,
        fontFamily: tokens.body,
        fontSize: 13,
        lineHeight: 1.45,
        padding: "14px 16px",
      }}
    >
      <strong style={{ fontFamily: tokens.display, textTransform: "uppercase" }}>⚑ CHECK YOUR INBOX — </strong>
      We just emailed your {name} to {email}.
    </div>
  )
}

export function NextModuleCard({
  title,
  carried,
  href,
  cta,
}: {
  title: string
  carried: string
  href: string
  cta: string
}) {
  return (
    <a
      href={href}
      style={{
        ...cardStyle(),
        alignItems: "center",
        display: "flex",
        flexWrap: "wrap",
        gap: 18,
        justifyContent: "space-between",
        textDecoration: "none",
      }}
    >
      <span>
        <span style={{ ...preHeaderStyle(tokens.brownMid), display: "block", marginBottom: 8 }}>■ KEEP PLANNING ■</span>
        <strong
          style={{
            color: tokens.ink,
            display: "block",
            fontFamily: tokens.display,
            fontSize: 22,
            letterSpacing: "-0.6px",
            textTransform: "uppercase",
          }}
        >
          {title}
        </strong>
        <span style={{ color: tokens.muted, display: "block", fontFamily: tokens.body, fontSize: 13, marginTop: 6 }}>
          {carried}
        </span>
      </span>
      <span style={{ ...btnPrimaryStyle(), display: "inline-block" }}>{cta}</span>
    </a>
  )
}

/* ---------- gate ---------- */

const inputStyle: CSSProperties = {
  background: tokens.white,
  border: "1px solid #CFC9C1",
  borderRadius: tokens.radTag,
  color: tokens.ink,
  fontFamily: tokens.body,
  fontSize: 15,
  minHeight: 50,
  padding: "13px 14px",
  width: "100%",
}

export function Gate({
  onSubmit,
  submitLabel = "UNLOCK MY RESULT ›",
  pending = false,
  error,
}: {
  onSubmit: (contact: Contact) => void
  submitLabel?: string
  pending?: boolean
  error?: string | null
}) {
  const [contact, setContact] = useState<Contact>({ name: "", email: "", phone: "", consent: false })
  const [attempted, setAttempted] = useState(false)
  const validName = contact.name.trim().length >= 2
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())
  const validPhone = contact.phone.replace(/\D/g, "").length >= 10
  const valid = validName && validEmail && validPhone && contact.consent

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAttempted(true)
    if (valid && !pending)
      onSubmit({ ...contact, name: contact.name.trim(), email: contact.email.trim(), phone: contact.phone.trim() })
  }

  const errText = (msg: string) => (
    <span style={{ color: tokens.error, fontFamily: tokens.body, fontSize: 11 }}>{msg}</span>
  )

  return (
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
          {attempted && !validName && errText("Enter your full name.")}
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
          {attempted && !validEmail && errText("Enter a valid email.")}
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
        {attempted && !validPhone && errText("Enter a 10-digit phone number.")}
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
      {attempted && !contact.consent && errText("Consent is required to send your result.")}
      {error && errText(error)}
      <button disabled={pending} type="submit" style={{ ...btnPrimaryStyle(), opacity: pending ? 0.6 : 1, width: "100%" }}>
        {pending ? "UNLOCKING…" : submitLabel}
      </button>
    </form>
  )
}

/* ---------- funnel + frame ---------- */

function withParams(url: string, params: Record<string, string>) {
  if (!url) return "#"
  const encoded = new URLSearchParams(params).toString()
  return `${url}${url.includes("?") ? "&" : "?"}${encoded}`
}

export function FunnelBlock({
  bookingUrl,
  briefUrl,
  contact,
  tool,
  headlineResult,
  timeline,
}: {
  bookingUrl: string
  briefUrl: string
  contact: Contact
  tool: string
  headlineResult: string
  timeline: string
}) {
  const timelineLine =
    timeline === "asap"
      ? "You said you’re ready now — grab a slot this week."
      : timeline === "explore"
        ? "No pressure — the brief takes 4 minutes."
        : "Bring your numbers. We’ll help turn them into a build plan."
  return (
    <section
      style={{ background: tokens.brown, borderRadius: tokens.radCard, color: tokens.warm, padding: "clamp(24px, 5vw, 44px)" }}
    >
      <PreHeader>WHAT HAPPENS NEXT</PreHeader>
      <h3
        style={{
          fontFamily: tokens.display,
          fontSize: "clamp(30px, 5vw, 48px)",
          letterSpacing: "-1.4px",
          lineHeight: 1,
          margin: "14px 0 10px",
          textTransform: "uppercase",
        }}
      >
        TURN THIS INTO A REAL PLAN.
      </h3>
      <p style={{ fontFamily: tokens.body, fontSize: 14, lineHeight: 1.5, margin: "0 0 22px", opacity: 0.72 }}>
        {timelineLine}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <a
          href={withParams(bookingUrl, { name: contact.name, email: contact.email })}
          style={{ ...btnPrimaryStyle(), textDecoration: "none" }}
        >
          BOOK A FREE DESIGN CONSULTATION ›
        </a>
        <a
          href={withParams(briefUrl, { tool, headline_result: headlineResult, timeline })}
          style={{ ...btnGhostStyle(tokens.warm), textDecoration: "none" }}
        >
          START YOUR PROJECT BRIEF ›
        </a>
      </div>
    </section>
  )
}

export function ToolFrame({
  heading,
  sub,
  showTrustBadges = true,
  children,
}: {
  heading: string
  sub: string
  showTrustBadges?: boolean
  children: ReactNode
}) {
  return (
    <div
      style={{
        background: tokens.cream,
        color: tokens.ink,
        fontFamily: tokens.body,
        overflow: "hidden",
        position: "relative",
        width: "100%",
      }}
    >
      <header className="segc-hero" style={{ margin: "0 auto", maxWidth: 1180, padding: "64px 28px 34px" }}>
        <PreHeader>FREE PLANNING TOOL</PreHeader>
        <h1 style={{ ...h1Style(), marginTop: 14 }}>{heading}</h1>
        <p
          style={{
            color: "#5E574F",
            fontFamily: tokens.body,
            fontSize: 16,
            lineHeight: 1.55,
            margin: "18px 0 22px",
            maxWidth: "58ch",
          }}
        >
          {sub}
        </p>
        {showTrustBadges && <TrustBadges />}
      </header>
      <main style={{ margin: "0 auto", maxWidth: 1180, padding: "0 28px 72px" }}>{children}</main>
    </div>
  )
}

export function ToolNavigation({
  step,
  total,
  onBack,
  onNext,
  nextLabel,
}: {
  step: number
  total: number
  onBack: () => void
  onNext: () => void
  nextLabel?: string
}) {
  return (
    <div style={{ alignItems: "center", display: "flex", gap: 12, justifyContent: "space-between", marginTop: 30 }}>
      <button
        disabled={step === 0}
        onClick={onBack}
        type="button"
        style={{ ...btnGhostStyle(tokens.ink), opacity: step === 0 ? 0.35 : 1 }}
      >
        ‹ BACK
      </button>
      <button onClick={onNext} type="button" style={btnPrimaryStyle()}>
        {nextLabel ?? (step === total - 1 ? "UNLOCK MY RESULT ›" : "NEXT ›")}
      </button>
    </div>
  )
}

"use client"

// Home Style Quiz — 8 image questions, auto-advancing, zero math.
// Lowest-friction module; ends at the same gate + funnel as everything else.

import { useMemo, useState } from "react"
import { scoreStyleQuiz, STYLE_PROFILES, type StyleId } from "@segc/engines"
import {
  BreakdownCard,
  btnGhostStyle,
  cardStyle,
  fieldLabelStyle,
  FunnelBlock,
  NextModuleCard,
  PdfConfirmStrip,
  PillGroup,
  ProgressBar,
  StepShell,
  tokens,
  ToolFrame,
} from "@segc/ui"
import { useUnlock } from "@/components/shared/useUnlock"
import { GateStep } from "@/components/shared/GateStep"
import { QUIZ } from "./quizData"

// 8 questions + timeline/gate screen
const TOTAL_STEPS = QUIZ.length + 1

export function StyleQuizFlow() {
  const [step, setStep] = useState(0)
  const [picks, setPicks] = useState<(string | null)[]>(Array(QUIZ.length).fill(null))
  const [timeline, setTimeline] = useState("explore")
  const { unlocked, pending, gateError, unlock, lead } = useUnlock("style")

  const answers = useMemo(
    () =>
      picks.map((pick, index) => {
        const answer = QUIZ[index].answers.find((a) => a.id === pick)
        return (answer?.weights ?? {}) as Partial<Record<StyleId, number>>
      }),
    [picks],
  )
  const answered = picks.filter(Boolean).length
  const live = answered > 0 ? scoreStyleQuiz(answers.slice(0, answered)) : null

  function pick(questionIndex: number, answerId: string) {
    setPicks((current) => {
      const next = [...current]
      next[questionIndex] = answerId
      return next
    })
    // auto-advance — no Next button on quiz taps
    window.setTimeout(() => setStep((current) => Math.min(TOTAL_STEPS - 1, current + 1)), 180)
  }

  if (unlocked) {
    const firstName = unlocked.lead.name.split(" ")[0] || unlocked.lead.name
    const final = scoreStyleQuiz(answers)
    const primary = STYLE_PROFILES[final.primary]
    const secondary = STYLE_PROFILES[final.secondary]
    return (
      <ToolFrame
        heading="YOUR ARCHITECTURAL IDENTITY."
        sub="8 questions. Zero math. The same six styles our estimator prices — so your taste flows straight into your numbers."
      >
        <section style={{ display: "grid", gap: 22 }}>
          <div style={{ ...cardStyle(), background: tokens.brown, color: tokens.white }}>
            <span style={{ color: tokens.gold, fontFamily: tokens.display, fontSize: 13, fontWeight: 700 }}>
              ■ {firstName.toUpperCase()}, YOU ARE ■
            </span>
            <h2
              style={{
                fontFamily: tokens.display,
                fontSize: "clamp(34px, 6vw, 64px)",
                letterSpacing: "-2px",
                lineHeight: 1,
                margin: "14px 0 8px",
                textTransform: "uppercase",
              }}
            >
              {final.percentage}% {primary.name}
            </h2>
            <p style={{ fontFamily: tokens.body, margin: 0, opacity: 0.68 }}>
              …with a {secondary.name} streak.
            </p>
          </div>
          <PdfConfirmStrip email={unlocked.lead.email} name="style profile" />
          <div className="segc-grid-2">
            <BreakdownCard title="Your Style DNA" rows={primary.dna.map((line, i) => [`0${i + 1}`, line] as [string, string])} />
            <BreakdownCard
              title="Signatures We Build Into It"
              rows={primary.signatures.map((line, i) => [`0${i + 1}`, line] as [string, string])}
            />
          </div>
          <NextModuleCard
            title={`SEE WHAT A ${primary.name.toUpperCase()} COSTS`}
            carried="One tap — the estimator opens with your style preselected."
            href={`/plan/estimator?style=${final.primary}`}
            cta="PRICE MY STYLE ›"
          />
          <FunnelBlock
            bookingUrl={process.env.NEXT_PUBLIC_CAL_LINK ?? "https://southeasterngc.com/contact"}
            briefUrl="/plan/brief"
            contact={{ name: unlocked.lead.name, email: unlocked.lead.email, phone: "", consent: true }}
            tool="style"
            headlineResult={unlocked.headline}
            timeline={timeline}
          />
        </section>
      </ToolFrame>
    )
  }

  const isGate = step === QUIZ.length

  return (
    <ToolFrame
      heading="8 QUESTIONS. YOUR ARCHITECTURAL IDENTITY."
      sub="No square footage. No budgets. Just taps — and we'll name the style you've been circling for years."
    >
      <ProgressBar current={step} total={TOTAL_STEPS} />
      <div style={{ marginTop: 24 }}>
        <div className="segc-card" style={{ ...cardStyle(), maxWidth: 860, margin: "0 auto" }}>
          {isGate ? (
            <StepShell
              key="gate"
              step={QUIZ.length}
              total={TOTAL_STEPS}
              title="YOUR STYLE IS READY."
              sub="One last thing — where should we send your style profile?"
            >
              <PillGroup
                label="When do you want to build?"
                value={timeline}
                onChange={setTimeline}
                columns={4}
                options={[
                  { value: "asap", label: "ASAP" },
                  { value: "0-6", label: "0–6 months" },
                  { value: "6-12", label: "6–12 months" },
                  { value: "explore", label: "Just exploring" },
                ]}
              />
              <GateStep
                lead={lead}
                pending={pending}
                error={gateError}
                onUnlock={(contact) => void unlock(contact, { answers, timeline }, { timeline })}
              />
            </StepShell>
          ) : (
            <section aria-labelledby={`quiz-q-${step}`} className="segc-step-enter" key={QUIZ[step].id}>
              <div style={{ color: tokens.brown, fontFamily: tokens.display, fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: "uppercase" }}>
                ■ QUESTION {step + 1} / {QUIZ.length} ■
              </div>
              <h2
                id={`quiz-q-${step}`}
                style={{
                  color: tokens.ink,
                  fontFamily: tokens.display,
                  fontSize: "clamp(26px, 4vw, 40px)",
                  fontWeight: 700,
                  letterSpacing: "-1.2px",
                  lineHeight: 1,
                  margin: 0,
                  textTransform: "uppercase",
                }}
              >
                {QUIZ[step].prompt}
              </h2>
              <p style={{ color: "#5E574F", fontFamily: tokens.body, fontSize: 14, margin: "10px 0 22px" }}>
                {QUIZ[step].sub}
              </p>
              <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
                <legend style={{ ...fieldLabelStyle(), position: "absolute", clip: "rect(0 0 0 0)" }}>
                  {QUIZ[step].prompt}
                </legend>
                <div className="segc-grid-2">
                  {QUIZ[step].answers.map((answer) => {
                    const active = picks[step] === answer.id
                    return (
                      <button
                        aria-pressed={active}
                        key={answer.id}
                        onClick={() => pick(step, answer.id)}
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
                            background: answer.image
                              ? `url(${answer.image}) center / cover, ${answer.art}`
                              : answer.art,
                            display: "block",
                            height: 130,
                          }}
                        />
                        <span style={{ display: "block", padding: "12px 14px 14px" }}>
                          <strong style={{ display: "block", fontFamily: tokens.display, fontSize: 15, textTransform: "uppercase" }}>
                            {answer.label}
                          </strong>
                          {answer.sub && (
                            <span style={{ color: tokens.muted, display: "block", fontFamily: tokens.body, fontSize: 12, marginTop: 4 }}>
                              {answer.sub}
                            </span>
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>
              {step > 0 && (
                <button
                  onClick={() => setStep((value) => Math.max(0, value - 1))}
                  type="button"
                  style={{ ...btnGhostStyle(tokens.ink), marginTop: 24 }}
                >
                  ‹ BACK
                </button>
              )}
            </section>
          )}
        </div>
        {live && !isGate && (
          <p style={{ fontFamily: tokens.body, fontSize: 12.5, margin: "16px auto 0", maxWidth: 860, opacity: 0.6, textAlign: "left" }}>
            Trending: <strong style={{ fontFamily: tokens.display, textTransform: "uppercase" }}>{STYLE_PROFILES[live.primary].name}</strong>
            {answered > 2 ? ` with ${STYLE_PROFILES[live.secondary].name} tendencies…` : "…"}
          </p>
        )}
      </div>
    </ToolFrame>
  )
}

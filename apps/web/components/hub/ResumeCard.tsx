"use client"

// "Resume my Build Plan" — email-entry card for returning visitors on a new device.

import { useState, type FormEvent } from "react"
import { btnPrimaryStyle, tokens } from "@segc/ui"

export function ResumeCard() {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "pending" | "sent" | "error">("idle")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setState("error")
      return
    }
    setState("pending")
    try {
      const response = await fetch("/api/resume/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      setState(response.ok ? "sent" : "error")
    } catch {
      setState("error")
    }
  }

  if (state === "sent") {
    return (
      <div
        style={{
          background: "rgba(244,178,20,.08)",
          border: `1px dashed ${tokens.gold}`,
          borderRadius: tokens.radTag,
          fontFamily: tokens.body,
          fontSize: 13.5,
          lineHeight: 1.5,
          padding: "16px 18px",
        }}
      >
        <strong style={{ fontFamily: tokens.display, textTransform: "uppercase" }}>⚑ CHECK YOUR INBOX — </strong>
        if we have a Build Plan for {email.trim()}, a sign-in link is on its way. It expires in 24 hours.
      </div>
    )
  }

  return (
    <div
      style={{
        alignItems: "center",
        background: tokens.white,
        border: "1px solid rgba(69,30,0,0.09)",
        borderRadius: tokens.radCard,
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
        justifyContent: "space-between",
        padding: "22px 26px",
      }}
    >
      <div style={{ minWidth: 220 }}>
        <div style={{ color: tokens.brownMid, fontFamily: tokens.display, fontSize: 13, fontWeight: 700, textTransform: "uppercase" }}>
          ■ BEEN HERE BEFORE? ■
        </div>
        <strong style={{ display: "block", fontFamily: tokens.display, fontSize: 20, letterSpacing: "-0.5px", marginTop: 6, textTransform: "uppercase" }}>
          RESUME MY BUILD PLAN
        </strong>
        <span style={{ color: tokens.muted, display: "block", fontFamily: tokens.body, fontSize: 12.5, marginTop: 4 }}>
          We’ll email you a one-tap link — your answers and results are saved.
        </span>
      </div>
      <form noValidate onSubmit={submit} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <input
          aria-label="Email address"
          autoComplete="email"
          onChange={(event) => {
            setEmail(event.target.value)
            if (state === "error") setState("idle")
          }}
          placeholder="jane@email.com"
          type="email"
          value={email}
          style={{
            background: tokens.white,
            border: `1px solid ${state === "error" ? tokens.error : "#CFC9C1"}`,
            borderRadius: tokens.radTag,
            fontFamily: tokens.body,
            fontSize: 14,
            minHeight: 48,
            minWidth: 220,
            padding: "12px 14px",
          }}
        />
        <button disabled={state === "pending"} type="submit" style={{ ...btnPrimaryStyle(), opacity: state === "pending" ? 0.6 : 1 }}>
          {state === "pending" ? "SENDING…" : "EMAIL MY LINK ›"}
        </button>
        {state === "error" && (
          <span style={{ alignSelf: "center", color: tokens.error, fontFamily: tokens.body, fontSize: 12 }}>
            Enter a valid email and try again.
          </span>
        )}
      </form>
    </div>
  )
}

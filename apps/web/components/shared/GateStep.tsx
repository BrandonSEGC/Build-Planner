"use client"

// Shared gate: full form for new visitors, one-tap skip for recognized leads.

import { btnPrimaryStyle, Gate, tokens, type Contact } from "@segc/ui"
import type { RecognizedLead } from "@/lib/store"

export function GateStep({
  lead,
  pending,
  error,
  onUnlock,
}: {
  lead: RecognizedLead | null
  pending: boolean
  error: string | null
  onUnlock: (contact: Contact | null) => void
}) {
  if (lead) {
    return (
      <div style={{ display: "grid", gap: 18 }}>
        <p style={{ fontFamily: tokens.body, fontSize: 15, lineHeight: 1.55, margin: 0 }}>
          Welcome back, <strong>{lead.name.split(" ")[0]}</strong> — we recognize you, so no form this
          time. Your result unlocks instantly and the PDF goes to <strong>{lead.email}</strong>.
        </p>
        {error && <span style={{ color: tokens.error, fontFamily: tokens.body, fontSize: 12 }}>{error}</span>}
        <button
          disabled={pending}
          onClick={() => onUnlock(null)}
          type="button"
          style={{ ...btnPrimaryStyle(), opacity: pending ? 0.6 : 1, width: "100%" }}
        >
          {pending ? "UNLOCKING…" : "UNLOCK MY RESULT ›"}
        </button>
      </div>
    )
  }
  return <Gate onSubmit={(contact) => onUnlock(contact)} pending={pending} error={error} />
}

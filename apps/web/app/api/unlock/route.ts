// THE gate. First unlock creates the lead; later completions skip the gate
// (contact: null) and enrich the same lead. Fires fulfillment exactly once
// per module run via Inngest (durable) or inline (dev fallback).

import { NextResponse, type NextRequest } from "next/server"
import { getJourneyId } from "@/lib/journey"
import { INPUT_SCHEMAS, unlockSchema, type ToolId } from "@/lib/schemas"
import { computeModule } from "@/lib/modules"
import { verifyTurnstile } from "@/lib/integrations/turnstile"
import { inngest, inngestConfigured } from "@/lib/inngest"
import { runInlineFulfillment } from "@/lib/fulfill"
import { createModuleRun, getLead, recordEvent, upsertLead, upsertProfile } from "@/lib/repo"

// Server-side rule: every result screen recommends the next logical module.
const NEXT_MODULE: Record<ToolId, string> = {
  estimator: "affordability",
  style: "estimator",
  affordability: "land",
  land: "timeline",
  timeline: "estimator",
}

export async function POST(request: NextRequest) {
  const journeyId = await getJourneyId()
  if (!journeyId) {
    return NextResponse.json({ error: "No journey. Enable cookies and retry." }, { status: 400 })
  }

  const parsed = unlockSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 422 })
  }
  const { toolId, contact, turnstileToken } = parsed.data

  const inputsParsed = INPUT_SCHEMAS[toolId].safeParse(parsed.data.inputs)
  if (!inputsParsed.success) {
    return NextResponse.json(
      { error: "Invalid inputs", details: inputsParsed.error.flatten() },
      { status: 422 },
    )
  }
  const inputs = inputsParsed.data

  const existingLead = await getLead(journeyId)
  const returning = Boolean(existingLead)

  // New leads must pass the gate (and Turnstile when configured).
  if (!existingLead) {
    if (!contact) {
      return NextResponse.json({ error: "Contact details are required to unlock." }, { status: 401 })
    }
    const human = await verifyTurnstile(turnstileToken, request.headers.get("x-forwarded-for") ?? undefined)
    if (!human) {
      return NextResponse.json({ error: "Verification failed. Please retry." }, { status: 403 })
    }
  }

  // Compute the result server-side — the client never dictates numbers.
  const mod = computeModule(toolId, inputs)

  const lead = contact
    ? await upsertLead(journeyId, { name: contact.name, email: contact.email, phone: contact.phone })
    : existingLead!

  const run = await createModuleRun({
    journeyId,
    toolId,
    inputs,
    outputs: mod.outputs,
    headlineResult: mod.headline,
  })

  // Shared profile prefill: enter sqft once, it's everywhere.
  await upsertProfile(journeyId, mod.profilePatch)

  await recordEvent(journeyId, "lead_unlocked", { toolId, headline: mod.headline, returning })

  if (inngestConfigured()) {
    await inngest.send({
      name: "lead/unlocked",
      data: { moduleRunId: run.id, journeyId, returning },
    })
  } else {
    // Dev fallback: run the pipeline inline (stubs log to console).
    runInlineFulfillment(run.id, returning).catch((error) =>
      console.error("[unlock] inline fulfillment failed", error),
    )
  }

  return NextResponse.json({
    ok: true,
    returning,
    lead: { name: lead.name, email: lead.email },
    headline: mod.headline,
    subline: mod.subline,
    note: mod.note,
    result: mod.outputs,
    nextModule: NEXT_MODULE[toolId],
  })
}

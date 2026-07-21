// THE gate. First unlock creates the lead; later completions skip the gate
// (contact: null) and enrich the same lead. Fires fulfillment exactly once
// per module run via Inngest (durable) or inline (dev fallback).

import { NextResponse, type NextRequest } from "next/server"
import { STYLE_PROFILES } from "@segc/engines"
import { getJourneyId } from "@/lib/journey"
import { INPUT_SCHEMAS, unlockSchema, type ToolId } from "@/lib/schemas"
import { computeModule } from "@/lib/modules"
import { verifyTurnstile } from "@/lib/integrations/turnstile"
import { inngest, inngestConfigured } from "@/lib/inngest"
import { runInlineFulfillment } from "@/lib/fulfill"
import { createModuleRun, getLead, markRunFulfilled, recordEvent, upsertLead, upsertProfile } from "@/lib/repo"

// Server-side rule: every result screen recommends the next logical module.
const NEXT_MODULE: Record<ToolId, string> = {
  estimator: "affordability",
  style: "estimator",
  affordability: "land",
  land: "timeline",
  timeline: "estimator",
  plan: "brief",
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

  // Unified journey: also record per-chapter runs (pre-fulfilled — the master
  // plan drives the single PDF/email) so the dashboard lights up per chapter.
  if (toolId === "plan") {
    const outputs = mod.outputs as {
      style: { percentage: number; primary: string }
      estimate: { low: number; high: number }
      land: { low: number; high: number } | null
      afford: { low: number; high: number } | null
      schedule: { moveInStart: string; moveInEnd: string } | null
    }
    const monthYear = (iso: string) =>
      new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase()
    const chapterRuns: { toolId: string; headline: string }[] = [
      {
        toolId: "style",
        headline: `${outputs.style.percentage}% ${(
          STYLE_PROFILES[outputs.style.primary as keyof typeof STYLE_PROFILES]?.name ?? outputs.style.primary
        ).toUpperCase()}`,
      },
      { toolId: "estimator", headline: mod.headline },
      ...(outputs.land
        ? [{ toolId: "land", headline: `$${Math.round(outputs.land.low).toLocaleString()}–$${Math.round(outputs.land.high).toLocaleString()}` }]
        : []),
      ...(outputs.afford
        ? [{ toolId: "affordability", headline: `$${Math.round(outputs.afford.low).toLocaleString()}–$${Math.round(outputs.afford.high).toLocaleString()}` }]
        : []),
      ...(outputs.schedule
        ? [{ toolId: "timeline", headline: `${monthYear(outputs.schedule.moveInStart)} – ${monthYear(outputs.schedule.moveInEnd)}` }]
        : []),
    ]
    for (const chapter of chapterRuns) {
      const chapterRun = await createModuleRun({
        journeyId,
        toolId: chapter.toolId,
        inputs: { fromPlanRun: run.id },
        outputs: { fromPlanRun: run.id },
        headlineResult: chapter.headline,
      })
      await markRunFulfilled(chapterRun.id)
    }
  }

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

// Native project brief (replaces Typeform). Writes to the same DB as
// everything else — no hidden-field hacks, no data split across vendors.

import { NextResponse, type NextRequest } from "next/server"
import { briefReceivedEmail } from "@segc/emails"
import { getJourneyId } from "@/lib/journey"
import { briefSchema } from "@/lib/schemas"
import { bookingUrl } from "@/lib/fulfill"
import { sendEmail } from "@/lib/integrations/email"
import { sendSlackLeadAlert } from "@/lib/integrations/slack"
import { upsertHubspotContact } from "@/lib/integrations/hubspot"
import {
  createModuleRun,
  getLead,
  recordEvent,
  setLeadHubspotId,
  upsertLead,
  upsertProfile,
} from "@/lib/repo"

const BUDGET_LABELS: Record<string, string> = {
  "under-500k": "Under $500K",
  "500-750k": "$500–750K",
  "750k-1m": "$750K–1M",
  "over-1m": "$1M+",
  unsure: "Budget TBD",
}

export async function POST(request: NextRequest) {
  const journeyId = await getJourneyId()
  if (!journeyId) {
    return NextResponse.json({ error: "No journey. Enable cookies and retry." }, { status: 400 })
  }

  const parsed = briefSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 422 })
  }
  const brief = parsed.data

  const existingLead = await getLead(journeyId)
  if (!existingLead && !brief.contact) {
    return NextResponse.json({ error: "Contact details are required." }, { status: 401 })
  }
  const lead = brief.contact
    ? await upsertLead(journeyId, {
        name: brief.contact.name,
        email: brief.contact.email,
        phone: brief.contact.phone,
      })
    : existingLead!

  const headline = `${BUDGET_LABELS[brief.budgetRange]} · ${brief.sqft ? `${brief.sqft.toLocaleString("en-US")} sq ft` : "size TBD"} · ${brief.projectType}`

  const { contact: _contact, ...briefData } = brief
  const run = await createModuleRun({
    journeyId,
    toolId: "brief",
    inputs: briefData,
    outputs: { submitted: true },
    headlineResult: headline,
  })

  await upsertProfile(journeyId, {
    region: brief.region,
    sqft: brief.sqft || undefined,
    landStatus: brief.landStatus,
    timeline: brief.timeline,
  })
  await recordEvent(journeyId, "brief_submitted", { headline })

  // Brief fulfillment is lightweight: no PDF — confirm to the lead, alert sales, enrich CRM.
  const firstName = lead.name.split(" ")[0] || lead.name
  try {
    await sendEmail({ to: lead.email, content: briefReceivedEmail({ firstName, bookingUrl: bookingUrl() }) })
  } catch (error) {
    console.error("[brief] email failed", error)
  }
  try {
    await sendSlackLeadAlert({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      toolLabel: "Project Brief ⚑ HIGH INTENT",
      headline,
      timeline: brief.timeline,
      returning: Boolean(existingLead),
    })
  } catch (error) {
    console.error("[brief] slack failed", error)
  }
  try {
    const result = await upsertHubspotContact({
      email: lead.email,
      name: lead.name,
      phone: lead.phone,
      toolId: "brief",
      headline,
      timeline: brief.timeline,
    })
    if (result.hubspotId) await setLeadHubspotId(journeyId, result.hubspotId)
  } catch (error) {
    console.error("[brief] hubspot failed", error)
  }

  return NextResponse.json({ ok: true, lead: { name: lead.name, email: lead.email }, briefId: run.id })
}

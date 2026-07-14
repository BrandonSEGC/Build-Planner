// Shared visitor profile: read for prefill, write on step completion.

import { NextResponse, type NextRequest } from "next/server"
import { getJourneyId } from "@/lib/journey"
import { profileSchema } from "@/lib/schemas"
import { getLead, getProfile, listModuleRuns, upsertProfile } from "@/lib/repo"

export async function GET() {
  const journeyId = await getJourneyId()
  if (!journeyId) return NextResponse.json({ profile: null, lead: null, runs: [] })
  const [profile, lead, runs] = await Promise.all([
    getProfile(journeyId),
    getLead(journeyId),
    listModuleRuns(journeyId),
  ])
  return NextResponse.json({
    profile,
    lead: lead ? { name: lead.name, email: lead.email } : null,
    runs: runs.map((run) => ({
      toolId: run.toolId,
      headlineResult: run.headlineResult,
      completedAt: run.completedAt,
    })),
  })
}

export async function POST(request: NextRequest) {
  const journeyId = await getJourneyId()
  if (!journeyId) return NextResponse.json({ error: "No journey" }, { status: 400 })
  const parsed = profileSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 })
  }
  await upsertProfile(journeyId, parsed.data)
  return NextResponse.json({ ok: true })
}

import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { getJourneyId } from "@/lib/journey"
import { isToolId } from "@/lib/planner"
import { getPlanDraft, upsertPlanDraft } from "@/lib/repo"

const draftSchema = z.object({
  toolId: z.enum(["style", "estimator", "affordability", "land", "timeline"]),
  step: z.number().int().min(0).max(20),
  inputs: z.object({}).passthrough(),
})

export async function GET(request: NextRequest) {
  const journeyId = await getJourneyId()
  const toolId = request.nextUrl.searchParams.get("toolId")
  if (!journeyId || !toolId || !isToolId(toolId)) {
    return NextResponse.json({ draft: null })
  }
  return NextResponse.json({ draft: await getPlanDraft(journeyId, toolId) })
}

export async function POST(request: NextRequest) {
  const journeyId = await getJourneyId()
  if (!journeyId) return NextResponse.json({ error: "No journey" }, { status: 400 })
  const parsed = draftSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid draft" }, { status: 422 })
  }
  await upsertPlanDraft(journeyId, parsed.data)
  return NextResponse.json({ ok: true })
}

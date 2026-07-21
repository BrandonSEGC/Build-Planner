import { NextResponse } from "next/server"
import { renderPlanPdf, type PlanPdfSection } from "@segc/pdf"
import { getJourneyId } from "@/lib/journey"
import { bookingUrl, TOOL_REPORT_LABELS } from "@/lib/fulfill"
import { computeModule } from "@/lib/modules"
import { latestRunsByTool, PLAN_CHAPTERS } from "@/lib/planner"
import { getLead, listModuleRuns, recordEvent } from "@/lib/repo"

export const dynamic = "force-dynamic"

export async function GET() {
  const journeyId = await getJourneyId()
  if (!journeyId) return NextResponse.json({ error: "No saved build plan" }, { status: 401 })

  const [lead, runs] = await Promise.all([getLead(journeyId), listModuleRuns(journeyId)])
  if (!lead || runs.length === 0) {
    return NextResponse.json({ error: "Complete a planning chapter before exporting." }, { status: 409 })
  }

  const latest = latestRunsByTool(runs)
  const sections: PlanPdfSection[] = []
  for (const chapter of PLAN_CHAPTERS) {
    const run = latest.get(chapter.id)
    if (!run) continue
    const result = computeModule(chapter.id, run.inputs)
    sections.push({
      toolLabel: TOOL_REPORT_LABELS[chapter.id] ?? chapter.title,
      headline: result.headline,
      subline: result.subline,
      rows: result.rows,
      note: result.note,
      completedAt: new Date(run.completedAt).toLocaleDateString("en-US", { dateStyle: "long" }),
    })
  }

  const generatedAt = new Date().toLocaleDateString("en-US", { dateStyle: "long" })
  const pdf = await renderPlanPdf({
    name: lead.name,
    generatedAt,
    sections,
    bookingUrl: bookingUrl(),
  })
  await recordEvent(journeyId, "plan_pdf_exported", { completedChapters: sections.length })

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": 'attachment; filename="SEGC-build-plan.pdf"',
      "Content-Type": "application/pdf",
    },
  })
}

import { redirect } from "next/navigation"
import { getJourneyId } from "@/lib/journey"
import { getPlanChapter, nextIncompleteChapter } from "@/lib/planner"
import { getLatestPlanDraft, listModuleRuns } from "@/lib/repo"

export const dynamic = "force-dynamic"

export default async function ContinuePlanPage({
  searchParams,
}: {
  searchParams: Promise<{ resumed?: string }>
}) {
  const { resumed } = await searchParams
  const journeyId = await getJourneyId()
  const [runs, draft] = journeyId
    ? await Promise.all([listModuleRuns(journeyId), getLatestPlanDraft(journeyId)])
    : [[], null]
  const draftChapter = draft ? getPlanChapter(draft.toolId) : null
  const nextChapter = draftChapter ?? nextIncompleteChapter(runs)

  if (!nextChapter) redirect(`/plan${resumed === "1" ? "?resumed=1" : "?complete=1"}`)
  redirect(`${nextChapter.href}${resumed === "1" ? "?resumed=1" : ""}`)
}

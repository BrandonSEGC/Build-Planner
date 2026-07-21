import type { Metadata } from "next"
import { JourneyFlow } from "@/components/journey/JourneyFlow"

export const metadata: Metadata = {
  title: "Custom Home Build Timeline Estimator",
  description:
    "When can you move in? A phase-by-phase construction timeline — part of The SEGC Build Planner journey.",
}

// SEO entry door — drops the visitor into the unified journey at the timeline chapter.
export default function Page() {
  return <JourneyFlow initialChapter="timeline" />
}

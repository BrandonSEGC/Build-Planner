import type { Metadata } from "next"
import { JourneyFlow } from "@/components/journey/JourneyFlow"

export const metadata: Metadata = {
  title: "Land + Build All-In Cost Estimator",
  description:
    "Land, site work, build, and soft costs in one all-in number — part of The SEGC Build Planner journey.",
}

// SEO entry door — drops the visitor into the unified journey at the land chapter.
export default function Page() {
  return <JourneyFlow initialChapter="land" />
}

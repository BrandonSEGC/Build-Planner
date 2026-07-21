import type { Metadata } from "next"
import { JourneyFlow } from "@/components/journey/JourneyFlow"

export const metadata: Metadata = {
  title: "Custom Home Cost Calculator",
  description:
    "Design your North Carolina custom home — footprint, finishes, features — inside The SEGC Build Planner: one journey, one Master Build Plan.",
}

// SEO entry door — drops the visitor into the unified journey at the home chapter.
export default function Page() {
  return <JourneyFlow initialChapter="home" />
}

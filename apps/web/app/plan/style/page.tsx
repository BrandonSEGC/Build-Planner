import type { Metadata } from "next"
import { JourneyFlow } from "@/components/journey/JourneyFlow"

export const metadata: Metadata = {
  title: "Home Style Quiz",
  description:
    "8 questions. Your architectural identity. Zero math — the opening chapter of The SEGC Build Planner.",
}

// SEO entry door — drops the visitor into the unified journey at the style chapter.
export default function Page() {
  return <JourneyFlow initialChapter="style" />
}

import type { Metadata } from "next"
import { JourneyFlow } from "@/components/journey/JourneyFlow"

export const metadata: Metadata = {
  title: "Construction Loan & Affordability Calculator",
  description:
    "See what you can build before you talk to a lender — VA, FHA, conventional, construction-to-perm — inside The SEGC Build Planner.",
}

// SEO entry door — drops the visitor into the unified journey at the money chapter.
export default function Page() {
  return <JourneyFlow initialChapter="money" />
}

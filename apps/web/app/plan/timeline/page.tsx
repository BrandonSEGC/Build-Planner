import type { Metadata } from "next"
import { TimelineFlow } from "@/components/timeline/TimelineFlow"

export const metadata: Metadata = {
  title: "Custom Home Build Timeline Estimator",
  description:
    "When can you move in? Get a phase-by-phase custom home construction timeline for North Carolina — design, permits, sitework, framing, finishes — with an honest move-in window.",
}

export default function TimelinePage() {
  return <TimelineFlow />
}

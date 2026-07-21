import type { Metadata } from "next"
import { JourneyFlow } from "@/components/journey/JourneyFlow"

export const metadata: Metadata = {
  title: "Plan Your Entire Build",
  description:
    "One guided journey: your style, your home, your land, your budget, and your timeline — ending in one Master Build Plan for your North Carolina custom home.",
}

export default function JourneyPage() {
  return <JourneyFlow />
}

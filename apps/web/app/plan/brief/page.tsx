import type { Metadata } from "next"
import { BriefFlow } from "@/components/brief/BriefFlow"

export const metadata: Metadata = {
  title: "Start Your Project Brief",
  description:
    "Four minutes, no pressure. Tell South Eastern General Contractors what you're building — your brief lands directly with the team that will build it.",
}

export default function BriefPage() {
  return <BriefFlow />
}

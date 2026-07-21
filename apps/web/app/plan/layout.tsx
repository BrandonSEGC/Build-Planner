import type { ReactNode } from "react"
import { PlanJourneyHeader } from "@/components/shared/PlanJourneyHeader"

export default function PlanLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PlanJourneyHeader />
      {children}
    </>
  )
}

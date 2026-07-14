import type { Metadata } from "next"
import { AffordabilityFlow } from "@/components/affordability/AffordabilityFlow"

export const metadata: Metadata = {
  title: "Construction Loan & Affordability Calculator",
  description:
    "See what you can build before you talk to a lender. Educational construction-loan math for North Carolina — VA, FHA, conventional, and construction-to-perm.",
}

export default function AffordabilityPage() {
  return <AffordabilityFlow />
}

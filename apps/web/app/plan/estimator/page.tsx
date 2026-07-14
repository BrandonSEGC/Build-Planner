import type { Metadata } from "next"
import { EstimatorFlow } from "@/components/estimator/EstimatorFlow"

export const metadata: Metadata = {
  title: "Custom Home Cost Calculator",
  description:
    "Design your North Carolina custom home — footprint, finishes, features — and get a real planning range with a full breakdown, free.",
}

export default function EstimatorPage() {
  return <EstimatorFlow />
}

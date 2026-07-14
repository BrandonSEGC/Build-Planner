import type { Metadata } from "next"
import { LandBuildFlow } from "@/components/land/LandBuildFlow"

export const metadata: Metadata = {
  title: "Land + Build All-In Cost Estimator",
  description:
    "Most builders quote the house. We quote the whole picture — land, site work, build, and soft costs for your North Carolina custom home, in one all-in number.",
}

export default function LandBuildPage() {
  return <LandBuildFlow />
}

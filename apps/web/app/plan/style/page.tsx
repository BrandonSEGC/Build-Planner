import type { Metadata } from "next"
import { StyleQuizFlow } from "@/components/style/StyleQuizFlow"

export const metadata: Metadata = {
  title: "Home Style Quiz",
  description:
    "8 questions. Your architectural identity. Zero math. Discover whether you're Modern Farmhouse, Lowcountry, Craftsman, Modern, Traditional Brick, or Transitional.",
}

export default function StyleQuizPage() {
  return <StyleQuizFlow />
}

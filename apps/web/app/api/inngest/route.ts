import { serve } from "inngest/next"
import { inngest, leadUnlocked } from "@/lib/inngest"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [leadUnlocked],
})

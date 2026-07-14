// Inngest — the Zapier replacement. Durable, retryable fulfillment per step.
// Step IDs are keyed on the module_run so retries stay idempotent.

import { EventSchemas, Inngest } from "inngest"
import {
  loadContext,
  stepHubspot,
  stepMarkFulfilled,
  stepRenderPdf,
  stepSendEmail,
  stepSlackAlert,
  stepStorePdf,
} from "./fulfill"

type Events = {
  "lead/unlocked": {
    data: {
      moduleRunId: string
      journeyId: string
      returning: boolean
    }
  }
}

export const inngest = new Inngest({
  id: "segc-build-planner",
  schemas: new EventSchemas().fromRecord<Events>(),
})

export function inngestConfigured(): boolean {
  return Boolean(process.env.INNGEST_EVENT_KEY && process.env.INNGEST_SIGNING_KEY)
}

export const leadUnlocked = inngest.createFunction(
  { id: "lead-unlocked-fulfillment", retries: 3 },
  { event: "lead/unlocked" },
  async ({ event, step }) => {
    const { moduleRunId, returning } = event.data

    const ctx = await step.run(`load-${moduleRunId}`, () => loadContext(moduleRunId))
    if (ctx.run.fulfilledAt) return { skipped: "already fulfilled" }

    const pdfBase64 = await step.run(`pdf-${moduleRunId}`, async () => {
      const pdf = await stepRenderPdf(ctx)
      return pdf.toString("base64")
    })
    const pdf = Buffer.from(pdfBase64, "base64")

    const pdfUrl = await step.run(`store-${moduleRunId}`, () => stepStorePdf(ctx, pdf))

    await step.run(`email-${moduleRunId}`, () => stepSendEmail(ctx, pdf, pdfUrl))
    await step.run(`slack-${moduleRunId}`, () => stepSlackAlert(ctx, returning))
    await step.run(`hubspot-${moduleRunId}`, () => stepHubspot(ctx))
    await step.run(`fulfilled-${moduleRunId}`, () => stepMarkFulfilled(ctx))

    return { fulfilled: moduleRunId }
  },
)

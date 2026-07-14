// Fulfillment pipeline for an unlocked module run:
// PDF → R2 → email → Slack → HubSpot → mark fulfilled.
// Each step is exported separately so the Inngest function can wrap them in
// durable, retryable step.run() calls; runInlineFulfillment() chains them for
// dev / no-Inngest environments. All steps are idempotent per module_run.

import { computeHomeEstimate, fmt, HOME_CONFIG, STYLE_PROFILES, type HomeEstimateState } from "@segc/engines"
import { estimateResultEmail } from "@segc/emails"
import { renderEstimatePdf } from "@segc/pdf"
import { sendEmail } from "./integrations/email"
import { sendSlackLeadAlert } from "./integrations/slack"
import { upsertHubspotContact } from "./integrations/hubspot"
import { uploadPdf } from "./integrations/r2"
import {
  addDocument,
  getLead,
  getModuleRun,
  markRunFulfilled,
  setLeadHubspotId,
  type LeadRecord,
  type ModuleRunRecord,
} from "./repo"

export const TOOL_LABELS: Record<string, string> = {
  estimator: "Custom Home Cost Estimator",
  affordability: "Affordability Calculator",
  land: "Land + Build Estimator",
  style: "Home Style Quiz",
  timeline: "Build Timeline Estimator",
}

export function bookingUrl(): string {
  return process.env.NEXT_PUBLIC_CAL_LINK ?? "https://southeasterngc.com/contact"
}

export function briefUrl(): string {
  return "/plan/brief" // native brief lands in phase 4; route exists as a stub
}

export interface FulfillmentContext {
  run: ModuleRunRecord
  lead: LeadRecord
}

export async function loadContext(moduleRunId: string): Promise<FulfillmentContext> {
  const run = await getModuleRun(moduleRunId)
  if (!run) throw new Error(`module_run ${moduleRunId} not found`)
  const lead = await getLead(run.journeyId)
  if (!lead) throw new Error(`lead for journey ${run.journeyId} not found`)
  return { run, lead }
}

/** Step 1 — render the branded PDF for this run. */
export async function stepRenderPdf(ctx: FulfillmentContext): Promise<Buffer> {
  const { run, lead } = ctx
  if (run.toolId !== "estimator") throw new Error(`No PDF template yet for tool ${run.toolId}`)
  const state = run.inputs as HomeEstimateState
  const estimate = computeHomeEstimate(state)
  const regionName = HOME_CONFIG.regions.find((r) => r.id === state.region)?.name ?? state.region
  const styleName =
    STYLE_PROFILES[state.style as keyof typeof STYLE_PROFILES]?.name ?? state.style
  return renderEstimatePdf({
    name: lead.name,
    headline: run.headlineResult,
    psfEff: estimate.psfEff,
    regionName,
    styleName,
    timeline: state.timeline,
    sqft: state.sqft,
    breakdown: [
      ["Base construction", estimate.shell],
      ["Garage + program", estimate.garage + estimate.bonus + estimate.porch],
      ["Finishes + features", estimate.interiorAdds],
      ["Site work", estimate.site],
      ["Soft costs + contingency", estimate.soft + estimate.contingency],
      ["Estimated midpoint", estimate.total],
    ],
    bookingUrl: bookingUrl(),
    briefUrl: briefUrl(),
    generatedAt: new Date().toLocaleDateString("en-US", { dateStyle: "long" }),
  })
}

/** Step 2 — persist the PDF to R2 and record the document row. */
export async function stepStorePdf(ctx: FulfillmentContext, pdf: Buffer): Promise<string | null> {
  const key = `estimates/${ctx.run.id}.pdf`
  const url = await uploadPdf(key, pdf)
  if (url) await addDocument(ctx.run.id, url, "custom-home-estimate")
  return url
}

/** Step 3 — email the result (PDF attached + linked when hosted). */
export async function stepSendEmail(
  ctx: FulfillmentContext,
  pdf: Buffer,
  pdfUrl: string | null,
): Promise<void> {
  const { run, lead } = ctx
  const state = run.inputs as HomeEstimateState
  const estimate = computeHomeEstimate(state)
  const regionName = HOME_CONFIG.regions.find((r) => r.id === state.region)?.name ?? state.region
  const styleName =
    STYLE_PROFILES[state.style as keyof typeof STYLE_PROFILES]?.name ?? state.style
  const firstName = lead.name.split(" ")[0] || lead.name
  const content = estimateResultEmail({
    firstName,
    headline: run.headlineResult,
    psf: fmt(estimate.psfEff),
    regionName,
    styleName,
    pdfUrl,
    bookingUrl: bookingUrl(),
    briefUrl: briefUrl(),
  })
  await sendEmail({
    to: lead.email,
    content,
    attachment: { filename: "SEGC-Custom-Home-Estimate.pdf", content: pdf },
  })
}

/** Step 4 — Slack sales alert. */
export async function stepSlackAlert(ctx: FulfillmentContext, returning: boolean): Promise<void> {
  const state = ctx.run.inputs as HomeEstimateState
  await sendSlackLeadAlert({
    name: ctx.lead.name,
    phone: ctx.lead.phone,
    email: ctx.lead.email,
    toolLabel: TOOL_LABELS[ctx.run.toolId] ?? ctx.run.toolId,
    headline: ctx.run.headlineResult,
    timeline: state.timeline ?? "unknown",
    returning,
  })
}

/** Step 5 — HubSpot contact upsert. */
export async function stepHubspot(ctx: FulfillmentContext): Promise<void> {
  const state = ctx.run.inputs as HomeEstimateState
  const result = await upsertHubspotContact({
    email: ctx.lead.email,
    name: ctx.lead.name,
    phone: ctx.lead.phone,
    toolId: ctx.run.toolId,
    headline: ctx.run.headlineResult,
    timeline: state.timeline ?? "unknown",
  })
  if (result.hubspotId) await setLeadHubspotId(ctx.run.journeyId, result.hubspotId)
}

/** Step 6 — mark the run fulfilled. */
export async function stepMarkFulfilled(ctx: FulfillmentContext): Promise<void> {
  await markRunFulfilled(ctx.run.id)
}

/** Dev / no-Inngest path: run every step inline. Individual integration
 *  failures are logged but don't block the rest of the pipeline. */
export async function runInlineFulfillment(moduleRunId: string, returning: boolean): Promise<void> {
  const ctx = await loadContext(moduleRunId)
  if (ctx.run.fulfilledAt) return // idempotent
  let pdf: Buffer | null = null
  let pdfUrl: string | null = null
  try {
    pdf = await stepRenderPdf(ctx)
    pdfUrl = await stepStorePdf(ctx, pdf)
  } catch (error) {
    console.error("[fulfill] pdf failed", error)
  }
  if (pdf) {
    try {
      await stepSendEmail(ctx, pdf, pdfUrl)
    } catch (error) {
      console.error("[fulfill] email failed", error)
    }
  }
  try {
    await stepSlackAlert(ctx, returning)
  } catch (error) {
    console.error("[fulfill] slack failed", error)
  }
  try {
    await stepHubspot(ctx)
  } catch (error) {
    console.error("[fulfill] hubspot failed", error)
  }
  await stepMarkFulfilled(ctx)
}

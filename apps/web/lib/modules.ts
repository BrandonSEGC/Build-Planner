// Per-module server-side compute: outputs, headline, shared-profile patch,
// and the human-readable rows used by PDFs, emails, and Slack.
// The client NEVER dictates numbers — everything is recomputed here.

import {
  computeAffordability,
  computeHomeEstimate,
  computeLandBuild,
  computeTimeline,
  fmt,
  HOME_CONFIG,
  scoreStyleQuiz,
  STYLE_PROFILES,
  type AffordabilityState,
  type HomeEstimateState,
  type LandBuildState,
  type StyleId,
  type TimelineState,
} from "@segc/engines"
import type { ProfileRecord } from "./repo"
import type { ToolId } from "./schemas"

export interface ModuleResult {
  outputs: unknown
  headline: string
  subline: string
  rows: [string, string][]
  note: string
  profilePatch: ProfileRecord
  timelineIntent: string
}

function monthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase()
}

export function computeModule(toolId: ToolId, inputs: unknown): ModuleResult {
  switch (toolId) {
    case "estimator": {
      const state = inputs as HomeEstimateState
      const e = computeHomeEstimate(state)
      const regionName = HOME_CONFIG.regions.find((r) => r.id === state.region)?.name ?? state.region
      return {
        outputs: e,
        headline: `${fmt(e.low)}–${fmt(e.high)}`,
        subline: `${fmt(e.psfEff)} effective per sq ft · ${state.sqft.toLocaleString("en-US")} sq ft · ${regionName}`,
        rows: [
          ["Base construction", fmt(e.shell)],
          ["Garage + program", fmt(e.garage + e.bonus + e.porch)],
          ["Finishes + features", fmt(e.interiorAdds)],
          ["Site work", fmt(e.site)],
          ["Soft costs + contingency", fmt(e.soft + e.contingency)],
          ["Estimated midpoint", fmt(e.total)],
        ],
        note: "Directional planning range — not a quote. Final pricing depends on plans, site conditions, and selections.",
        profilePatch: {
          region: state.region,
          sqft: state.sqft,
          tier: state.tier,
          style: state.style,
          timeline: state.timeline,
          landStatus: state.ownLand === "yes" ? "owned" : "shopping",
        },
        timelineIntent: state.timeline,
      }
    }
    case "affordability": {
      const state = inputs as AffordabilityState & { timeline: string }
      const a = computeAffordability(state)
      const sqftMid = Math.round((a.sqftLow + a.sqftHigh) / 2 / 50) * 50
      return {
        outputs: { ...a, sqftMid },
        headline: `${fmt(a.low)}–${fmt(a.high)}`,
        subline: `Comfortable build budget · est. ${fmt(a.piPayment)}/mo P&I · DTI ${a.dti.toFixed(1)}%`,
        rows: [
          ["Comfortable build budget", `${fmt(a.low)}–${fmt(a.high)}`],
          ["Estimated monthly P&I", `${fmt(a.piPayment)} / mo`],
          ["Comfortable housing payment", `${fmt(a.comfortPayment)} / mo`],
          ["Amount financed", fmt(a.financed)],
          ["Cash + land equity applied", fmt(state.cash + state.landValue)],
          ["Debt-to-income at that payment", `${a.dti.toFixed(1)}%`],
          ["That budget builds roughly", `${Math.round(a.sqftLow).toLocaleString()}–${Math.round(a.sqftHigh).toLocaleString()} sq ft`],
        ],
        note: "Educational pre-qualification math only. SEGC is not a lender; your lender's numbers govern.",
        profilePatch: { timeline: state.timeline },
        timelineIntent: state.timeline,
      }
    }
    case "land": {
      const state = inputs as LandBuildState & { timeline: string }
      const l = computeLandBuild(state)
      const siteLandPct = Math.round(l.percentages.land + l.percentages.site)
      return {
        outputs: { ...l, siteLandPct },
        headline: `${fmt(l.low)}–${fmt(l.high)}`,
        subline: `All-in: land + site + build + soft costs · site & land are ${siteLandPct}% of the total`,
        rows: [
          ["Land", `${fmt(l.land)} (${Math.round(l.percentages.land)}%)`],
          ["Site work", `${fmt(l.site)} (${Math.round(l.percentages.site)}%)`],
          ["Build", `${fmt(l.build)} (${Math.round(l.percentages.build)}%)`],
          ["Soft costs + contingency", `${fmt(l.soft)} (${Math.round(l.percentages.soft)}%)`],
          ["All-in total", fmt(l.total)],
        ],
        note: `Site & land are ${siteLandPct}% of your total — this is why lot selection matters. We walk lots with clients before they buy.`,
        profilePatch: {
          region: state.region,
          sqft: state.sqft,
          tier: state.tier,
          landStatus: state.landStatus,
          timeline: state.timeline,
        },
        timelineIntent: state.timeline,
      }
    }
    case "style": {
      const state = inputs as { answers: Partial<Record<StyleId, number>>[]; timeline: string }
      const s = scoreStyleQuiz(state.answers)
      const primary = STYLE_PROFILES[s.primary]
      const secondary = STYLE_PROFILES[s.secondary]
      return {
        outputs: s,
        headline: `${s.percentage}% ${primary.name.toUpperCase()}`,
        subline: `with a ${secondary.name} streak`,
        rows: [
          ["Primary style", primary.name],
          ["Secondary style", secondary.name],
          ["Style DNA", primary.dna.join(" · ")],
          ["Signature elements we build", primary.signatures.join(" · ")],
        ],
        note: "Bring this to a consultation and we’ll turn your style DNA into a concept elevation.",
        profilePatch: { style: s.primary, timeline: state.timeline },
        timelineIntent: state.timeline,
      }
    }
    case "timeline": {
      const state = inputs as TimelineState
      const t = computeTimeline(state)
      return {
        outputs: t,
        headline: `${monthYear(t.moveInStart)} – ${monthYear(t.moveInEnd)}`,
        subline: `Estimated move-in window · ${t.minWeeks}–${t.maxWeeks} weeks from today`,
        rows: [
          ...t.phases.map(
            (phase) => [phase.label, `${phase.min}–${phase.max} weeks`] as [string, string],
          ),
          ["Estimated move-in window", `${monthYear(t.moveInStart)} – ${monthYear(t.moveInEnd)}`],
          ...(state.targetDate
            ? ([["To hit your target, design must start by", monthYear(t.designStartBy)]] as [string, string][])
            : []),
        ],
        note: t.tight
          ? "THAT TARGET IS TIGHT. The window above is the earliest realistic path — honest schedules are how we stay on time."
          : "On time isn’t a slogan — it’s a schedule. This window assumes normal permitting and weather.",
        profilePatch: { region: state.region, sqft: state.sqft, tier: state.tier },
        timelineIntent: state.financing === "not-started" ? "explore" : state.stage,
      }
    }
  }
}

export const TOOL_PDF_TYPES: Record<ToolId, string> = {
  estimator: "custom-home-estimate",
  affordability: "affordability-report",
  land: "land-build-estimate",
  style: "style-profile",
  timeline: "build-timeline",
}

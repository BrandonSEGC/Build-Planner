import { describe, expect, it } from "vitest"
import {
  computeAffordability,
  computeHomeEstimate,
  computeLandBuild,
  computeTimeline,
  fmt,
  HOME_CONFIG,
  monthlyPayment,
  principalFromPayment,
  scoreStyleQuiz,
} from "../src/index"

const baseHome = {
  region: "sandhills",
  sqft: 2800,
  stories: "1",
  foundation: "slab",
  ceiling: "9",
  beds: 4,
  fullBaths: 3,
  halfBaths: 1,
  garage: 2,
  garageType: "attached",
  bonus: 1,
  porches: 1,
  tier: "signature",
  kitchen: "standard",
  primaryBath: "standard",
  flooring: "lvp",
  exterior: "fiber",
  roof: "standard",
  features: [] as string[],
  ownLand: "yes",
  clearing: "none",
  utilities: "municipal",
  driveway: "short",
  style: "farmhouse",
  timeline: "6-12",
  designMode: "A",
  design: Object.fromEntries(Object.entries(HOME_CONFIG.design).map(([g, o]) => [g, o[0].id])),
}

describe("fmt", () => {
  it("formats dollars", () => {
    expect(fmt(1234567.4)).toBe("$1,234,567")
  })
})

describe("computeHomeEstimate", () => {
  it("computes the default Sandhills signature home deterministically", () => {
    const r = computeHomeEstimate(baseHome)
    // shell: 285 * 0.99 flooring mult * 2800
    expect(r.perFoot).toBeCloseTo(285 * 0.99, 6)
    expect(r.shell).toBeCloseTo(285 * 0.99 * 2800, 2)
    expect(r.garage).toBe(2 * 16000)
    expect(r.fullB).toBe(12000) // 3 full baths → 1 over two
    expect(r.halfB).toBe(6500)
    expect(r.total).toBeCloseTo(r.build * 1.21, 2)
    expect(r.low).toBeLessThan(r.total)
    expect(r.high).toBeGreaterThan(r.total)
    expect(r.psfEff).toBeCloseTo(r.total / 2800, 6)
  })

  it("adds features, design deltas and site work", () => {
    const r = computeHomeEstimate({
      ...baseHome,
      features: ["pool", "gen"],
      design: { ...baseHome.design, counter: "marble" },
      clearing: "heavy",
      utilities: "well",
      driveway: "long",
    })
    const base = computeHomeEstimate(baseHome)
    expect(r.features).toBe(75000 + 14000)
    expect(r.design).toBe(5500)
    expect(r.site).toBe(38000 + 35000 + 18000)
    expect(r.total).toBeGreaterThan(base.total)
  })

  it("applies regional multipliers", () => {
    const triangle = computeHomeEstimate({ ...baseHome, region: "triangle" })
    const sandhills = computeHomeEstimate(baseHome)
    expect(triangle.shell / sandhills.shell).toBeCloseTo(1.12, 6)
  })
})

describe("mortgage math", () => {
  it("round-trips payment and principal", () => {
    const principal = 400000
    const pay = monthlyPayment(principal, 6.75, 30)
    expect(principalFromPayment(pay, 6.75, 30)).toBeCloseTo(principal, 4)
  })

  it("handles zero rate", () => {
    expect(monthlyPayment(360000, 0, 30)).toBeCloseTo(1000, 6)
  })
})

describe("computeAffordability", () => {
  it("produces a sane budget for a typical household", () => {
    const r = computeAffordability({
      annualIncome: 140000,
      monthlyDebts: 800,
      credit: "good",
      cash: 60000,
      landValue: 0,
      loanType: "va",
      termYears: 30,
      rate: 6.75,
    })
    expect(r.buildBudget).toBeGreaterThan(300000)
    expect(r.dti).toBeGreaterThan(0)
    expect(r.dti).toBeLessThanOrEqual(45.000001)
    expect(r.sqftLow).toBeLessThan(r.sqftHigh)
  })

  it("never returns a negative budget", () => {
    const r = computeAffordability({
      annualIncome: 30000,
      monthlyDebts: 5000,
      credit: "poor",
      cash: 0,
      landValue: 0,
      loanType: "conventional",
      termYears: 30,
      rate: 7,
    })
    expect(r.buildBudget).toBeGreaterThanOrEqual(0)
  })
})

describe("computeLandBuild", () => {
  it("zeroes land when owned and percentages sum to 100", () => {
    const r = computeLandBuild({
      region: "sandhills",
      landStatus: "owned",
      acreage: 2,
      landPrice: 0,
      clearing: "light",
      topography: "flat",
      utilities: "municipal",
      powerRun: "short",
      driveway: "short",
      sqft: 2400,
      tier: "signature",
      garage: 2,
    })
    expect(r.land).toBe(0)
    const pctSum =
      r.percentages.land + r.percentages.site + r.percentages.build + r.percentages.soft
    expect(pctSum).toBeCloseTo(100, 6)
  })

  it("suggests land price per acre when shopping", () => {
    const r = computeLandBuild({
      region: "triangle",
      landStatus: "shopping",
      acreage: 3,
      landPrice: 0,
      clearing: "light",
      topography: "flat",
      utilities: "municipal",
      powerRun: "short",
      driveway: "short",
      sqft: 2400,
      tier: "essential",
      garage: 2,
    })
    expect(r.land).toBe(3 * 62000)
  })
})

describe("scoreStyleQuiz", () => {
  it("ranks primary and secondary styles", () => {
    const r = scoreStyleQuiz([
      { farmhouse: 3, craftsman: 1 },
      { farmhouse: 2, modern: 2 },
      { craftsman: 2 },
    ])
    expect(r.primary).toBe("farmhouse")
    expect(r.secondary).toBe("craftsman")
    expect(r.percentage).toBe(50)
  })
})

describe("computeTimeline", () => {
  const now = new Date("2026-07-14T12:00:00Z")
  const base = {
    stage: "design",
    region: "sandhills",
    sqft: 2800,
    complexity: "custom",
    tier: "signature",
    basement: false,
    pool: false,
    financing: "approved",
    targetDate: "",
  }

  it("is deterministic given a fixed now", () => {
    const a = computeTimeline(base, undefined, now)
    const b = computeTimeline(base, undefined, now)
    expect(a).toEqual(b)
    expect(a.phases).toHaveLength(7)
    expect(a.minWeeks).toBeLessThan(a.maxWeeks)
  })

  it("flags tight targets", () => {
    const r = computeTimeline({ ...base, targetDate: "2026-09-01" }, undefined, now)
    expect(r.tight).toBe(true)
  })

  it("adds financing delay when not started", () => {
    const approved = computeTimeline(base, undefined, now)
    const notStarted = computeTimeline({ ...base, financing: "not-started" }, undefined, now)
    expect(notStarted.minWeeks).toBe(approved.minWeeks + 4)
    expect(notStarted.maxWeeks).toBe(approved.maxWeeks + 6)
  })
})

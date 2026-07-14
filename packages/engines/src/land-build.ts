// SEGC Land + Build All-In engine — pure TS.

export interface LandBuildState {
  region: string
  landStatus: string
  acreage: number
  landPrice: number
  clearing: string
  topography: string
  utilities: string
  powerRun: string
  driveway: string
  sqft: number
  tier: string
  garage: number
}

// *** ALL PRICING LIVES HERE — SWAP FOR SEGC'S REAL NUMBERS *** // PLACEHOLDER
export const LAND_BUILD_CONFIG = {
  landPerAcre: {
    sandhills: 28000,
    triad: 36000,
    charlotte: 52000,
    triangle: 62000,
    coastal: 58000,
    mountains: 45000,
  } as Record<string, number>, // PLACEHOLDER
  psfByTier: { essential: 225, signature: 285, bespoke: 350 } as Record<string, number>,
  garagePerBay: 16000,
  clearing: { light: 13000, moderate: 26000, heavy: 42000 } as Record<string, number>, // PLACEHOLDER
  topography: { flat: 0, slope: 18000, steep: 42000 } as Record<string, number>, // PLACEHOLDER
  utilities: { municipal: 8000, septicWell: 35000 } as Record<string, number>, // PLACEHOLDER
  powerRun: { short: 3500, medium: 9000, long: 22000 } as Record<string, number>, // PLACEHOLDER
  driveway: { short: 6000, medium: 14000, long: 28000 } as Record<string, number>, // PLACEHOLDER
  softPct: 0.11,
  contingencyPct: 0.1,
  rangeSpread: 0.07,
}

export function computeLandBuild(state: LandBuildState, config = LAND_BUILD_CONFIG) {
  const suggestedLand = state.acreage * (config.landPerAcre[state.region] ?? 0)
  const land = state.landStatus === "owned" ? 0 : state.landPrice || suggestedLand
  const site =
    config.clearing[state.clearing] +
    config.topography[state.topography] +
    config.utilities[state.utilities] +
    config.powerRun[state.powerRun] +
    config.driveway[state.driveway]
  const build = state.sqft * config.psfByTier[state.tier] + state.garage * config.garagePerBay
  const soft = (site + build) * config.softPct
  const contingency = (site + build) * config.contingencyPct
  const total = land + site + build + soft + contingency
  const denominator = total || 1
  return {
    land,
    site,
    build,
    soft: soft + contingency,
    total,
    low: total * (1 - config.rangeSpread),
    high: total * (1 + config.rangeSpread),
    percentages: {
      land: (land / denominator) * 100,
      site: (site / denominator) * 100,
      build: (build / denominator) * 100,
      soft: ((soft + contingency) / denominator) * 100,
    },
  }
}

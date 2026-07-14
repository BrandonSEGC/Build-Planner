// SEGC Custom Home Cost Estimator engine — pure TS, no framework imports.
// Ported unchanged from the proven v1 Framer implementation (SEGCEngines.tsx).

export interface HomeEstimateState {
  region: string
  sqft: number
  stories: string
  foundation: string
  ceiling: string
  beds: number
  fullBaths: number
  halfBaths: number
  garage: number
  garageType: string
  bonus: number
  porches: number
  tier: string
  kitchen: string
  primaryBath: string
  flooring: string
  exterior: string
  roof: string
  features: string[]
  ownLand: string
  clearing: string
  utilities: string
  driveway: string
  style: string
  timeline: string
  designMode: string
  design: Record<string, string>
}

export interface DesignOption {
  id: string
  name: string
  cost: number
  sw: string
}

export interface HomeConfig {
  psfByTier: Record<string, number>
  regions: { id: string; name: string; sub: string; mult: number }[]
  foundationMult: Record<string, number>
  storyMult: Record<string, number>
  ceilingMult: Record<string, number>
  exteriorMult: Record<string, number>
  roofMult: Record<string, number>
  flooringMult: Record<string, number>
  garagePerBayAttached: number
  garagePerBayDetached: number
  bonusPerRoom: number
  porchPerCovered: number
  halfBath: number
  fullBathOverTwo: number
  kitchen: Record<string, number>
  primaryBath: Record<string, number>
  features: { id: string; label: string; cost: number }[]
  clearing: Record<string, number>
  utilities: Record<string, number>
  driveway: Record<string, number>
  design: Record<string, DesignOption[]>
  softCostPct: number
  contingencyPct: number
  rangeSpread: number
}

// *** ALL PRICING LIVES HERE — SWAP FOR SEGC'S REAL NUMBERS *** // PLACEHOLDER
export const HOME_CONFIG: HomeConfig = {
  psfByTier: { essential: 225, signature: 285, bespoke: 350 },
  regions: [
    { id: "sandhills", name: "Sandhills", sub: "Fayetteville · Lumberton", mult: 1 },
    { id: "triad", name: "Triad", sub: "Greensboro · Winston", mult: 1.03 },
    { id: "charlotte", name: "Piedmont", sub: "Charlotte · metro", mult: 1.05 },
    { id: "triangle", name: "Triangle", sub: "Raleigh · Durham", mult: 1.12 },
    { id: "coastal", name: "Coastal", sub: "Wilmington · Brunswick", mult: 1.1 },
    { id: "mountains", name: "Mountains", sub: "Asheville · WNC", mult: 1.15 },
  ],
  foundationMult: { slab: 1, crawl: 1.06, basement: 1.16, piling: 1.22 },
  storyMult: { "1": 1, "1.5": 0.99, "2": 0.97 },
  ceilingMult: { "9": 1, "10": 1.04, "12": 1.09 },
  exteriorMult: { vinyl: 0.97, fiber: 1, brick: 1.06, stone: 1.1 },
  roofMult: { simple: 0.98, standard: 1, complex: 1.05 },
  flooringMult: { lvp: 0.99, hardwood: 1.03, tile: 1.05 },
  garagePerBayAttached: 16000,
  garagePerBayDetached: 22000,
  bonusPerRoom: 9000,
  porchPerCovered: 12000,
  halfBath: 6500,
  fullBathOverTwo: 12000,
  kitchen: { standard: 0, chef: 35000, luxury: 75000 },
  primaryBath: { standard: 0, spa: 25000 },
  features: [
    { id: "pool", label: "In-ground pool", cost: 75000 },
    { id: "sunroom", label: "3-season sunroom", cost: 30000 },
    { id: "screen", label: "Screened porch", cost: 28000 },
    { id: "deck", label: "Deck / paver patio", cost: 16000 },
    { id: "covered", label: "Covered outdoor living", cost: 18000 },
    { id: "outkit", label: "Outdoor kitchen", cost: 24000 },
    { id: "fire", label: "Fire feature", cost: 8000 },
    { id: "media", label: "Media / theater room", cost: 35000 },
    { id: "gym", label: "Home gym", cost: 15000 },
    { id: "office", label: "Built-out home office", cost: 12000 },
    { id: "wine", label: "Wine room", cost: 22000 },
    { id: "elevator", label: "Residential elevator", cost: 45000 },
    { id: "solar", label: "Solar + battery package", cost: 28000 },
    { id: "gen", label: "Standby generator", cost: 14000 },
    { id: "smart", label: "Smart-home package", cost: 18000 },
    { id: "mud", label: "Custom mudroom built-ins", cost: 9000 },
  ],
  clearing: { none: 0, light: 13000, heavy: 38000 },
  utilities: { municipal: 0, well: 35000 },
  driveway: { short: 0, long: 18000 },
  design: {
    counter: [
      { id: "quartz", name: "Quartz", cost: 0, sw: "linear-gradient(135deg,#eceae6,#cfccc6)" },
      { id: "pquartz", name: "Premium quartz", cost: 2500, sw: "linear-gradient(135deg,#f4f2ef,#d6d1c9)" },
      { id: "granite", name: "Granite", cost: 1500, sw: "radial-gradient(circle at 30% 30%,#807d77,#3f3d39)" },
      { id: "marble", name: "Natural marble", cost: 5500, sw: "linear-gradient(120deg,#f7f6f3,#cfcabf,#f4f2ee)" },
      { id: "exotic", name: "Exotic slab", cost: 9000, sw: "linear-gradient(135deg,#2e2a26,#6e5a3e,#b9975b)" },
    ],
    backsplash: [
      { id: "subway", name: "Subway tile", cost: 0, sw: "repeating-linear-gradient(0deg,#efece6 0 7px,#e2ded6 7px 8px)" },
      { id: "full", name: "Full-height", cost: 2200, sw: "repeating-linear-gradient(90deg,#e9e4da 0 9px,#dbd4c6 9px 10px)" },
      { id: "designer", name: "Designer tile", cost: 4500, sw: "linear-gradient(135deg,#bcae93,#8a7a5c)" },
      { id: "slab", name: "Stone slab", cost: 6000, sw: "linear-gradient(120deg,#f4f2ee,#cdc6b9,#efe9df)" },
    ],
    bathCounter: [
      { id: "quartz", name: "Quartz", cost: 0, sw: "linear-gradient(135deg,#eceae6,#d2cfc9)" },
      { id: "pquartz", name: "Premium quartz", cost: 1800, sw: "linear-gradient(135deg,#f4f2ef,#d6d1c9)" },
      { id: "marble", name: "Marble", cost: 3500, sw: "linear-gradient(120deg,#f7f6f3,#cfcabf,#f4f2ee)" },
      { id: "exotic", name: "Exotic stone", cost: 5500, sw: "linear-gradient(135deg,#3a352f,#7a6648,#b9975b)" },
    ],
    shower: [
      { id: "tiled", name: "Tiled walk-in", cost: 0, sw: "repeating-linear-gradient(45deg,#e7e2d9 0 6px,#dad3c6 6px 7px)" },
      { id: "frameless", name: "Frameless glass", cost: 4500, sw: "linear-gradient(135deg,#dfe7e6,#bcc9c7)" },
      { id: "spa", name: "Spa rain + bench", cost: 7000, sw: "linear-gradient(135deg,#cdd6d3,#9fb0ab)" },
      { id: "wet", name: "Wet room + jets", cost: 12000, sw: "linear-gradient(135deg,#b9c6c2,#7d918b)" },
    ],
    tub: [
      { id: "none", name: "Shower only", cost: 0, sw: "linear-gradient(135deg,#eeece8,#ddd9d3)" },
      { id: "alcove", name: "Alcove soaking", cost: 0, sw: "linear-gradient(135deg,#f1efeb,#dad6cf)" },
      { id: "free", name: "Freestanding", cost: 3000, sw: "linear-gradient(135deg,#f6f4f0,#cfcabf)" },
      { id: "designer", name: "Designer + filler", cost: 5500, sw: "linear-gradient(135deg,#efece6,#bcae93)" },
    ],
    bathTile: [
      { id: "porcelain", name: "Porcelain", cost: 0, sw: "repeating-linear-gradient(0deg,#ece8e1 0 8px,#e0dbd1 8px 9px)" },
      { id: "large", name: "Large-format", cost: 2000, sw: "linear-gradient(135deg,#e9e4da,#d6cfc2)" },
      { id: "designer", name: "Marble / mosaic", cost: 4500, sw: "linear-gradient(120deg,#f4f2ee,#cabfa8,#efe9df)" },
    ],
    paint: [
      { id: "builder", name: "Builder-grade", cost: 0, sw: "linear-gradient(135deg,#f3efe9,#e7e1d7)" },
      { id: "premium", name: "Premium washable", cost: 3500, sw: "linear-gradient(135deg,#efe9df,#d9cfbf)" },
      { id: "designer", name: "Designer + accents", cost: 7000, sw: "linear-gradient(135deg,#cdbfa3,#8a7a5c)" },
    ],
    trim: [
      { id: "standard", name: "Standard", cost: 0, sw: "linear-gradient(135deg,#efe9df,#e2dacc)" },
      { id: "craftsman", name: "Craftsman casing", cost: 4000, sw: "linear-gradient(135deg,#d9c7a8,#a98c63)" },
      { id: "designer", name: "Coffered / wainscot", cost: 9000, sw: "linear-gradient(135deg,#6e5436,#3e2c18)" },
    ],
    suite: [
      { id: "standard", name: "Standard", cost: 0, sw: "linear-gradient(135deg,#efe9df,#ddd5c7)" },
      { id: "oversized", name: "Oversized", cost: 6000, sw: "linear-gradient(135deg,#e7dcc6,#cbb595)" },
      { id: "sitting", name: "Suite + sitting", cost: 14000, sw: "linear-gradient(135deg,#dcc9ad,#a07c4e)" },
      { id: "wing", name: "Private wing", cost: 22000, sw: "linear-gradient(135deg,#6e5436,#3e2c18)" },
    ],
  },
  softCostPct: 0.11,
  contingencyPct: 0.1,
  rangeSpread: 0.07,
}

export interface HomeEstimateResult {
  perFoot: number
  shell: number
  garage: number
  bonus: number
  porch: number
  halfB: number
  fullB: number
  kitchen: number
  primaryBath: number
  features: number
  design: number
  interiorAdds: number
  site: number
  build: number
  soft: number
  contingency: number
  total: number
  low: number
  high: number
  psfEff: number
}

export function computeHomeEstimate(
  state: HomeEstimateState,
  config: HomeConfig = HOME_CONFIG,
): HomeEstimateResult {
  const region = config.regions.find((item) => item.id === state.region)
  const perFoot =
    config.psfByTier[state.tier] *
    config.foundationMult[state.foundation] *
    config.storyMult[state.stories] *
    config.ceilingMult[state.ceiling] *
    config.exteriorMult[state.exterior] *
    config.roofMult[state.roof] *
    config.flooringMult[state.flooring] *
    (region?.mult ?? 1)
  const shell = perFoot * state.sqft
  const garage =
    state.garage *
    (state.garageType === "detached" ? config.garagePerBayDetached : config.garagePerBayAttached)
  const bonus = state.bonus * config.bonusPerRoom
  const porch = state.porches * config.porchPerCovered
  const halfB = state.halfBaths * config.halfBath
  const fullB = Math.max(0, state.fullBaths - 2) * config.fullBathOverTwo
  const kitchen = config.kitchen[state.kitchen]
  const primaryBath = config.primaryBath[state.primaryBath]
  const features = config.features.reduce(
    (total, item) => total + (state.features.includes(item.id) ? item.cost : 0),
    0,
  )
  const design = Object.entries(config.design).reduce((total, [group, options]) => {
    return total + (options.find((item) => item.id === state.design[group])?.cost ?? 0)
  }, 0)
  const interiorAdds = bonus + porch + halfB + fullB + kitchen + primaryBath + features + design
  const site =
    config.clearing[state.clearing] + config.utilities[state.utilities] + config.driveway[state.driveway]
  const build = shell + garage + interiorAdds + site
  const soft = build * config.softCostPct
  const contingency = build * config.contingencyPct
  const total = build + soft + contingency
  return {
    perFoot,
    shell,
    garage,
    bonus,
    porch,
    halfB,
    fullB,
    kitchen,
    primaryBath,
    features,
    design,
    interiorAdds,
    site,
    build,
    soft,
    contingency,
    total,
    low: total * (1 - config.rangeSpread),
    high: total * (1 + config.rangeSpread),
    psfEff: total / state.sqft,
  }
}

// SEGC Home Style Quiz scoring engine — pure TS.

export const STYLE_PROFILES = {
  farmhouse: {
    name: "Modern Farmhouse",
    dna: ["Crisp board-and-batten forms", "High-contrast windows", "Warm, practical interiors"],
    signatures: ["Statement kitchen island", "Covered rear living", "Simple gable rhythm"],
  },
  lowcountry: {
    name: "Lowcountry",
    dna: ["Deep shaded porches", "Raised coastal proportions", "Relaxed indoor-outdoor flow"],
    signatures: ["Full-width front porch", "Tall windows", "Breezy gathering rooms"],
  },
  craftsman: {
    name: "Craftsman",
    dna: ["Tapered columns", "Layered gables", "Honest natural materials"],
    signatures: ["Built-in storage", "Detailed trim", "Strong front entry"],
  },
  modern: {
    name: "Modern",
    dna: ["Clean horizontal lines", "Open visual connections", "Quiet material palette"],
    signatures: ["Large-format glass", "Sculptural stair", "Integrated lighting"],
  },
  traditional: {
    name: "Traditional Brick",
    dna: ["Balanced symmetry", "Timeless masonry", "Defined formal moments"],
    signatures: ["Brick entry composition", "Detailed millwork", "Classic roofline"],
  },
  transitional: {
    name: "Transitional",
    dna: ["Classic proportions", "Simplified detailing", "Warm contemporary finishes"],
    signatures: ["Mixed-material elevation", "Open kitchen core", "Tailored trim package"],
  },
} as const

export type StyleId = keyof typeof STYLE_PROFILES

export function scoreStyleQuiz(answers: Partial<Record<StyleId, number>>[]) {
  const totals = Object.keys(STYLE_PROFILES).reduce(
    (acc, id) => ({ ...acc, [id]: 0 }),
    {} as Record<StyleId, number>,
  )
  for (const answer of answers) {
    for (const id of Object.keys(answer) as StyleId[]) totals[id] += answer[id] ?? 0
  }
  const ranked = (Object.entries(totals) as [StyleId, number][]).sort((a, b) => b[1] - a[1])
  const sum = ranked.reduce((total, item) => total + item[1], 0) || 1
  return {
    primary: ranked[0][0],
    secondary: ranked[1][0],
    percentage: Math.round((ranked[0][1] / sum) * 100),
    totals,
  }
}

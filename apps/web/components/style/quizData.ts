// Home Style Quiz content — 8 image-driven questions, 4 answers each.
// Weights score across the same six styles the estimator uses.
// `art` is the layered-gradient placeholder per the design brief; swap each for
// real photography from webimages.southeasterngc.com when the 32 cards land.

import type { StyleId } from "@segc/engines"

export interface QuizAnswer {
  id: string
  label: string
  sub?: string
  art: string
  weights: Partial<Record<StyleId, number>>
}

export interface QuizQuestion {
  id: string
  prompt: string
  sub: string
  answers: QuizAnswer[]
}

const g = (a: string, b: string, c?: string) =>
  `linear-gradient(150deg, ${a} 0%, ${b} ${c ? "55%" : "100%"}${c ? `, ${c} 100%` : ""})`

export const QUIZ: QuizQuestion[] = [
  {
    id: "arrival",
    prompt: "PULL INTO THE DRIVEWAY. WHAT DO YOU WANT TO SEE?",
    sub: "First impressions set the architecture.",
    answers: [
      { id: "gables", label: "Crisp white gables", sub: "Black windows, board & batten", art: g("#F6F3EC", "#D8D2C4", "#141414"), weights: { farmhouse: 3, craftsman: 1 } },
      { id: "porch", label: "A deep front porch", sub: "Columns, ceiling fans, shade", art: g("#EAE2D3", "#C9B896", "#7A6a4E"), weights: { lowcountry: 3, traditional: 1 } },
      { id: "lines", label: "Clean horizontal lines", sub: "Flat planes, big glass", art: g("#DDDDD9", "#9A9A94", "#3A3A38"), weights: { modern: 3, transitional: 1 } },
      { id: "brick", label: "Timeless brick symmetry", sub: "Formal entry, classic roofline", art: g("#B0654A", "#8A4934", "#5E3222"), weights: { traditional: 3, transitional: 1 } },
    ],
  },
  {
    id: "kitchen",
    prompt: "YOUR DREAM KITCHEN IS…",
    sub: "The room everything else orbits.",
    answers: [
      { id: "island", label: "A statement island", sub: "Seats six, farm sink", art: g("#F4F1EA", "#DCD3C2", "#40342A"), weights: { farmhouse: 3, transitional: 1 } },
      { id: "chef", label: "A chef's workshop", sub: "Pro range, prep zones", art: g("#2E2C29", "#5B5852", "#B9975B"), weights: { modern: 2, craftsman: 2 } },
      { id: "gather", label: "A gathering hub", sub: "Open to porch and den", art: g("#EFE6D4", "#CBB99B", "#8D9E96"), weights: { lowcountry: 3, farmhouse: 1 } },
      { id: "tailored", label: "Tailored and quiet", sub: "Inset cabinetry, marble", art: g("#F2EFE9", "#CFC6B8", "#6E5436"), weights: { transitional: 3, traditional: 1 } },
    ],
  },
  {
    id: "roofline",
    prompt: "PICK A ROOFLINE.",
    sub: "The silhouette people see from the street.",
    answers: [
      { id: "gable", label: "Simple gable rhythm", sub: "Clean peaks, metal accents", art: g("#EDEAE2", "#C9C2B2", "#141414"), weights: { farmhouse: 3 } },
      { id: "layered", label: "Layered gables + brackets", sub: "Depth and shadow", art: g("#D9C7A8", "#A98C63", "#4E3A24"), weights: { craftsman: 3 } },
      { id: "low", label: "Low and horizontal", sub: "Wide overhangs", art: g("#CFCFCB", "#8F8F89", "#2E2E2C"), weights: { modern: 3 } },
      { id: "hipped", label: "Stately hipped roof", sub: "Symmetry over the entry", art: g("#C2937B", "#96604A", "#5E3222"), weights: { traditional: 2, lowcountry: 1, transitional: 1 } },
    ],
  },
  {
    id: "materials",
    prompt: "TOUCH ONE MATERIAL FOREVER.",
    sub: "Honest materials age the best.",
    answers: [
      { id: "shiplap", label: "Painted shiplap", sub: "Bright, crisp, warm", art: g("#F7F4EE", "#E2DCD0", "#B9AE9B"), weights: { farmhouse: 3 } },
      { id: "timber", label: "Stained timber", sub: "Tapered columns, real grain", art: g("#8A6844", "#5E4326", "#3A2A16"), weights: { craftsman: 3 } },
      { id: "concrete", label: "Concrete + steel + glass", sub: "Cool, sculptural", art: g("#D6D6D2", "#9C9C97", "#4A4A47"), weights: { modern: 3 } },
      { id: "brickm", label: "Handmade brick", sub: "Mortar joints, permanence", art: g("#B0654A", "#7E4531", "#4E2B1E"), weights: { traditional: 3 } },
    ],
  },
  {
    id: "evening",
    prompt: "IT'S 7PM SATURDAY. WHERE ARE YOU?",
    sub: "Design follows how you actually live.",
    answers: [
      { id: "backporch", label: "On the screened porch", sub: "Fans on, sweet tea", art: g("#E9DFC9", "#B8C4B4", "#6E7F72"), weights: { lowcountry: 3, farmhouse: 1 } },
      { id: "firepit", label: "Around the fire pit", sub: "Adirondacks, s'mores", art: g("#4E3A24", "#8A5A2E", "#F4B214"), weights: { craftsman: 2, farmhouse: 2 } },
      { id: "terrace", label: "On the terrace", sub: "City-quiet, wine, skyline", art: g("#3A3A38", "#6E6E68", "#B9975B"), weights: { modern: 3 } },
      { id: "dining", label: "In the dining room", sub: "Long table, candles", art: g("#EFE7DA", "#C9B48E", "#6E5436"), weights: { traditional: 2, transitional: 2 } },
    ],
  },
  {
    id: "palette",
    prompt: "PICK YOUR PALETTE.",
    sub: "Color is the fastest tell.",
    answers: [
      { id: "bw", label: "White + black + wood", art: g("#FAF8F3", "#141414", "#B08D57"), weights: { farmhouse: 3, modern: 1 } },
      { id: "coastal", label: "Sea glass + sand", art: g("#DCE5E0", "#B8CCC2", "#D9CBAA"), weights: { lowcountry: 3 } },
      { id: "earth", label: "Earth + olive + rust", art: g("#8A7A5C", "#5E5636", "#8A4934"), weights: { craftsman: 3 } },
      { id: "greige", label: "Warm greige + cream", art: g("#EDE9E2", "#CFC6B8", "#A79C8A"), weights: { transitional: 3, traditional: 1 } },
    ],
  },
  {
    id: "detail",
    prompt: "THE DETAIL GUESTS SHOULD NOTICE FIRST:",
    sub: "Every style has a signature move.",
    answers: [
      { id: "beams", label: "Exposed beams", sub: "Over the great room", art: g("#EFE9DF", "#C9B48E", "#6E5436"), weights: { farmhouse: 2, craftsman: 2 } },
      { id: "builtins", label: "Built-in everything", sub: "Benches, bookcases, nooks", art: g("#D9C7A8", "#8A6844", "#3E2C18"), weights: { craftsman: 3 } },
      { id: "stair", label: "A sculptural stair", sub: "Floating, lit, minimal", art: g("#E5E5E1", "#9C9C97", "#2E2E2C"), weights: { modern: 3 } },
      { id: "millwork", label: "Fine millwork", sub: "Wainscot, coffers, casings", art: g("#F2EFE9", "#CFC6B8", "#451E00"), weights: { traditional: 2, transitional: 2 } },
    ],
  },
  {
    id: "feeling",
    prompt: "WHEN YOU WALK IN, THE HOUSE SHOULD FEEL…",
    sub: "Last one. Go with your gut.",
    answers: [
      { id: "sunny", label: "Bright and gathered", sub: "Sunlit, family-first", art: g("#FBF7EE", "#F4B214", "#D8D2C4"), weights: { farmhouse: 2, lowcountry: 2 } },
      { id: "grounded", label: "Warm and grounded", sub: "Wood, wool, firelight", art: g("#8A6844", "#5E4326", "#2E2013"), weights: { craftsman: 3 } },
      { id: "calm", label: "Calm and uncluttered", sub: "Air, light, negative space", art: g("#EFEFEB", "#CFCFCB", "#8F8F89"), weights: { modern: 2, transitional: 2 } },
      { id: "established", label: "Established and proud", sub: "Like it's always been there", art: g("#B0654A", "#6E5436", "#451E00"), weights: { traditional: 3 } },
    ],
  },
]

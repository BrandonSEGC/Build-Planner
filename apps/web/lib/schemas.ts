import { z } from "zod"

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z
    .string()
    .trim()
    .refine((value) => value.replace(/\D/g, "").length >= 10, "Enter a 10-digit phone number"),
  consent: z.literal(true),
})

export const estimatorInputsSchema = z.object({
  region: z.string(),
  sqft: z.number().int().min(600).max(20000),
  stories: z.string(),
  foundation: z.string(),
  ceiling: z.string(),
  beds: z.number().int().min(1).max(12),
  fullBaths: z.number().int().min(1).max(10),
  halfBaths: z.number().int().min(0).max(6),
  garage: z.number().int().min(0).max(8),
  garageType: z.string(),
  bonus: z.number().int().min(0).max(6),
  porches: z.number().int().min(0).max(6),
  tier: z.enum(["essential", "signature", "bespoke"]),
  kitchen: z.string(),
  primaryBath: z.string(),
  flooring: z.string(),
  exterior: z.string(),
  roof: z.string(),
  features: z.array(z.string()).max(32),
  ownLand: z.string(),
  clearing: z.string(),
  utilities: z.string(),
  driveway: z.string(),
  style: z.string(),
  timeline: z.string(),
  designMode: z.string(),
  design: z.record(z.string(), z.string()),
})

export const affordabilityInputsSchema = z.object({
  annualIncome: z.number().min(0).max(5_000_000),
  monthlyDebts: z.number().min(0).max(50_000),
  credit: z.string(),
  cash: z.number().min(0).max(5_000_000),
  landValue: z.number().min(0).max(5_000_000),
  loanType: z.enum(["ctp", "va", "fha", "conventional"]),
  termYears: z.number().int().min(10).max(40),
  rate: z.number().min(0).max(15),
  timeline: z.string(),
})

export const landBuildInputsSchema = z.object({
  region: z.string(),
  landStatus: z.enum(["owned", "contract", "shopping"]),
  acreage: z.number().min(0).max(500),
  landPrice: z.number().min(0).max(10_000_000),
  clearing: z.string(),
  topography: z.string(),
  utilities: z.string(),
  powerRun: z.string(),
  driveway: z.string(),
  sqft: z.number().int().min(600).max(20000),
  tier: z.enum(["essential", "signature", "bespoke"]),
  garage: z.number().int().min(0).max(8),
  timeline: z.string(),
})

const styleWeights = z.record(
  z.enum(["farmhouse", "lowcountry", "craftsman", "modern", "traditional", "transitional"]),
  z.number().min(0).max(5),
)

export const styleQuizInputsSchema = z.object({
  answers: z.array(styleWeights).length(8),
  timeline: z.string(),
})

export const timelineInputsSchema = z.object({
  stage: z.string(),
  region: z.string(),
  sqft: z.number().int().min(600).max(20000),
  complexity: z.string(),
  tier: z.enum(["essential", "signature", "bespoke"]),
  basement: z.boolean(),
  pool: z.boolean(),
  financing: z.string(),
  targetDate: z.string(), // "" or YYYY-MM-DD
})

export const INPUT_SCHEMAS = {
  estimator: estimatorInputsSchema,
  affordability: affordabilityInputsSchema,
  land: landBuildInputsSchema,
  style: styleQuizInputsSchema,
  timeline: timelineInputsSchema,
} as const

export type ToolId = keyof typeof INPUT_SCHEMAS

export const unlockSchema = z.object({
  toolId: z.enum(["estimator", "affordability", "land", "style", "timeline"]),
  contact: contactSchema.nullable(), // null = returning lead, skip the gate
  inputs: z.unknown(), // validated per-tool via INPUT_SCHEMAS in the route
  turnstileToken: z.string().optional(),
})

export type UnlockPayload = z.infer<typeof unlockSchema>

export const profileSchema = z.object({
  region: z.string().optional(),
  sqft: z.number().int().min(0).max(30000).optional(),
  tier: z.string().optional(),
  style: z.string().optional(),
  timeline: z.string().optional(),
  landStatus: z.string().optional(),
})

export type ProfilePayload = z.infer<typeof profileSchema>

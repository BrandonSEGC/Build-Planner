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

export const unlockSchema = z.object({
  toolId: z.enum(["estimator", "affordability", "land", "style", "timeline"]),
  contact: contactSchema.nullable(), // null = returning lead, skip the gate
  inputs: estimatorInputsSchema, // v1: estimator only; becomes a union as modules land
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

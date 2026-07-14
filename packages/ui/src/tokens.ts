// SEGC brand tokens — single source of truth for app, emails, and PDFs.
// From SEGC_Design_Language_Reference.md (site-extracted, June 2026). Do not invent new colors.

export const tokens = {
  brown: "#451E00",
  brownMid: "#693709",
  gold: "#F4B214",
  ink: "#141414",
  cream: "#FFFCFC",
  warm: "#FFFBF5",
  gray: "#F5F5F5",
  white: "#FFFFFF",
  black: "#000000",
  muted: "#857D72",
  error: "#B42318",
  radCard: 20,
  radTag: 8,
  radPill: 54,
  radCta: 0, // CTAs are ALWAYS sharp
  shadow: "0 18px 55px rgba(69, 30, 0, 0.09)",
  display: "var(--font-oswald), 'Oswald', 'Arial Narrow', sans-serif",
  body: "var(--font-inter), 'Inter', Arial, sans-serif",
} as const

export const TRUST_BADGES = [
  "20+ Years of Experience",
  "SBA 8(a) & HUBZone Certified",
  "Fayetteville’s #1 Rated Contractor",
] as const

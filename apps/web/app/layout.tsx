import type { Metadata, Viewport } from "next"
// Self-hosted brand fonts (no external font dependency at runtime or build).
import "@fontsource-variable/oswald"
import "@fontsource-variable/inter"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "The SEGC Build Planner — Plan Your Build Before You Spend a Dollar",
    template: "%s · The SEGC Build Planner",
  },
  description:
    "Know your numbers before you spend a dollar. Plan your North Carolina custom home — cost, affordability, land, style, and timeline — with South Eastern General Contractors.",
}

export const viewport: Viewport = {
  themeColor: "#451E00",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

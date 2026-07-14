// /plan/brief — native project brief lands in Build Phase 4 (replaces Typeform).
// Stub keeps the funnel link honest until then.

import Link from "next/link"

export const metadata = { title: "Project Brief" }

export default function BriefStub() {
  const oswald = "var(--font-oswald), 'Oswald', sans-serif"
  return (
    <div style={{ alignItems: "center", background: "#451E00", color: "#FFFBF5", display: "flex", minHeight: "100vh", justifyContent: "center", padding: 28 }}>
      <div style={{ maxWidth: 560, textAlign: "left" }}>
        <div style={{ color: "#F4B214", fontFamily: oswald, fontSize: 14, fontWeight: 700, textTransform: "uppercase" }}>
          ■ PROJECT BRIEF ■
        </div>
        <h1 style={{ fontFamily: oswald, fontSize: "clamp(32px, 6vw, 54px)", fontWeight: 700, letterSpacing: "-1.6px", lineHeight: 1, margin: "14px 0 16px", textTransform: "uppercase" }}>
          THE BRIEF IS ALMOST READY.
        </h1>
        <p style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 15, lineHeight: 1.6, opacity: 0.8 }}>
          The in-app project brief is being built. For now, book a free design consultation and
          we’ll capture everything live.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 22 }}>
          <a
            href={process.env.NEXT_PUBLIC_CAL_LINK ?? "https://southeasterngc.com/contact"}
            style={{ background: "#F4B214", color: "#000", fontFamily: oswald, fontSize: 15, fontWeight: 700, padding: "16px 24px", textDecoration: "none", textTransform: "uppercase" }}
          >
            BOOK A FREE DESIGN CONSULTATION ›
          </a>
          <Link
            href="/plan"
            style={{ border: "1px solid #FFFBF5", color: "#FFFBF5", fontFamily: oswald, fontSize: 15, fontWeight: 700, padding: "15px 24px", textDecoration: "none", textTransform: "uppercase" }}
          >
            BACK TO MY BUILD PLAN ›
          </Link>
        </div>
      </div>
    </div>
  )
}

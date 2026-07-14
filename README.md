# The SEGC Build Planner

Standalone lead-generation web app for South Eastern General Contractors — `plan.southeasterngc.com`.
Take a custom-home prospect from "just curious" to "booked consultation": cost, affordability,
land, style, and timeline, with one shared visitor profile and one gate.

Companion docs: `SEGC_Build_Planner_Concept.md` (features) · `SEGC_Build_Planner_Stack.md` (architecture) · `SEGC_Design_Agent_Brief.md` (design).

## Status — Build Phase 2 complete

- ✅ **Phase 1 — Foundation**: pnpm monorepo, Drizzle schema (Neon), journey-ID middleware, design system (`packages/ui`), hub shell at `/plan`.
- ✅ **Phase 2 — Flagship**: Cost Estimator end-to-end — 8 steps, live blurred estimate, gate, server-computed unlock, fulfillment pipeline (PDF → R2 → email → Slack → HubSpot) via Inngest with an inline dev fallback.
- ⬜ Phase 3 — Modules 2–5 (engines already ported to `packages/engines`, tested).
- ⬜ Phase 4 — Dashboard result cards, magic links, native brief.
- ⬜ Phase 5 — Admin, PostHog, Turnstile widget, domain auth, redirects.

## Layout

```
apps/web            Next.js 15 (App Router) — UI + API routes + middleware
packages/engines    Pure-TS pricing/timeline engines (zero deps, vitest-covered)
packages/ui         Brand tokens + component library (Oswald/Inter, brown/gold)
packages/db         Drizzle schema + Neon client
packages/pdf        @react-pdf/renderer templates
packages/emails     Transactional email templates (HTML, brand-matched)
```

## Run it

```bash
pnpm install
pnpm dev          # http://localhost:3000 → redirects to /plan
pnpm test         # engine unit tests
pnpm typecheck
pnpm build
```

**Zero-config dev mode:** with no env vars set, the app runs fully in-memory —
leads/runs persist per server process, and email/Slack/HubSpot/R2 log to the console
instead of sending. Copy `.env.example` → `.env.local` and fill keys to go live one
integration at a time.

## The spine (how a lead flows)

1. Middleware issues an httpOnly `segc_jid` cookie (the anonymous journey).
2. Visitor configures a home; the SpecPanel shows a **blurred** live range.
3. Gate submit → `POST /api/unlock`: Zod-validated, Turnstile-checked (when configured),
   result **recomputed server-side**, lead + module_run written, profile updated.
4. Fulfillment (Inngest `lead/unlocked`, or inline in dev): render PDF → upload R2 →
   email via Resend (PDF attached) → Slack #leads alert → HubSpot upsert → mark fulfilled.
   Every step idempotent per module_run.
5. Returning visitors skip the gate everywhere; each completion enriches the same lead.

## Pricing truth

Every dollar figure lives in one CONFIG per engine in `packages/engines/src/*`,
marked `// PLACEHOLDER` until SEGC's real numbers land. Nothing else in the app
hardcodes a price.

## Known pre-launch TODOs

- Embed Oswald/Inter TTFs in the PDF templates (currently Helvetica).
- Turnstile client widget on the gate (server verify is wired; skipped when unset).
- Real style-card imagery (currently `webimages.southeasterngc.com` with gradient fallback).
- Swap `NEXT_PUBLIC_CAL_LINK` in once the Cal.com account exists.

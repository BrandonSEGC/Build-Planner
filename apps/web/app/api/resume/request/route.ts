// "Resume my Build Plan" — email is the identity. Always responds ok
// (no user enumeration); sends a single-use 24h magic link when a lead matches.

import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { magicLinkEmail } from "@segc/emails"
import { sendEmail } from "@/lib/integrations/email"
import { createMagicToken, findJourneyByEmail, recordEvent } from "@/lib/repo"

const schema = z.object({ email: z.string().trim().email().max(200) })

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 422 })
  }
  const email = parsed.data.email.toLowerCase()

  const journeyId = await findJourneyByEmail(email)
  if (journeyId) {
    const token = await createMagicToken(journeyId)
    const origin = request.nextUrl.origin
    const resumeUrl = `${origin}/api/resume?token=${token}`
    const result = await sendEmail({ to: email, content: magicLinkEmail({ resumeUrl }) })
    if (!result.delivered) {
      // Dev stub: surface the link in server logs so the flow is testable without Resend.
      console.info(`[resume:stub] magic link for ${email}: ${resumeUrl}`)
    }
    await recordEvent(journeyId, "magic_link_requested", {})
  }

  // Same response either way.
  return NextResponse.json({ ok: true })
}

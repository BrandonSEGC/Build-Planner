// Magic-link landing: consume the token, re-attach the journey cookie,
// and land on the dashboard with a welcome-back banner.

import { NextResponse, type NextRequest } from "next/server"
import { consumeMagicToken, recordEvent } from "@/lib/repo"

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")
  const journeyId = token ? await consumeMagicToken(token) : null

  if (!journeyId) {
    return NextResponse.redirect(new URL("/plan?resume=expired", request.url))
  }

  await recordEvent(journeyId, "magic_link_resumed", {})
  const response = NextResponse.redirect(new URL("/plan?resumed=1", request.url))
  response.cookies.set("segc_jid", journeyId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  })
  return response
}

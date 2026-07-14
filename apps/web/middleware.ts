import { NextResponse, type NextRequest } from "next/server"

const JOURNEY_COOKIE = "segc_jid"

/** Issues a first-party, httpOnly journey ID for every visitor.
 *  The journey ID is the anonymous identity that ties profile answers,
 *  module runs, and the eventual lead into one record. */
export function middleware(request: NextRequest) {
  const existing = request.cookies.get(JOURNEY_COOKIE)?.value
  const response = NextResponse.next()

  if (!existing) {
    const journeyId = crypto.randomUUID()
    response.cookies.set(JOURNEY_COOKIE, journeyId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    })
    // Make the fresh ID visible to this request's server components / routes.
    response.headers.set("x-segc-journey-id", journeyId)
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)).*)"],
}

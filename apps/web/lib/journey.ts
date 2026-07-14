import { cookies, headers } from "next/headers"

const JOURNEY_COOKIE = "segc_jid"

/** Reads the journey ID set by middleware (cookie on repeat requests,
 *  header on the very first request before the cookie lands). */
export async function getJourneyId(): Promise<string | null> {
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get(JOURNEY_COOKIE)?.value
  if (fromCookie) return fromCookie
  const headerStore = await headers()
  return headerStore.get("x-segc-journey-id")
}

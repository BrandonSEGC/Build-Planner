import { neon } from "@neondatabase/serverless"
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http"
import * as schema from "./schema"

export * as schema from "./schema"
export * from "./schema"

export type Db = NeonHttpDatabase<typeof schema>

let cached: Db | null = null

/** Returns a Drizzle client, or null when DATABASE_URL is unset (in-memory dev mode). */
export function getDb(): Db | null {
  const url = process.env.DATABASE_URL
  if (!url) return null
  if (!cached) cached = drizzle(neon(url), { schema })
  return cached
}

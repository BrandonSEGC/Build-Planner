// Data access layer. Uses Neon Postgres via Drizzle when DATABASE_URL is set;
// falls back to an in-memory store so the whole spine runs locally with zero setup.
// The in-memory store survives hot reloads via globalThis but NOT server restarts —
// it is a dev convenience, never a production mode.

import { and, eq, gt, isNull } from "drizzle-orm"
import { getDb, documents, events, leads, magicTokens, moduleRuns, profiles, visitors } from "@segc/db"

export interface LeadRecord {
  id: string
  name: string
  email: string
  phone: string
  consentAt: string
  hubspotId: string | null
}

export interface ModuleRunRecord {
  id: string
  visitorId: string
  journeyId: string
  toolId: string
  inputs: unknown
  outputs: unknown
  headlineResult: string
  completedAt: string
  fulfilledAt: string | null
}

export interface ProfileRecord {
  region?: string | null
  sqft?: number | null
  tier?: string | null
  style?: string | null
  timeline?: string | null
  landStatus?: string | null
}

/* ---------------- in-memory fallback ---------------- */

interface MemoryStore {
  visitors: Map<string, { id: string; journeyId: string }>
  profiles: Map<string, ProfileRecord>
  leads: Map<string, LeadRecord>
  runs: Map<string, ModuleRunRecord>
  documents: { moduleRunId: string; url: string; type: string }[]
  events: { visitorId: string | null; name: string; props: unknown; ts: string }[]
  magicTokens: Map<string, { journeyId: string; expiresAt: number; usedAt: number | null }>
}

function memory(): MemoryStore {
  const g = globalThis as typeof globalThis & { __segcMemory?: MemoryStore }
  if (!g.__segcMemory) {
    g.__segcMemory = {
      visitors: new Map(),
      profiles: new Map(),
      leads: new Map(),
      runs: new Map(),
      documents: [],
      events: [],
      magicTokens: new Map(),
    }
  }
  return g.__segcMemory
}

/* ---------------- api ---------------- */

export async function ensureVisitor(journeyId: string): Promise<{ id: string }> {
  const db = getDb()
  if (!db) {
    const store = memory()
    const existing = store.visitors.get(journeyId)
    if (existing) return existing
    const visitor = { id: crypto.randomUUID(), journeyId }
    store.visitors.set(journeyId, visitor)
    return visitor
  }
  const existing = await db.select().from(visitors).where(eq(visitors.journeyId, journeyId)).limit(1)
  if (existing[0]) return { id: existing[0].id }
  const inserted = await db
    .insert(visitors)
    .values({ journeyId })
    .onConflictDoNothing({ target: visitors.journeyId })
    .returning({ id: visitors.id })
  if (inserted[0]) return inserted[0]
  const raced = await db.select().from(visitors).where(eq(visitors.journeyId, journeyId)).limit(1)
  return { id: raced[0].id }
}

export async function getProfile(journeyId: string): Promise<ProfileRecord | null> {
  const db = getDb()
  if (!db) return memory().profiles.get(journeyId) ?? null
  const visitor = await ensureVisitor(journeyId)
  const rows = await db.select().from(profiles).where(eq(profiles.visitorId, visitor.id)).limit(1)
  return rows[0] ?? null
}

export async function upsertProfile(journeyId: string, patch: ProfileRecord): Promise<void> {
  const clean = Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined && value !== null),
  ) as ProfileRecord
  const db = getDb()
  if (!db) {
    const store = memory()
    store.profiles.set(journeyId, { ...(store.profiles.get(journeyId) ?? {}), ...clean })
    return
  }
  const visitor = await ensureVisitor(journeyId)
  await db
    .insert(profiles)
    .values({ visitorId: visitor.id, ...clean })
    .onConflictDoUpdate({
      target: profiles.visitorId,
      set: { ...clean, updatedAt: new Date() },
    })
}

export async function getLead(journeyId: string): Promise<LeadRecord | null> {
  const db = getDb()
  if (!db) return memory().leads.get(journeyId) ?? null
  const visitor = await ensureVisitor(journeyId)
  const rows = await db.select().from(leads).where(eq(leads.visitorId, visitor.id)).limit(1)
  const row = rows[0]
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    consentAt: row.consentAt.toISOString(),
    hubspotId: row.hubspotId,
  }
}

export async function upsertLead(
  journeyId: string,
  rawContact: { name: string; email: string; phone: string },
): Promise<LeadRecord> {
  // Normalize email on write so magic-link lookups by email always match.
  const contact = { ...rawContact, email: rawContact.email.trim().toLowerCase() }
  const db = getDb()
  if (!db) {
    const store = memory()
    const existing = store.leads.get(journeyId)
    if (existing) {
      const updated = { ...existing, ...contact }
      store.leads.set(journeyId, updated)
      return updated
    }
    const lead: LeadRecord = {
      id: crypto.randomUUID(),
      ...contact,
      consentAt: new Date().toISOString(),
      hubspotId: null,
    }
    store.leads.set(journeyId, lead)
    return lead
  }
  const visitor = await ensureVisitor(journeyId)
  const inserted = await db
    .insert(leads)
    .values({ visitorId: visitor.id, ...contact, consentAt: new Date() })
    .onConflictDoUpdate({
      target: leads.visitorId,
      set: { name: contact.name, email: contact.email, phone: contact.phone },
    })
    .returning()
  const row = inserted[0]
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    consentAt: row.consentAt.toISOString(),
    hubspotId: row.hubspotId,
  }
}

export async function setLeadHubspotId(journeyId: string, hubspotId: string): Promise<void> {
  const db = getDb()
  if (!db) {
    const lead = memory().leads.get(journeyId)
    if (lead) lead.hubspotId = hubspotId
    return
  }
  const visitor = await ensureVisitor(journeyId)
  await db.update(leads).set({ hubspotId }).where(eq(leads.visitorId, visitor.id))
}

export async function createModuleRun(input: {
  journeyId: string
  toolId: string
  inputs: unknown
  outputs: unknown
  headlineResult: string
}): Promise<ModuleRunRecord> {
  const db = getDb()
  if (!db) {
    const store = memory()
    const visitor = await ensureVisitor(input.journeyId)
    const run: ModuleRunRecord = {
      id: crypto.randomUUID(),
      visitorId: visitor.id,
      journeyId: input.journeyId,
      toolId: input.toolId,
      inputs: input.inputs,
      outputs: input.outputs,
      headlineResult: input.headlineResult,
      completedAt: new Date().toISOString(),
      fulfilledAt: null,
    }
    store.runs.set(run.id, run)
    return run
  }
  const visitor = await ensureVisitor(input.journeyId)
  const inserted = await db
    .insert(moduleRuns)
    .values({
      visitorId: visitor.id,
      toolId: input.toolId,
      inputs: input.inputs,
      outputs: input.outputs,
      headlineResult: input.headlineResult,
    })
    .returning()
  const row = inserted[0]
  return {
    id: row.id,
    visitorId: row.visitorId,
    journeyId: input.journeyId,
    toolId: row.toolId,
    inputs: row.inputs,
    outputs: row.outputs,
    headlineResult: row.headlineResult,
    completedAt: row.completedAt.toISOString(),
    fulfilledAt: row.fulfilledAt?.toISOString() ?? null,
  }
}

export async function getModuleRun(id: string): Promise<ModuleRunRecord | null> {
  const db = getDb()
  if (!db) return memory().runs.get(id) ?? null
  const rows = await db.select().from(moduleRuns).where(eq(moduleRuns.id, id)).limit(1)
  const row = rows[0]
  if (!row) return null
  const visitorRows = await db.select().from(visitors).where(eq(visitors.id, row.visitorId)).limit(1)
  return {
    id: row.id,
    visitorId: row.visitorId,
    journeyId: visitorRows[0]?.journeyId ?? "",
    toolId: row.toolId,
    inputs: row.inputs,
    outputs: row.outputs,
    headlineResult: row.headlineResult,
    completedAt: row.completedAt.toISOString(),
    fulfilledAt: row.fulfilledAt?.toISOString() ?? null,
  }
}

export async function listModuleRuns(journeyId: string): Promise<ModuleRunRecord[]> {
  const db = getDb()
  if (!db) {
    return [...memory().runs.values()].filter((run) => run.journeyId === journeyId)
  }
  const visitor = await ensureVisitor(journeyId)
  const rows = await db.select().from(moduleRuns).where(eq(moduleRuns.visitorId, visitor.id))
  return rows.map((row) => ({
    id: row.id,
    visitorId: row.visitorId,
    journeyId,
    toolId: row.toolId,
    inputs: row.inputs,
    outputs: row.outputs,
    headlineResult: row.headlineResult,
    completedAt: row.completedAt.toISOString(),
    fulfilledAt: row.fulfilledAt?.toISOString() ?? null,
  }))
}

export async function markRunFulfilled(id: string): Promise<void> {
  const db = getDb()
  if (!db) {
    const run = memory().runs.get(id)
    if (run) run.fulfilledAt = new Date().toISOString()
    return
  }
  await db.update(moduleRuns).set({ fulfilledAt: new Date() }).where(eq(moduleRuns.id, id))
}

export async function addDocument(moduleRunId: string, url: string, type: string): Promise<void> {
  const db = getDb()
  if (!db) {
    memory().documents.push({ moduleRunId, url, type })
    return
  }
  await db.insert(documents).values({ moduleRunId, url, type })
}

/* ---------------- magic links ---------------- */

/** Finds the journey ID for a lead by email (most recent wins). Null-safe: no user enumeration. */
export async function findJourneyByEmail(email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase()
  const db = getDb()
  if (!db) {
    for (const [journeyId, lead] of memory().leads) {
      if (lead.email.toLowerCase() === normalized) return journeyId
    }
    return null
  }
  const rows = await db
    .select({ visitorId: leads.visitorId })
    .from(leads)
    .where(eq(leads.email, normalized))
    .limit(1)
  if (!rows[0]) return null
  const visitorRows = await db
    .select({ journeyId: visitors.journeyId })
    .from(visitors)
    .where(eq(visitors.id, rows[0].visitorId))
    .limit(1)
  return visitorRows[0]?.journeyId ?? null
}

const MAGIC_TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export async function createMagicToken(journeyId: string): Promise<string> {
  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "")
  const db = getDb()
  if (!db) {
    memory().magicTokens.set(token, {
      journeyId,
      expiresAt: Date.now() + MAGIC_TOKEN_TTL_MS,
      usedAt: null,
    })
    return token
  }
  const visitor = await ensureVisitor(journeyId)
  await db.insert(magicTokens).values({
    visitorId: visitor.id,
    token,
    expiresAt: new Date(Date.now() + MAGIC_TOKEN_TTL_MS),
  })
  return token
}

/** Single-use, expiring. Returns the journeyId to re-attach, or null. */
export async function consumeMagicToken(token: string): Promise<string | null> {
  const db = getDb()
  if (!db) {
    const entry = memory().magicTokens.get(token)
    if (!entry || entry.usedAt || entry.expiresAt < Date.now()) return null
    entry.usedAt = Date.now()
    return entry.journeyId
  }
  const rows = await db
    .select()
    .from(magicTokens)
    .where(
      and(eq(magicTokens.token, token), isNull(magicTokens.usedAt), gt(magicTokens.expiresAt, new Date())),
    )
    .limit(1)
  const row = rows[0]
  if (!row) return null
  await db.update(magicTokens).set({ usedAt: new Date() }).where(eq(magicTokens.id, row.id))
  const visitorRows = await db
    .select({ journeyId: visitors.journeyId })
    .from(visitors)
    .where(eq(visitors.id, row.visitorId))
    .limit(1)
  return visitorRows[0]?.journeyId ?? null
}

export async function recordEvent(
  journeyId: string | null,
  name: string,
  props: Record<string, unknown> = {},
): Promise<void> {
  try {
    const db = getDb()
    if (!db) {
      memory().events.push({ visitorId: journeyId, name, props, ts: new Date().toISOString() })
      return
    }
    const visitorId = journeyId ? (await ensureVisitor(journeyId)).id : null
    await db.insert(events).values({ visitorId, name, props })
  } catch (error) {
    console.warn("[events] failed to record", name, error)
  }
}

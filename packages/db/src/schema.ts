// SEGC Build Planner — Postgres schema (Neon + Drizzle).
// Mirrors SEGC_Build_Planner_Stack.md §2.

import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

export const visitors = pgTable("visitors", {
  id: uuid("id").primaryKey().defaultRandom(),
  journeyId: text("journey_id").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmTerm: text("utm_term"),
  utmContent: text("utm_content"),
})

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  visitorId: uuid("visitor_id")
    .notNull()
    .unique()
    .references(() => visitors.id, { onDelete: "cascade" }),
  // shared cross-module answers
  region: text("region"),
  sqft: integer("sqft"),
  tier: text("tier"),
  style: text("style"),
  timeline: text("timeline"),
  landStatus: text("land_status"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    visitorId: uuid("visitor_id")
      .notNull()
      .unique()
      .references(() => visitors.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
    hubspotId: text("hubspot_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("leads_email_idx").on(table.email)],
)

export const moduleRuns = pgTable(
  "module_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    visitorId: uuid("visitor_id")
      .notNull()
      .references(() => visitors.id, { onDelete: "cascade" }),
    toolId: text("tool_id").notNull(), // estimator | affordability | land | style | timeline
    inputs: jsonb("inputs").notNull(),
    outputs: jsonb("outputs").notNull(),
    headlineResult: text("headline_result").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
    fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
  },
  (table) => [index("module_runs_visitor_idx").on(table.visitorId, table.toolId)],
)

export const planDrafts = pgTable(
  "plan_drafts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    visitorId: uuid("visitor_id")
      .notNull()
      .references(() => visitors.id, { onDelete: "cascade" }),
    toolId: text("tool_id").notNull(),
    step: integer("step").notNull().default(0),
    inputs: jsonb("inputs").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("plan_drafts_visitor_tool_idx").on(table.visitorId, table.toolId)],
)

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  moduleRunId: uuid("module_run_id")
    .notNull()
    .references(() => moduleRuns.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  type: text("type").notNull(), // e.g. custom-home-estimate
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    visitorId: uuid("visitor_id").references(() => visitors.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    props: jsonb("props"),
    ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("events_name_idx").on(table.name, table.ts)],
)

export const magicTokens = pgTable("magic_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  visitorId: uuid("visitor_id")
    .notNull()
    .references(() => visitors.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
})

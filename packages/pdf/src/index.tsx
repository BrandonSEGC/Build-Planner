// SEGC Build Planner — PDF templates (@react-pdf/renderer).
// Same brand tokens as the app. Letter size, brown header band, gold accents.
// NOTE: v1 uses built-in Helvetica; swap in embedded Oswald/Inter TTFs from the
// brand asset bucket before launch (Font.register) so type matches the app exactly.

import {
  Document,
  Page,
  renderToBuffer,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"
import { fmt } from "@segc/engines"

const BROWN = "#451E00"
const GOLD = "#F4B214"
const INK = "#141414"
const WARM = "#FFFBF5"
const GRAY = "#F5F5F5"

const styles = StyleSheet.create({
  page: { backgroundColor: "#FFFCFC", color: INK, fontFamily: "Helvetica", fontSize: 10, paddingBottom: 90 },
  header: { backgroundColor: BROWN, color: WARM, paddingHorizontal: 40, paddingVertical: 28 },
  preHeader: { color: GOLD, fontFamily: "Helvetica-Bold", fontSize: 10, letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" },
  brand: { color: WARM, fontFamily: "Helvetica-Bold", fontSize: 9, marginBottom: 14, textTransform: "uppercase" },
  h1: { fontFamily: "Helvetica-Bold", fontSize: 24, lineHeight: 1.05, textTransform: "uppercase" },
  body: { paddingHorizontal: 40, paddingTop: 28 },
  bigNumberLabel: { color: BROWN, fontFamily: "Helvetica-Bold", fontSize: 10, marginBottom: 6, textTransform: "uppercase" },
  bigNumber: { color: BROWN, fontFamily: "Helvetica-Bold", fontSize: 32 },
  sub: { color: "#5E574F", fontSize: 10, marginTop: 6 },
  section: { marginTop: 26 },
  tableHeader: {
    backgroundColor: GOLD,
    color: "#000000",
    flexDirection: "row",
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textTransform: "uppercase",
  },
  row: {
    borderBottomColor: "#E5E0D9",
    borderBottomStyle: "dashed",
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rowAlt: { backgroundColor: GRAY },
  cellLabel: { flexGrow: 1 },
  cellValue: { fontFamily: "Helvetica-Bold", textAlign: "right", width: 120 },
  ctaBand: { backgroundColor: BROWN, borderRadius: 8, marginTop: 30, padding: 24 },
  ctaHeading: { color: WARM, fontFamily: "Helvetica-Bold", fontSize: 18, marginBottom: 6, textTransform: "uppercase" },
  ctaText: { color: WARM, fontSize: 10, marginBottom: 14, opacity: 0.85 },
  ctaBtn: {
    backgroundColor: GOLD,
    color: "#000000",
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    marginRight: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    textTransform: "uppercase",
  },
  footer: {
    bottom: 30,
    color: "#857D72",
    fontSize: 7.5,
    left: 40,
    lineHeight: 1.4,
    position: "absolute",
    right: 40,
  },
})

export interface EstimatePdfData {
  name: string
  headline: string
  psfEff: number
  regionName: string
  styleName: string
  timeline: string
  sqft: number
  breakdown: [string, number][]
  bookingUrl: string
  briefUrl: string
  generatedAt: string
}

function EstimatePdf({ data }: { data: EstimatePdfData }) {
  const firstName = data.name.split(" ")[0] || data.name
  return (
    <Document
      author="South Eastern General Contractors"
      title={`SEGC Custom Home Estimate — ${data.name}`}
    >
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>South Eastern General Contractors</Text>
          <Text style={styles.preHeader}>■ CUSTOM HOME COST ESTIMATE ■</Text>
          <Text style={styles.h1}>
            {firstName.toUpperCase()}, HERE’S YOUR BUILD RANGE.
          </Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.bigNumberLabel}>Estimated planning range</Text>
          <Text style={styles.bigNumber}>{data.headline}</Text>
          <Text style={styles.sub}>
            {fmt(data.psfEff)} effective per sq ft · {data.sqft.toLocaleString("en-US")} sq ft ·{" "}
            {data.regionName} · {data.styleName}
          </Text>

          <View style={styles.section}>
            <View style={styles.tableHeader}>
              <Text style={styles.cellLabel}>Estimate breakdown</Text>
              <Text style={{ ...styles.cellValue, fontFamily: "Helvetica-Bold" }}>Amount</Text>
            </View>
            {data.breakdown.map(([label, value], index) => (
              <View key={label} style={index % 2 ? { ...styles.row, ...styles.rowAlt } : styles.row}>
                <Text style={styles.cellLabel}>{label}</Text>
                <Text style={styles.cellValue}>{fmt(value)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.ctaBand}>
            <Text style={styles.preHeader}>■ WHAT HAPPENS NEXT ■</Text>
            <Text style={styles.ctaHeading}>Turn this into a real plan.</Text>
            <Text style={styles.ctaText}>
              Bring this estimate to a free design consultation, or start your project brief — we’ll
              walk the numbers with you line by line.
            </Text>
            <View style={{ flexDirection: "row" }}>
              <Text style={styles.ctaBtn}>BOOK A FREE CONSULTATION ›</Text>
              <Text style={styles.ctaBtn}>START YOUR PROJECT BRIEF ›</Text>
            </View>
            <Text style={{ color: WARM, fontSize: 8, marginTop: 10, opacity: 0.7 }}>
              Book: {data.bookingUrl || "southeasterngc.com"} · Brief: {data.briefUrl || "southeasterngc.com"}
            </Text>
          </View>
        </View>
        <Text style={styles.footer} fixed>
          This is a directional planning range generated by The SEGC Build Planner on{" "}
          {data.generatedAt}. It is not a quote, bid, or offer to build. Final pricing depends on
          plans, site conditions, and selections. South Eastern General Contractors · Fayetteville,
          NC · 20+ Years · SBA 8(a) & HUBZone Certified.
        </Text>
      </Page>
    </Document>
  )
}

export async function renderEstimatePdf(data: EstimatePdfData): Promise<Buffer> {
  return renderToBuffer(<EstimatePdf data={data} />)
}

/* ---------- generic module report (affordability / land / style / timeline) ---------- */

export interface ModulePdfData {
  toolLabel: string // e.g. "AFFORDABILITY REPORT"
  name: string
  headline: string
  subline: string
  rows: [string, string][]
  note: string
  bookingUrl: string
  briefUrl: string
  generatedAt: string
}

function ModulePdf({ data }: { data: ModulePdfData }) {
  const firstName = data.name.split(" ")[0] || data.name
  return (
    <Document author="South Eastern General Contractors" title={`SEGC ${data.toolLabel} — ${data.name}`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>South Eastern General Contractors</Text>
          <Text style={styles.preHeader}>■ {data.toolLabel.toUpperCase()} ■</Text>
          <Text style={styles.h1}>{firstName.toUpperCase()}, HERE’S YOUR RESULT.</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.bigNumberLabel}>Your result</Text>
          <Text style={styles.bigNumber}>{data.headline}</Text>
          <Text style={styles.sub}>{data.subline}</Text>

          <View style={styles.section}>
            <View style={styles.tableHeader}>
              <Text style={styles.cellLabel}>Detail</Text>
              <Text style={{ ...styles.cellValue, fontFamily: "Helvetica-Bold", width: 220 }}>Value</Text>
            </View>
            {data.rows.map(([label, value], index) => (
              <View key={label + index} style={index % 2 ? { ...styles.row, ...styles.rowAlt } : styles.row}>
                <Text style={styles.cellLabel}>{label}</Text>
                <Text style={{ ...styles.cellValue, width: 220 }}>{value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.ctaBand}>
            <Text style={styles.preHeader}>■ WHAT HAPPENS NEXT ■</Text>
            <Text style={styles.ctaHeading}>Turn this into a real plan.</Text>
            <Text style={styles.ctaText}>{data.note}</Text>
            <View style={{ flexDirection: "row" }}>
              <Text style={styles.ctaBtn}>BOOK A FREE CONSULTATION ›</Text>
              <Text style={styles.ctaBtn}>START YOUR PROJECT BRIEF ›</Text>
            </View>
            <Text style={{ color: WARM, fontSize: 8, marginTop: 10, opacity: 0.7 }}>
              Book: {data.bookingUrl || "southeasterngc.com"} · Brief: {data.briefUrl || "southeasterngc.com"}
            </Text>
          </View>
        </View>
        <Text style={styles.footer} fixed>
          Generated by The SEGC Build Planner on {data.generatedAt}. This is directional planning
          guidance, not a quote, bid, lending decision, or offer to build. South Eastern General
          Contractors · Fayetteville, NC · 20+ Years · SBA 8(a) & HUBZone Certified.
        </Text>
      </Page>
    </Document>
  )
}

export async function renderModulePdf(data: ModulePdfData): Promise<Buffer> {
  return renderToBuffer(<ModulePdf data={data} />)
}

/* ---------- combined build-plan report ---------- */

export interface PlanPdfSection {
  toolLabel: string
  headline: string
  subline: string
  rows: [string, string][]
  note: string
  completedAt: string
}

export interface PlanPdfData {
  name: string
  generatedAt: string
  sections: PlanPdfSection[]
  bookingUrl: string
}

function PlanPdf({ data }: { data: PlanPdfData }) {
  const firstName = data.name.split(" ")[0] || data.name
  return (
    <Document
      author="South Eastern General Contractors"
      title={`SEGC Build Plan — ${data.name}`}
    >
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>South Eastern General Contractors</Text>
          <Text style={styles.preHeader}>■ YOUR UNIFIED BUILD PLAN ■</Text>
          <Text style={styles.h1}>{firstName.toUpperCase()}, YOUR PLAN IS TAKING SHAPE.</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.bigNumberLabel}>Completed planning chapters</Text>
          <Text style={styles.bigNumber}>
            {data.sections.length} OF 5
          </Text>
          <Text style={styles.sub}>
            A single summary of your home style, cost, budget, land, and timeline results.
          </Text>
          <View style={styles.ctaBand}>
            <Text style={styles.preHeader}>■ KEEP BUILDING THE PLAN ■</Text>
            <Text style={styles.ctaHeading}>Turn these results into a real project.</Text>
            <Text style={styles.ctaText}>
              Your answers carry between chapters and are saved for your next visit. Bring this
              report to a free design consultation and we will walk through it with you.
            </Text>
            <Text style={{ color: WARM, fontSize: 9 }}>{data.bookingUrl}</Text>
          </View>
        </View>
        <Text style={styles.footer} fixed>
          Generated by The SEGC Build Planner on {data.generatedAt}. This is directional planning
          guidance, not a quote, bid, lending decision, or offer to build.
        </Text>
      </Page>
      {data.sections.map((section, sectionIndex) => (
        <Page key={`${section.toolLabel}-${sectionIndex}`} size="LETTER" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.brand}>South Eastern General Contractors</Text>
            <Text style={styles.preHeader}>
              ■ CHAPTER {sectionIndex + 1} · {section.toolLabel.toUpperCase()} ■
            </Text>
            <Text style={styles.h1}>{section.headline}</Text>
          </View>
          <View style={styles.body}>
            <Text style={styles.sub}>{section.subline}</Text>
            <View style={styles.section}>
              <View style={styles.tableHeader}>
                <Text style={styles.cellLabel}>Plan detail</Text>
                <Text style={{ ...styles.cellValue, width: 220 }}>Result</Text>
              </View>
              {section.rows.map(([label, value], index) => (
                <View
                  key={`${label}-${index}`}
                  style={index % 2 ? { ...styles.row, ...styles.rowAlt } : styles.row}
                >
                  <Text style={styles.cellLabel}>{label}</Text>
                  <Text style={{ ...styles.cellValue, width: 220 }}>{value}</Text>
                </View>
              ))}
            </View>
            <View style={{ ...styles.ctaBand, marginTop: 24 }}>
              <Text style={styles.preHeader}>■ PLANNING NOTE ■</Text>
              <Text style={styles.ctaText}>{section.note}</Text>
              <Text style={{ color: WARM, fontSize: 8, opacity: 0.7 }}>
                Completed {section.completedAt}
              </Text>
            </View>
          </View>
          <Text style={styles.footer} fixed>
            SEGC Build Plan · {section.toolLabel} · Generated {data.generatedAt}. Directional
            planning guidance only.
          </Text>
        </Page>
      ))}
    </Document>
  )
}

export async function renderPlanPdf(data: PlanPdfData): Promise<Buffer> {
  return renderToBuffer(<PlanPdf data={data} />)
}

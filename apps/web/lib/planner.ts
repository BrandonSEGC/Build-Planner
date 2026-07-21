import type { ToolId } from "./schemas"

export interface PlanChapter {
  id: ToolId
  title: string
  shortTitle: string
  promise: string
  href: string
}

export const PLAN_CHAPTERS: PlanChapter[] = [
  {
    id: "style",
    title: "Discover Your Home Style",
    shortTitle: "Style",
    promise: "Define the architectural direction that carries through the rest of your plan.",
    href: "/plan/style",
  },
  {
    id: "estimator",
    title: "Design + Price Your Home",
    shortTitle: "Home",
    promise: "Shape the footprint, finishes, and features to create your planning range.",
    href: "/plan/estimator",
  },
  {
    id: "affordability",
    title: "Check Your Comfortable Budget",
    shortTitle: "Budget",
    promise: "Compare the plan with a practical, lender-aware monthly budget.",
    href: "/plan/affordability",
  },
  {
    id: "land",
    title: "Add Land + Site Costs",
    shortTitle: "Land",
    promise: "See the full project cost, including the expenses most house quotes leave out.",
    href: "/plan/land",
  },
  {
    id: "timeline",
    title: "Build Your Project Timeline",
    shortTitle: "Timeline",
    promise: "Turn the plan into a realistic phase-by-phase move-in window.",
    href: "/plan/timeline",
  },
]

export function isToolId(value: string): value is ToolId {
  return PLAN_CHAPTERS.some((chapter) => chapter.id === value)
}

export function getPlanChapter(toolId: string): PlanChapter | undefined {
  return PLAN_CHAPTERS.find((chapter) => chapter.id === toolId)
}

export function getNextPlanChapter(toolId: ToolId): PlanChapter | null {
  const index = PLAN_CHAPTERS.findIndex((chapter) => chapter.id === toolId)
  return PLAN_CHAPTERS[index + 1] ?? null
}

export function latestRunsByTool<T extends { toolId: string; completedAt: string }>(
  runs: T[],
): Map<string, T> {
  const latest = new Map<string, T>()
  for (const run of runs) {
    const current = latest.get(run.toolId)
    if (!current || run.completedAt > current.completedAt) latest.set(run.toolId, run)
  }
  return latest
}

export function nextIncompleteChapter(
  runs: { toolId: string; completedAt: string }[],
): PlanChapter | null {
  const completed = latestRunsByTool(runs)
  return PLAN_CHAPTERS.find((chapter) => !completed.has(chapter.id)) ?? null
}

"use client"

// Shared cross-module answers (the buildProfile store), hydrated from /api/profile.
// Enter sqft once → it prefills every other module.

import { create } from "zustand"

export interface BuildProfile {
  region?: string
  sqft?: number
  tier?: string
  style?: string
  timeline?: string
  landStatus?: string
}

export interface RecognizedLead {
  name: string
  email: string
}

interface BuildProfileStore {
  hydrated: boolean
  profile: BuildProfile
  lead: RecognizedLead | null
  runs: { toolId: string; headlineResult: string; completedAt: string }[]
  hydrate: () => Promise<void>
  patch: (patch: BuildProfile) => void
}

export const useBuildProfile = create<BuildProfileStore>((set, get) => ({
  hydrated: false,
  profile: {},
  lead: null,
  runs: [],
  hydrate: async () => {
    if (get().hydrated) return
    try {
      const response = await fetch("/api/profile", { cache: "no-store" })
      if (!response.ok) throw new Error(String(response.status))
      const data = await response.json()
      set({
        hydrated: true,
        profile: (data.profile ?? {}) as BuildProfile,
        lead: data.lead ?? null,
        runs: data.runs ?? [],
      })
    } catch {
      set({ hydrated: true })
    }
  },
  patch: (patch) => {
    set((state) => ({ profile: { ...state.profile, ...patch } }))
    // fire-and-forget server sync
    void fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => undefined)
  },
}))

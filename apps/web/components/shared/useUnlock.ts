"use client"

// Shared unlock plumbing for every module: POST /api/unlock, pending/error
// state, profile-store sync, and the recognized-lead gate skip.

import { useEffect, useState } from "react"
import type { Contact } from "@segc/ui"
import { useBuildProfile, type BuildProfile } from "@/lib/store"

export interface UnlockResponse {
  ok: boolean
  returning: boolean
  lead: { name: string; email: string }
  headline: string
  subline: string
  note: string
  result: unknown
  nextModule: string
  error?: string
}

export function useUnlock(toolId: string) {
  const [unlocked, setUnlocked] = useState<UnlockResponse | null>(null)
  const [pending, setPending] = useState(false)
  const [gateError, setGateError] = useState<string | null>(null)
  const { hydrate, hydrated, profile, lead, patch } = useBuildProfile()

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  async function unlock(contact: Contact | null, inputs: unknown, profilePatch?: BuildProfile) {
    setPending(true)
    setGateError(null)
    try {
      const response = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId, contact, inputs }),
      })
      const data = (await response.json()) as UnlockResponse
      if (!response.ok || !data.ok) {
        setGateError(data.error ?? "Something went wrong. Please try again.")
        return
      }
      if (profilePatch) patch(profilePatch)
      setUnlocked(data)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch {
      setGateError("Network error. Please try again.")
    } finally {
      setPending(false)
    }
  }

  return { unlocked, pending, gateError, unlock, hydrated, profile, lead }
}

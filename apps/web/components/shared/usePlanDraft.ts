"use client"

import { useEffect, useRef, useState } from "react"

interface StoredDraft<T> {
  toolId: string
  step: number
  inputs: T
  updatedAt: string
}

export function usePlanDraft<T>({
  toolId,
  step,
  inputs,
  maxStep,
  onRestore,
}: {
  toolId: string
  step: number
  inputs: T
  maxStep: number
  onRestore: (draft: { step: number; inputs: T }) => void
}) {
  const [ready, setReady] = useState(false)
  const [restored, setRestored] = useState(false)
  const restoreRef = useRef(onRestore)
  restoreRef.current = onRestore

  useEffect(() => {
    let active = true
    void fetch(`/api/plan/draft?toolId=${encodeURIComponent(toolId)}`)
      .then((response) => response.json() as Promise<{ draft: StoredDraft<T> | null }>)
      .then(({ draft }) => {
        if (!active) return
        if (draft) {
          restoreRef.current({
            step: Math.max(0, Math.min(maxStep, draft.step)),
            inputs: draft.inputs,
          })
          setRestored(true)
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setReady(true)
      })
    return () => {
      active = false
    }
  }, [maxStep, toolId])

  useEffect(() => {
    if (!ready) return
    const timeout = window.setTimeout(() => {
      void fetch("/api/plan/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId, step, inputs }),
      })
    }, 500)
    return () => window.clearTimeout(timeout)
  }, [inputs, ready, step, toolId])

  return { draftReady: ready, draftRestored: restored }
}

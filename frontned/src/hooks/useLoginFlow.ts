import { useEffect, useRef, useState } from 'react'
import { authApi } from '../api/authApi'
import { errorMessage } from '../api/http'
import { useAuthStore } from '../stores/authStore'
import type { LoginFlow, LoginMethod } from '../types'

/** Drives `claude auth login` on the backend and polls it until it finishes. */
export function useLoginFlow(onSuccess: () => void) {
  const [flow, setFlow] = useState<LoginFlow | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const timer = useRef<number | null>(null)

  const stopPolling = () => {
    if (timer.current) window.clearInterval(timer.current)
    timer.current = null
  }

  useEffect(() => stopPolling, [])

  const poll = (id: string) => {
    stopPolling()
    timer.current = window.setInterval(async () => {
      try {
        const next = await authApi.loginProgress(id)
        setFlow(next)
        if (next.state === 'success') {
          stopPolling()
          await useAuthStore.getState().refresh()
          onSuccess()
        } else if (next.state === 'error' || next.state === 'cancelled') {
          stopPolling()
        }
      } catch (err) {
        stopPolling()
        setError(errorMessage(err))
      }
    }, 1500)
  }

  return {
    flow,
    error,
    busy,
    start: async (method: LoginMethod) => {
      setError(null)
      setBusy(true)
      try {
        const started = await authApi.startLogin(method)
        setFlow(started)
        poll(started.id)
      } catch (err) {
        setError(errorMessage(err))
      } finally {
        setBusy(false)
      }
    },
    submitCode: async (code: string) => {
      if (!flow) return
      try {
        setFlow(await authApi.submitCode(flow.id, code))
      } catch (err) {
        setError(errorMessage(err))
      }
    },
    cancel: async () => {
      stopPolling()
      if (flow) await authApi.cancelLogin(flow.id).catch(() => undefined)
      setFlow(null)
    },
    saveApiKey: async (key: string) => {
      setError(null)
      setBusy(true)
      try {
        useAuthStore.getState().setStatus(await authApi.saveApiKey(key))
        onSuccess()
      } catch (err) {
        setError(errorMessage(err))
      } finally {
        setBusy(false)
      }
    },
  }
}

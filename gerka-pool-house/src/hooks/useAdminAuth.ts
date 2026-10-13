import type { Session } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'

import { getSupabaseClient, isSupabaseConfigured } from '../services/supabaseClient'

type AdminAuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'unconfigured'

export function useAdminAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<AdminAuthStatus>(() => (isSupabaseConfigured ? 'loading' : 'unconfigured'))

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return undefined
    }

    let active = true
    let unsubscribe: (() => void) | null = null
    let requestSequence = 0

    void getSupabaseClient().then((supabase) => {
      if (!active || !supabase) return

      const verifySession = async (nextSession: Session | null) => {
        const request = ++requestSequence
        if (!nextSession) {
          if (active) { setSession(null); setStatus('unauthenticated') }
          return
        }
        try {
          const { data, error } = await supabase.rpc('is_admin')
          if (!active || request !== requestSequence) return
          const allowed = !error && data === true
          setSession(allowed ? nextSession : null)
          setStatus(allowed ? 'authenticated' : 'unauthenticated')
        } catch {
          if (active && request === requestSequence) { setSession(null); setStatus('unauthenticated') }
        }
      }
      void supabase.auth.getSession().then(({ data }) => verifySession(data.session)).catch(() => verifySession(null))

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        // Defer database calls until the auth callback releases its internal lock.
        window.setTimeout(() => { if (active) void verifySession(nextSession) }, 0)
      })

      unsubscribe = () => subscription.unsubscribe()
    }).catch(() => { if (active) setStatus('unauthenticated') })

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = await getSupabaseClient()

    if (!supabase) {
      throw new Error('Supabase is not configured')
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) throw error
    const { data: isAdmin, error: membershipError } = await supabase.rpc('is_admin')
    if (membershipError || isAdmin !== true) {
      await supabase.auth.signOut()
      throw new Error('Administrator access required')
    }
  }, [])

  const signOut = useCallback(async () => {
    const supabase = await getSupabaseClient()

    if (!supabase) return

    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  return {
    session,
    status,
    signIn,
    signOut,
  }
}

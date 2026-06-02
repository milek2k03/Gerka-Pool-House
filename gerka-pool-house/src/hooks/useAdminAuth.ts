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

    void getSupabaseClient().then((supabase) => {
      if (!active || !supabase) return

      supabase.auth.getSession().then(({ data }) => {
        if (!active) return

        setSession(data.session)
        setStatus(data.session ? 'authenticated' : 'unauthenticated')
      })

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession)
        setStatus(nextSession ? 'authenticated' : 'unauthenticated')
      })

      unsubscribe = () => subscription.unsubscribe()
    })

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

    if (error) {
      throw error
    }
  }, [])

  const signOut = useCallback(async () => {
    const supabase = await getSupabaseClient()

    if (!supabase) return

    await supabase.auth.signOut()
  }, [])

  return {
    session,
    status,
    signIn,
    signOut,
  }
}

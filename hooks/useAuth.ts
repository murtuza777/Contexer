import { useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabaseConfigured, setSupabaseConfigured] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Test if Supabase is configured by checking if we can get the client
    const testSupabaseConfig = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        // If we get a response (even null session), Supabase is configured
        setSupabaseConfigured(true)
      } catch (error) {
        console.warn('⚠️ Supabase not configured. Authentication disabled.')
        setSupabaseConfigured(false)
        setLoading(false)
        return
      }
    }
    
    testSupabaseConfig()

    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
          // If we get a refresh token error, clear any stored session
          if (error.message?.includes('refresh token') || error.message?.includes('Invalid Refresh Token')) {
            console.log('Clearing invalid session due to refresh token error')
            await supabase.auth.signOut()
            setSession(null)
            setUser(null)
          }
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error('Unexpected error getting session:', error)
        // Clear session on any unexpected error
        setSession(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        console.log('Auth state change:', event, session?.user?.email)
        
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          setSession(session)
          setUser(session?.user ?? null)
        } else if (event === 'SIGNED_IN') {
          setSession(session)
          setUser(session?.user ?? null)
        } else if (event === 'INITIAL_SESSION') {
          setSession(session)
          setUser(session?.user ?? null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signUp = async (email: string, password: string, fullName?: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error signing up:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!supabaseConfigured) {
      console.warn('⚠️ Sign in attempted but Supabase not configured')
      return { 
        data: null, 
        error: { message: 'Authentication not available - Supabase not configured' } 
      }
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error signing in:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    if (!supabaseConfigured) {
      console.warn('⚠️ Google sign in attempted but Supabase not configured')
      return { 
        data: null, 
        error: { message: 'Authentication not available - Supabase not configured' } 
      }
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error signing in with Google:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Explicitly clear state after sign out
      setSession(null)
      setUser(null)
    } catch (error) {
      console.error('Error signing out:', error)
      // Even if sign out fails, clear local state
      setSession(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error resetting password:', error)
      return { error }
    }
  }

  return {
    user,
    session,
    loading,
    supabaseConfigured,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
  }
} 
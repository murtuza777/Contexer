'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient()
      
      try {
        // First, try to handle the OAuth callback
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error during auth callback:', error)
          
          // Handle specific token errors
          if (error.message?.includes('refresh token') || error.message?.includes('Invalid Refresh Token')) {
            console.log('Refresh token error, clearing session and redirecting to login')
            await supabase.auth.signOut()
            router.push('/?error=token_expired')
            return
          }
          
          router.push('/?error=auth_callback_error')
          return
        }

        if (data.session) {
          // Successfully authenticated, redirect to dashboard
          console.log('Auth callback successful, redirecting to dashboard')
          router.push('/')
        } else {
          // No session found, redirect to login
          console.log('No session found after callback')
          router.push('/?error=no_session')
        }
      } catch (error) {
        console.error('Unexpected error during auth callback:', error)
        router.push('/?error=unexpected_error')
      }
    }

    // Handle OAuth callback from URL params
    const handleOAuthCallback = async () => {
      const supabase = createClient()
      const urlParams = new URLSearchParams(window.location.search)
      
      if (urlParams.get('code')) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(urlParams.get('code')!)
          if (error) {
            console.error('Error exchanging code for session:', error)
            router.push('/?error=oauth_exchange_error')
            return
          }
        } catch (error) {
          console.error('Error in OAuth code exchange:', error)
        }
      }
      
      // After handling OAuth, get the session
      await handleAuthCallback()
    }

    handleOAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-black flex items-center justify-center px-4">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Completing sign in...</h2>
        <p className="text-gray-300">Please wait while we finish setting up your account.</p>
      </div>
    </div>
  )
} 
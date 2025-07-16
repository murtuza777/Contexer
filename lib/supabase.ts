import { createBrowserClient } from '@supabase/ssr'

// Mock user storage for demo authentication
const MOCK_USERS_KEY = 'contexer_mock_users'
const MOCK_SESSION_KEY = 'contexer_mock_session'

interface MockUser {
  id: string
  email: string
  user_metadata: {
    full_name?: string
    avatar_url?: string
  }
  created_at: string
}

interface MockSession {
  user: MockUser
  access_token: string
  refresh_token: string
  expires_at: number
}

// Mock authentication helpers
const getMockUsers = (): MockUser[] => {
  if (typeof window === 'undefined') return []
  const users = localStorage.getItem(MOCK_USERS_KEY)
  return users ? JSON.parse(users) : []
}

const saveMockUsers = (users: MockUser[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users))
}

const getMockSession = (): MockSession | null => {
  if (typeof window === 'undefined') return null
  const session = localStorage.getItem(MOCK_SESSION_KEY)
  if (!session) return null
  
  const parsedSession = JSON.parse(session)
  // Check if session is expired
  if (parsedSession.expires_at < Date.now()) {
    localStorage.removeItem(MOCK_SESSION_KEY)
    return null
  }
  return parsedSession
}

const saveMockSession = (session: MockSession) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session))
}

const clearMockSession = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(MOCK_SESSION_KEY)
}

const createMockUser = (email: string, fullName?: string): MockUser => ({
  id: `mock-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  email,
  user_metadata: {
    full_name: fullName || email.split('@')[0],
    avatar_url: undefined
  },
  created_at: new Date().toISOString()
})

const createMockSession = (user: MockUser): MockSession => ({
  user,
  access_token: `mock-token-${Date.now()}`,
  refresh_token: `mock-refresh-${Date.now()}`,
  expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
})

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  

  
  // Handle missing or placeholder Supabase credentials gracefully
  if (!supabaseUrl || !supabaseKey || 
      supabaseUrl === 'your_supabase_url_here' || 
      supabaseKey === 'your_supabase_anon_key_here' ||
      supabaseUrl === 'https://placeholder.supabase.co' ||
      supabaseKey === 'placeholder_anon_key') {
    console.warn('⚠️ Supabase credentials incomplete. Using enhanced mock client with working authentication.')
    
    // Enhanced mock client with working authentication
    const authStateListeners: ((event: string, session: MockSession | null) => void)[] = []
    
    return {
      auth: {
        getUser: () => {
          const session = getMockSession()
          return Promise.resolve({ 
            data: { user: session?.user || null }, 
            error: null 
          })
        },
        getSession: () => {
          const session = getMockSession()
          return Promise.resolve({ 
            data: { session }, 
            error: null 
          })
        },
        signOut: () => {
          clearMockSession()
          // Notify listeners
          authStateListeners.forEach(listener => {
            listener('SIGNED_OUT', null)
          })
          return Promise.resolve({ error: null })
        },
        signUp: ({ email, password, options }: { email: string, password: string, options?: { data?: { full_name?: string } } }) => {
          const users = getMockUsers()
          const existingUser = users.find(u => u.email === email)
          
          if (existingUser) {
            return Promise.resolve({ 
              data: { user: null, session: null }, 
              error: { message: 'User already registered' } 
            })
          }
          
          // Create new user
          const newUser = createMockUser(email, options?.data?.full_name)
          users.push(newUser)
          saveMockUsers(users)
          
          // Create session
          const session = createMockSession(newUser)
          saveMockSession(session)
          
          // Notify listeners
          authStateListeners.forEach(listener => {
            listener('SIGNED_IN', session)
          })
          
          return Promise.resolve({ 
            data: { user: newUser, session }, 
            error: null 
          })
        },
        signInWithPassword: ({ email, password }: { email: string, password: string }) => {
          const users = getMockUsers()
          const user = users.find(u => u.email === email)
          
          if (!user) {
            return Promise.resolve({ 
              data: { user: null, session: null }, 
              error: { message: 'Invalid login credentials' } 
            })
          }
          
          // Create session
          const session = createMockSession(user)
          saveMockSession(session)
          
          // Notify listeners
          authStateListeners.forEach(listener => {
            listener('SIGNED_IN', session)
          })
          
          return Promise.resolve({ 
            data: { user, session }, 
            error: null 
          })
        },
        signInWithOAuth: ({ provider, options }: { provider: string, options?: any }) => {
          // Simulate Google OAuth
          if (provider === 'google') {
            const email = 'demo@google.com'
            const fullName = 'Google Demo User'
            
            let users = getMockUsers()
            let user = users.find(u => u.email === email)
            
            if (!user) {
              user = createMockUser(email, fullName)
              users.push(user)
              saveMockUsers(users)
            }
            
            // Create session
            const session = createMockSession(user)
            saveMockSession(session)
            
            // Notify listeners
            setTimeout(() => {
              authStateListeners.forEach(listener => {
                listener('SIGNED_IN', session)
              })
            }, 500) // Simulate OAuth delay
            
            return Promise.resolve({ 
              data: { provider: 'google', url: null }, 
              error: null 
            })
          }
          
          return Promise.resolve({ 
            data: { provider: null, url: null }, 
            error: { message: 'OAuth provider not supported in mock mode' } 
          })
        },
        resetPasswordForEmail: ({ email }: { email: string }) => {
          // Simulate password reset
          return Promise.resolve({ 
            data: null, 
            error: null 
          })
        },
        onAuthStateChange: (callback: (event: string, session: MockSession | null) => void) => {
          authStateListeners.push(callback)
          
          // Send initial session
          setTimeout(() => {
            const session = getMockSession()
            callback('INITIAL_SESSION', session)
          }, 100)
          
          return { 
            data: { 
              subscription: { 
                unsubscribe: () => {
                  const index = authStateListeners.indexOf(callback)
                  if (index > -1) {
                    authStateListeners.splice(index, 1)
                  }
                } 
              } 
            } 
          }
        }
      },
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null }),
        upsert: () => Promise.resolve({ data: null, error: null }),
        eq: function() { return this },
        single: function() { return this },
        order: function() { return this },
        limit: function() { return this },
        range: function() { return this }
      }),
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ data: null, error: { message: 'Storage not available in mock mode' } }),
          download: () => Promise.resolve({ data: null, error: { message: 'Storage not available in mock mode' } }),
          remove: () => Promise.resolve({ data: null, error: { message: 'Storage not available in mock mode' } }),
          list: () => Promise.resolve({ data: [], error: null })
        })
      },
      realtime: {
        channel: () => ({
          on: () => ({}),
          subscribe: () => ({}),
          unsubscribe: () => ({})
        })
      }
    } as any
  }
  
  return createBrowserClient(supabaseUrl, supabaseKey)
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          status: 'active' | 'completed' | 'paused'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          status?: 'active' | 'completed' | 'paused'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          status?: 'active' | 'completed' | 'paused'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '../utils/supabase'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { User } from '@/types/user'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  signIn: async () => ({ error: null }),
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = async (authUser: SupabaseUser): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, is_enabled, avatar_url, updated_at, created_at, gender, total_points, total_matches, won_matches')
        .eq('id', authUser.id)
        .single<User>() // 👈 添加泛型
  
      if (error || !data) {
        console.error('Error fetching user profile:', error)
        return null
      }
  
      return data // 👈 类型已确定，无需 `as User`
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      return null
    }
  }
  

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Session error:', sessionError)
          if (mounted) {
            setUser(null)
            setLoading(false)
          }
          return
        }

        if (session?.user) {
          console.log('Existing session found:', session.user.id)
          const profile = await fetchUserProfile(session.user)
          if (mounted) {
            setUser(profile)
          }
        } else {
          if (mounted) {
            setUser(null)
          }
        }
      } catch (error) {
        console.error('Error in initializeAuth:', error)
        if (mounted) {
          setUser(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)

      if (session?.user) {
        const profile = await fetchUserProfile(session.user)
        if (mounted) {
          setUser(profile)
        }
      } else {
        if (mounted) {
          setUser(null)
        }
      }

      if (mounted) {
        setLoading(false)
      }
    })

    initializeAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      console.error('Error in signIn:', error)
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
        return
      }
      setUser(null)
    } catch (error) {
      console.error('Error in signOut:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, signIn }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '../utils/supabase'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { User } from '@/types/user'

// 定义上下文类型
interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

// 创建认证提供者组件
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // 获取用户完整信息
  const fetchUserProfile = async (authUser: SupabaseUser) => {
    try {
      console.log('Fetching user profile for:', authUser.id)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      console.log('Fetched user profile:', data)
      return data
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      return null
    }
  }

  useEffect(() => {
    let mounted = true

    // 获取当前会话用户
    const getUser = async () => {
      try {
        console.log('Getting current user...')
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          console.error('Auth error:', authError)
          if (mounted) {
            setUser(null)
            setLoading(false)
          }
          return
        }

        if (authUser) {
          console.log('Auth user found:', authUser)
          const profile = await fetchUserProfile(authUser)
          if (mounted) {
            setUser(profile)
          }
        } else {
          console.log('No auth user found')
          if (mounted) {
            setUser(null)
          }
        }
      } catch (error) {
        console.error('Error in getUser:', error)
        if (mounted) {
          setUser(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // 监听认证状态变化
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

    getUser()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

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

  // 添加调试信息
  console.log('AuthContext state:', { user, loading })

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// 创建自定义 Hook
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
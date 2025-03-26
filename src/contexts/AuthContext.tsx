import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '../utils/supabase'
import { User } from '@supabase/supabase-js'

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

  useEffect(() => {
    // 获取当前会话用户
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    getUser()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// 创建自定义 Hook
export const useAuth = () => {
  return useContext(AuthContext)
}
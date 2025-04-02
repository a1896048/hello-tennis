import { ReactNode } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter()
  const { user, signOut, loading } = useAuth()
  const [userName, setUserName] = useState<string>('')

  useEffect(() => {
    async function fetchUserName() {
      if (user?.id) {
        const { data, error } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single()
        
        if (data && !error) {
          setUserName(data.name)
        }
      }
    }
    fetchUserName()
  }, [user?.id])

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">Hello Tennis</h1>
              </div>
            </div>
            <div className="flex items-center">
              {!loading && (
                user ? (
                  <>
                    <span className="mr-4">欢迎, {userName || '加载中...'}</span>
                    <button 
                      onClick={() => signOut()}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    >
                      退出
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => router.push('/auth/login')}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
                    >
                      登录
                    </button>
                    <button 
                      onClick={() => router.push('/auth/register')}
                      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                    >
                      注册
                    </button>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
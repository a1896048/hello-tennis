import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/utils/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/router'
import type { Database } from '@/types/database.types'

type User = Database['public']['Tables']['users']['Row']

export default function AdminDashboard() {
  const { user: currentUser } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  const checkAdminAccess = useCallback(async () => {
    if (!currentUser) {
      router.push('/')
      return
    }

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser.id)
        .single()

      if (!userData || userData.role !== 'admin') {
        router.push('/')
      }
    } catch (err) {
      console.error('Error checking admin access:', err)
      router.push('/')
    }
  }, [currentUser, router])

  useEffect(() => {
    const init = async () => {
      try {
        await checkAdminAccess()
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [checkAdminAccess])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">管理员控制台</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button
          onClick={() => router.push('/admin/users')}
          className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">用户管理</h2>
          <p className="text-gray-600">管理用户账号和权限</p>
        </button>

        <button
          onClick={() => router.push('/admin/matches')}
          className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">比赛管理</h2>
          <p className="text-gray-600">查看和管理比赛记录</p>
        </button>

        <button
          onClick={() => router.push('/admin/leaderboard')}
          className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">排行榜管理</h2>
          <p className="text-gray-600">查看和管理排行榜</p>
        </button>

        <button
          onClick={() => router.push('/admin/settings')}
          className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">系统设置</h2>
          <p className="text-gray-600">管理系统配置</p>
        </button>
      </div>
    </div>
  )
} 
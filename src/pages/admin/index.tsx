import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/utils/supabase'
import { User } from '@/types/user'

export default function AdminDashboard() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const checkAdminAccess = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: userData, error: authError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (authError || userData?.role !== 'admin') {
        router.push('/')
        return
      }
      setCurrentUser(userData)
    } else {
      router.push('/auth/login')
    }
  }, [router])

  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setUsers(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    checkAdminAccess()
    fetchUsers()
  }, [checkAdminAccess, fetchUsers])

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('确定要删除此用户吗？')) return

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (!error) {
      await supabase.auth.admin.deleteUser(userId)
      fetchUsers()
    }
  }

  const handleToggleUserStatus = async (userId: string, isEnabled: boolean) => {
    const { error } = await supabase
      .from('users')
      .update({ is_enabled: !isEnabled })
      .eq('id', userId)

    if (!error) {
      fetchUsers()
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">加载中...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">管理员控制台</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-100 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">总用户数</h3>
          <p className="text-3xl font-bold">{users.length}</p>
        </div>
        {/* 可以添加更多统计卡片 */}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">用户管理</h2>
          <button
            onClick={() => router.push('/admin/matches')}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            比赛管理
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  邮箱
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  角色
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role === 'admin' ? '管理员' : '用户'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.is_enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_enabled ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => router.push(`/admin/users/${user.id}`)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleToggleUserStatus(user.id, user.is_enabled)}
                      className={`${
                        user.is_enabled ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'
                      }`}
                    >
                      {user.is_enabled ? '禁用' : '启用'}
                    </button>
                    {user.id !== currentUser?.id && (
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 
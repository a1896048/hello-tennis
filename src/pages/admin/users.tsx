import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function UserManagement() {
  const { user: currentUser, loading: authLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])  // 存储所有用户
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')  // 搜索关键词

  // 获取所有用户
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setAllUsers(data || [])  // 保存所有用户
        setUsers(data || [])     // 初始显示所有用户
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // 搜索用户
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setUsers(allUsers)  // 如果搜索框为空，显示所有用户
      return
    }

    const filteredUsers = allUsers.filter(user => 
      (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
    setUsers(filteredUsers)
  }, [searchTerm, allUsers])

  // 检查权限
  useEffect(() => {
    if (!authLoading && (!currentUser || currentUser.role !== 'admin')) {
      router.push('/')
    }
  }, [authLoading, currentUser, router])

  // 删除用户
  const deleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`确定要删除用户 "${userName}" 吗？此操作不可恢复。`)) {
      return
    }

    try {
      // 调用自定义函数完全删除用户
      const { error } = await supabase
        .rpc('delete_user_complete', {
          user_id: userId
        })

      if (error) throw error

      // 更新本地状态
      setUsers(users.filter(user => user.id !== userId))
      alert('用户删除成功')
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('删除用户失败，请重试')
    }
  }

  // 启用/禁用用户
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_enabled: !currentStatus })
        .eq('id', userId)

      if (error) throw error

      // 更新本地状态
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, is_enabled: !currentStatus }
          : user
      ))
    } catch (error) {
      console.error('Error updating user status:', error)
      alert('更新用户状态失败，请重试')
    }
  }

  // 设置/取消管理员权限
  const toggleAdminRole = async (userId: string, currentRole: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: currentRole === 'admin' ? 'user' : 'admin' })
        .eq('id', userId)

      if (error) throw error

      // 更新本地状态
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: currentRole === 'admin' ? 'user' : 'admin' }
          : user
      ))
    } catch (error) {
      console.error('Error updating user role:', error)
      alert('更新用户角色失败，请重试')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return null
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">用户管理</h1>
          <div className="space-x-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              返回
            </Link>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索用户名或邮箱..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            共找到 {users.length} 个用户
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  邮箱
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  注册时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  角色
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.is_enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_enabled ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role === 'admin' ? '管理员' : '普通用户'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => toggleUserStatus(user.id, user.is_enabled)}
                      className={`${
                        user.is_enabled
                          ? 'text-red-600 hover:text-red-900'
                          : 'text-green-600 hover:text-green-900'
                      }`}
                    >
                      {user.is_enabled ? '禁用' : '启用'}
                    </button>
                    <button
                      onClick={() => toggleAdminRole(user.id, user.role)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {user.role === 'admin' ? '取消管理员' : '设为管理员'}
                    </button>
                    <button
                      onClick={() => deleteUser(user.id, user.name)}
                      className="text-red-600 hover:text-red-900"
                    >
                      删除
                    </button>
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
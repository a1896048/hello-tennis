import { useState } from 'react'
import { supabase } from '@/utils/supabase'
import { useRouter } from 'next/router'
import { useAuth } from '@/contexts/AuthContext'

export default function SetAdmin() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSetAdmin = async () => {
    if (!currentUser?.id) {
      setError('请先登录')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // 更新用户角色为管理员
      const { error } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', currentUser.id)

      if (error) throw error

      setSuccess(true)
      // 3秒后返回主页
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } catch (error) {
      console.error('Error setting admin:', error)
      setError(error instanceof Error ? error.message : '设置失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">设置管理员权限</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">设置成功！3秒后返回主页...</span>
        </div>
      )}

      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          当前用户：{currentUser?.name} ({currentUser?.email})
        </p>
        <p className="text-gray-600 mb-4">
          当前角色：{currentUser?.role || '普通用户'}
        </p>
      </div>

      <button
        onClick={handleSetAdmin}
        disabled={loading || success}
        className={`w-full font-bold py-2 px-4 rounded ${
          loading || success
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-purple-500 hover:bg-purple-600 text-white'
        }`}
      >
        {loading ? '设置中...' : '设置为管理员'}
      </button>
    </div>
  )
} 
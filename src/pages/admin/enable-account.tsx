import { useState } from 'react'
import { supabase } from '@/utils/supabase'
import { useRouter } from 'next/router'

export default function EnableAccount() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleEnableAccount = async () => {
    if (!email) {
      setError('请输入邮箱地址')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // 先获取用户信息
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (userError) {
        throw new Error('未找到该用户')
      }

      // 启用账号
      const { error } = await supabase
        .from('users')
        .update({ is_enabled: true })
        .eq('id', userData.id)

      if (error) throw error

      setSuccess(true)
      // 3秒后返回主页
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } catch (error) {
      console.error('Error enabling account:', error)
      setError(error instanceof Error ? error.message : '启用账号失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">启用账号</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">账号已启用！3秒后跳转到登录页面...</span>
        </div>
      )}

      <div className="mb-6">
        <label className="block text-gray-700 mb-2">邮箱地址</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="请输入您的邮箱地址"
          required
        />
      </div>

      <button
        onClick={handleEnableAccount}
        disabled={loading || success}
        className={`w-full font-bold py-2 px-4 rounded ${
          loading || success
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {loading ? '启用中...' : '启用账号'}
      </button>
    </div>
  )
} 
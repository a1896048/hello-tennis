import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../utils/supabase'

export default function Register() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    gender: 'male' as 'male' | 'female'
  })

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      console.log('开始注册流程')

      // 1. 检查邮箱是否已存在
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', formData.email)
        .single()

      if (checkError) {
        console.error('检查用户是否存在时出错:', checkError)
        // PGRST116 是"没有找到记录"的错误码，这是正常的，说明邮箱未被注册
        if (checkError.code !== 'PGRST116') {
          if (checkError.code === '42703') {
            throw new Error('数据库结构错误：email 字段不存在')
          } else if (checkError.message.includes('permission denied')) {
            throw new Error('权限错误：无法查询用户信息')
          } else {
            throw new Error(`检查用户信息时出错: ${checkError.message}`)
          }
        }
      }

      if (existingUsers) {
        throw new Error('该邮箱已被注册')
      }

      // 2. 创建认证用户
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            gender: formData.gender
          }
        }
      })

      if (authError) {
        console.error('认证用户创建失败:', authError)
        if (authError.message.includes('Email rate limit exceeded')) {
          throw new Error('该邮箱注册过于频繁，请稍后再试')
        }
        throw new Error(authError.message || '认证创建失败')
      }

      if (!authData.user?.id) {
        throw new Error('未获取到用户ID')
      }

      console.log('认证用户创建成功，ID:', authData.user.id)

      // 3. 创建用户信息
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: formData.email,
            name: formData.name,
            gender: formData.gender,
            total_points: 0,
            total_matches: 0,
            won_matches: 0
          }
        ])

      if (profileError) {
        console.error('用户信息创建失败:', profileError)
        
        // 如果创建用户信息失败，尝试删除认证用户
        try {
          await supabase.auth.admin.deleteUser(authData.user.id)
        } catch (deleteError) {
          console.error('清理认证用户失败:', deleteError)
        }

        if (profileError.code === '23505') {
          throw new Error('该用户信息已存在')
        } else if (profileError.code === '42501') {
          throw new Error('没有权限创建用户信息')
        } else if (profileError.code === '42703') {
          throw new Error('数据库结构错误：缺少必要的字段')
        } else {
          throw new Error(`创建用户信息失败: ${profileError.message}`)
        }
      }

      console.log('注册成功，正在跳转到登录页面')
      router.push('/auth/login')
    } catch (error) {
      console.error('注册过程中发生错误:', error)
      setError(error instanceof Error ? error.message : '注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">注册</h2>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <form onSubmit={handleRegister}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">邮箱</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">密码</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
            minLength={6}
          />
          <p className="text-sm text-gray-500 mt-1">密码至少需要6个字符</p>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">姓名</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2">性别</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full font-bold py-2 px-4 rounded ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? '注册中...' : '注册'}
        </button>
      </form>
    </div>
  )
}
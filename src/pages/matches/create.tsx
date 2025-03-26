import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../utils/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface User {
  id: string
  name: string
}

export default function CreateMatch() {
  const router = useRouter()
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  
  const [formData, setFormData] = useState({
    match_type: 'singles' as 'singles' | 'doubles',  // 新增：比赛类型
    player2_id: '',
    teammate_id: '',  // 新增：队友ID
    match_date: new Date().toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取所有用户列表
  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .neq('id', user?.id) // 排除当前用户

      if (!error && data) {
        setUsers(data)
      }
    }
    fetchUsers()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const matchData = {
        player1_id: user?.id,
        player2_id: formData.player2_id,
        match_date: formData.match_date,
        status: 'pending',
        player1_score: 0,
        player2_score: 0,
        match_type: formData.match_type,
        teammate_id: formData.match_type === 'doubles' ? formData.teammate_id : null
      }

      const { error: matchError } = await supabase
        .from('matches')
        .insert([matchData])

      if (matchError) throw matchError

      router.push('/matches')
    } catch (error) {
      setError(error instanceof Error ? error.message : '创建比赛失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">创建新比赛</h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* 比赛类型选择 */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">比赛类型</label>
          <select
            name="match_type"
            value={formData.match_type}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              match_type: e.target.value as 'singles' | 'doubles' 
            }))}
            className="w-full p-2 border rounded"
          >
            <option value="singles">单打</option>
            <option value="doubles">双打</option>
          </select>
        </div>

        {/* 对手选择 */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">对手</label>
          <select
            name="player2_id"
            value={formData.player2_id}
            onChange={(e) => setFormData(prev => ({ ...prev, player2_id: e.target.value }))}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">选择对手</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        {/* 双打时显示队友选择 */}
        {formData.match_type === 'doubles' && (
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">队友</label>
            <select
              name="teammate_id"
              value={formData.teammate_id}
              onChange={(e) => setFormData(prev => ({ ...prev, teammate_id: e.target.value }))}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">选择队友</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 比赛日期 */}
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">比赛日期</label>
          <input
            type="date"
            name="match_date"
            value={formData.match_date}
            onChange={(e) => setFormData(prev => ({ ...prev, match_date: e.target.value }))}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {loading ? '创建中...' : '创建比赛'}
        </button>
      </form>
    </div>
  )
}
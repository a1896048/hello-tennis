import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/utils/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/router'
import type { Database } from '@/types/database.types'

type User = Database['public']['Tables']['users']['Row']
type Match = Database['public']['Tables']['matches']['Row']

type Set = {
  player1_score: number
  player2_score: number
  tiebreak?: {
    player1_score: number
    player2_score: number
  }
}

export default function EditMatch() {
  const { user: currentUser } = useAuth()
  const router = useRouter()
  const { id } = router.query
  const [match, setMatch] = useState<Match | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
    checkAdminAccess()
  }, [checkAdminAccess])

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return

      try {
        // Fetch match data
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .select('*')
          .eq('id', id)
          .single()

        if (matchError) {
          console.error('Error fetching match:', matchError)
          return
        }

        if (matchData) {
          setMatch(matchData)
        }

        // Fetch users
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })

        if (usersError) {
          console.error('Error fetching users:', usersError)
          return
        }

        if (usersData) {
          setUsers(usersData)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleSave = async () => {
    if (!match) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('matches')
        .update({
          player1_id: match.player1_id,
          player2_id: match.player2_id,
          match_date: match.match_date,
          match_type: match.match_type,
          teammate_id: match.teammate_id,
          opponent2_id: match.opponent2_id,
          sets: match.sets,
          player1_score: match.sets.reduce((sum, set) => sum + set.player1_score, 0),
          player2_score: match.sets.reduce((sum, set) => sum + set.player2_score, 0),
          player1_points: match.sets.reduce((sum, set) => sum + set.player1_score, 0),
          player2_points: match.sets.reduce((sum, set) => sum + set.player2_score, 0)
        })
        .eq('id', id)

      if (error) {
        console.error('Error updating match:', error)
        alert('保存失败')
        return
      }

      alert('保存成功')
      router.push('/admin/matches')
    } catch (error) {
      console.error('Error:', error)
      alert('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleSetScoreChange = (index: number, field: 'player1_score' | 'player2_score', value: string) => {
    if (!match) return

    const newSets = [...match.sets]
    newSets[index] = {
      ...newSets[index],
      [field]: parseInt(value) || 0
    }

    setMatch({ ...match, sets: newSets })
  }

  const handleTiebreakScoreChange = (index: number, field: 'player1_score' | 'player2_score', value: string) => {
    if (!match) return

    const newSets = [...match.sets]
    newSets[index] = {
      ...newSets[index],
      tiebreak: {
        ...(newSets[index].tiebreak || { player1_score: 0, player2_score: 0 }),
        [field]: parseInt(value) || 0
      }
    }

    setMatch({ ...match, sets: newSets })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          未找到比赛记录
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">编辑比赛</h1>
        <button
          onClick={() => router.push('/admin/matches')}
          className="bg-gray-100 text-gray-600 px-4 py-2 rounded hover:bg-gray-200"
        >
          返回
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          {/* 比赛类型 */}
          <div>
            <label className="block text-sm font-medium mb-1">比赛类型</label>
            <select
              value={match.match_type}
              onChange={(e) => setMatch({ ...match, match_type: e.target.value as Match['match_type'] })}
              className="w-full p-2 border rounded"
            >
              <option value="women_singles">女子单打</option>
              <option value="men_singles">男子单打</option>
              <option value="women_doubles">女子双打</option>
              <option value="men_doubles">男子双打</option>
              <option value="mixed_singles">混合单打</option>
              <option value="mixed_doubles">混合双打</option>
            </select>
          </div>

          {/* 选手1 */}
          <div>
            <label className="block text-sm font-medium mb-1">选手1</label>
            <select
              value={match.player1_id}
              onChange={(e) => setMatch({ ...match, player1_id: e.target.value })}
              className="w-full p-2 border rounded"
            >
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          {/* 选手2 */}
          <div>
            <label className="block text-sm font-medium mb-1">选手2</label>
            <select
              value={match.player2_id}
              onChange={(e) => setMatch({ ...match, player2_id: e.target.value })}
              className="w-full p-2 border rounded"
            >
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          {/* 双打时显示搭档和第二个对手 */}
          {match.match_type.includes('doubles') && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">搭档</label>
                <select
                  value={match.teammate_id || ''}
                  onChange={(e) => setMatch({ ...match, teammate_id: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">选择搭档</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">对手2</label>
                <select
                  value={match.opponent2_id || ''}
                  onChange={(e) => setMatch({ ...match, opponent2_id: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">选择对手2</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* 比赛日期 */}
          <div>
            <label className="block text-sm font-medium mb-1">比赛日期</label>
            <input
              type="date"
              value={match.match_date}
              onChange={(e) => setMatch({ ...match, match_date: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* 比分 */}
          <div>
            <label className="block text-sm font-medium mb-1">比分</label>
            {match.sets.map((set, index) => (
              <div key={index} className="flex gap-4 mb-2 items-center">
                <span className="w-20">第 {index + 1} 盘</span>
                <input
                  type="number"
                  min="0"
                  max="7"
                  value={set.player1_score}
                  onChange={(e) => handleSetScoreChange(index, 'player1_score', e.target.value)}
                  className="w-16 p-2 border rounded"
                />
                <span>:</span>
                <input
                  type="number"
                  min="0"
                  max="7"
                  value={set.player2_score}
                  onChange={(e) => handleSetScoreChange(index, 'player2_score', e.target.value)}
                  className="w-16 p-2 border rounded"
                />
                {/* 抢七比分 */}
                {set.player1_score === 6 && set.player2_score === 7 || 
                 set.player1_score === 7 && set.player2_score === 6 ? (
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-sm">抢七</span>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={set.tiebreak?.player1_score || 0}
                      onChange={(e) => handleTiebreakScoreChange(index, 'player1_score', e.target.value)}
                      className="w-16 p-2 border rounded"
                    />
                    <span>:</span>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={set.tiebreak?.player2_score || 0}
                      onChange={(e) => handleTiebreakScoreChange(index, 'player2_score', e.target.value)}
                      className="w-16 p-2 border rounded"
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {/* 保存按钮 */}
          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={() => router.push('/admin/matches')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ${
                saving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 
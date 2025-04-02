import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/router'
import type { Database } from '@/types/database.types'

type User = Database['public']['Tables']['users']['Row']
type Match = Database['public']['Tables']['matches']['Row']

export default function MatchManagement() {
  const { user: currentUser, loading: authLoading } = useAuth()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // 获取所有比赛和用户
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取用户数据
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })

        if (userError) throw userError
        setUsers(userData || [])

        // 获取比赛数据
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .select('*')
          .order('created_at', { ascending: false })

        if (matchError) throw matchError
        setMatches(matchData || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // 检查权限
  useEffect(() => {
    const checkAuth = async () => {
      if (!authLoading && currentUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', currentUser.id)
          .single()
        
        if (!userData || userData.role !== 'admin') {
          router.push('/')
        }
      } else if (!authLoading) {
        router.push('/')
      }
    }
    checkAuth()
  }, [authLoading, currentUser, router])

  // 删除比赛
  const deleteMatch = async (matchId: string) => {
    if (!window.confirm('确定要删除这场比赛吗？')) {
      return
    }

    try {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId)

      if (error) throw error

      // 更新本地状态
      setMatches(matches.filter(match => match.id !== matchId))
    } catch (error) {
      console.error('Error deleting match:', error)
    }
  }

  // 更新比赛状态
  const updateMatchStatus = async (matchId: string, newStatus: 'pending' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('matches')
        .update({ status: newStatus })
        .eq('id', matchId)

      if (error) throw error

      // 更新本地状态
      setMatches(matches.map(match => 
        match.id === matchId 
          ? { ...match, status: newStatus }
          : match
      ))
    } catch (error) {
      console.error('Error updating match status:', error)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const getPlayerName = (playerId: string) => {
    return users.find(user => user.id === playerId)?.name || '未知'
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">比赛管理</h1>
          <button
            onClick={() => router.push('/')}
            className="bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200"
          >
            返回
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  比赛日期
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  选手1
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  选手2
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  比分
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
              {matches.map(match => (
                <tr key={match.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(match.match_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPlayerName(match.player1_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPlayerName(match.player2_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {`${match.player1_score || 0} - ${match.player2_score || 0}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      match.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : match.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {match.status === 'completed' ? '已完成' :
                       match.status === 'pending' ? '待进行' : '已取消'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <select
                      value={match.status}
                      onChange={(e) => updateMatchStatus(match.id, e.target.value as 'pending' | 'completed' | 'cancelled')}
                      className="mr-2 rounded border-gray-300"
                    >
                      <option value="pending">待进行</option>
                      <option value="completed">已完成</option>
                      <option value="cancelled">已取消</option>
                    </select>
                    <button
                      onClick={() => deleteMatch(match.id)}
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
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/router'
import type { Database } from '@/types/database.types'

type User = Database['public']['Tables']['users']['Row']
type Match = Database['public']['Tables']['matches']['Row']

export default function AdminMatches() {
  const { user: currentUser } = useAuth()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const checkAdminAccess = async () => {
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
  }

  useEffect(() => {
    checkAdminAccess()
  }, [currentUser, router])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const { data: usersData } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })

        if (usersData) {
          setUsers(usersData)
        }

        // Fetch matches
        const { data: matchesData } = await supabase
          .from('matches')
          .select('*')
          .order('match_date', { ascending: false })

        if (matchesData) {
          setMatches(matchesData)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getMatchTypeLabel = (type: Match['match_type']): string => {
    const labels: Record<Match['match_type'], string> = {
      'men_singles': '男子单打',
      'women_singles': '女子单打',
      'men_doubles': '男子双打',
      'women_doubles': '女子双打',
      'mixed_doubles': '混合双打',
      'mixed_singles': '混合单打'
    }
    return labels[type]
  }

  const getUserName = (userId: string): string => {
    return users.find(user => user.id === userId)?.name || 'Unknown'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">比赛管理</h1>
        <button
          onClick={() => router.push('/admin')}
          className="bg-gray-100 text-gray-600 px-4 py-2 rounded hover:bg-gray-200"
        >
          返回
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                日期
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                比赛类型
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
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {matches.map((match) => (
              <tr key={match.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(match.match_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getMatchTypeLabel(match.match_type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getUserName(match.player1_id)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getUserName(match.player2_id)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {match.sets.map((set, index) => (
                    <span key={index}>
                      {set.player1_score}:{set.player2_score}
                      {set.tiebreak && (
                        <sup>({set.tiebreak.player1_score}:{set.tiebreak.player2_score})</sup>
                      )}
                      {index < match.sets.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => router.push(`/admin/matches/${match.id}`)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    编辑
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm('确定要删除这场比赛吗？')) {
                        const { error } = await supabase
                          .from('matches')
                          .delete()
                          .eq('id', match.id)
                        
                        if (!error) {
                          setMatches(matches.filter(m => m.id !== match.id))
                        }
                      }
                    }}
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
  )
} 
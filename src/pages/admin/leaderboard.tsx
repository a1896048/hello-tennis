import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/router'
import type { Database } from '@/types/database.types'

type User = Database['public']['Tables']['users']['Row']
type Match = Database['public']['Tables']['matches']['Row']
type ProcessedMatch = Match & {
  winner_id: string;
  loser_id: string;
}

export default function AdminLeaderboard() {
  const { user: currentUser } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [matches, setMatches] = useState<ProcessedMatch[]>([])
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  })
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 检查用户权限
  useEffect(() => {
    const checkAuth = async () => {
      if (!currentUser) {
        router.push('/')
        return
      }
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser.id)
        .single()
      
      if (!userData || userData.role !== 'admin') {
        router.push('/')
      }
    }
    checkAuth()
  }, [currentUser, router])

  // 获取用户数据
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
        const [year, month] = selectedMonth.split('-')
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
        const endDate = new Date(parseInt(year), parseInt(month), 0)

        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .lt('created_at', endDate.toISOString())
          .order('created_at', { ascending: false })

        if (matchError) throw matchError
        
        // 处理比赛数据，确定胜者和败者
        const processedMatches = (matchData || []).map(match => {
          const player1Score = match.player1_score || 0
          const player2Score = match.player2_score || 0
          return {
            ...match,
            winner_id: player1Score > player2Score ? match.player1_id : match.player2_id,
            loser_id: player1Score > player2Score ? match.player2_id : match.player1_id
          }
        })
        
        setMatches(processedMatches)
        // 计算并更新排行榜数据
        calculateLeaderboard(processedMatches)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedMonth])

  // 计算排行榜
  const calculateLeaderboard = (matchData: any[]) => {
    const stats: { [key: string]: { name: string, wins: number, losses: number } } = {}

    matchData.forEach(match => {
      const winnerId = match.winner_id
      const loserId = match.loser_id

      // 初始化或更新获胜者数据
      if (!stats[winnerId]) {
        stats[winnerId] = {
          name: users.find(user => user.id === winnerId)?.name || '',
          wins: 1,
          losses: 0
        }
      } else {
        stats[winnerId].wins += 1
      }

      // 初始化或更新失败者数据
      if (!stats[loserId]) {
        stats[loserId] = {
          name: users.find(user => user.id === loserId)?.name || '',
          wins: 0,
          losses: 1
        }
      } else {
        stats[loserId].losses += 1
      }
    })

    // 转换为数组并排序
    const leaderboardData = Object.entries(stats)
      .map(([id, data]) => ({
        id,
        name: data.name,
        wins: data.wins,
        losses: data.losses,
        total: data.wins + data.losses,
        winRate: data.wins / (data.wins + data.losses) * 100
      }))
      .filter(player => player.total >= 1) // 只显示至少参与过一场比赛的用户
      .sort((a, b) => {
        if (b.winRate !== a.winRate) {
          return b.winRate - a.winRate // 首先按胜率排序
        }
        if (b.total !== a.total) {
          return b.total - a.total // 其次按总场次排序
        }
        return b.wins - a.wins // 最后按胜场数排序
      })

    setLeaderboard(leaderboardData)
  }

  // 生成月份选项
  const generateMonthOptions = () => {
    const options = []
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1

    // 生成从当前月份往前12个月的选项
    for (let i = 0; i < 12; i++) {
      let year = currentYear
      let month = currentMonth - i
      if (month <= 0) {
        month += 12
        year -= 1
      }
      const value = `${year}-${String(month).padStart(2, '0')}`
      const label = `${year}年${month}月`
      options.push({ value, label })
    }

    return options
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">月度排行榜</h1>
        <Link href="/admin/users" className="text-gray-600 hover:text-gray-900">
          返回
        </Link>
      </div>

      {/* 月份选择器 */}
      <div className="mb-6">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        >
          {generateMonthOptions().map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-4">加载中...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 排行榜 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">排行榜</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-left">排名</th>
                    <th className="py-2 px-4 text-left">用户</th>
                    <th className="py-2 px-4 text-right">胜/负</th>
                    <th className="py-2 px-4 text-right">胜率</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((player, index) => (
                    <tr key={player.id} className="border-b last:border-0">
                      <td className="py-2 px-4">{index + 1}</td>
                      <td className="py-2 px-4">{player.name}</td>
                      <td className="py-2 px-4 text-right">
                        {player.wins}/{player.losses}
                      </td>
                      <td className="py-2 px-4 text-right">
                        {player.winRate.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 本月比赛记录 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">比赛记录</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-left">日期</th>
                    <th className="py-2 px-4 text-left">获胜者</th>
                    <th className="py-2 px-4 text-left">失败者</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((match) => (
                    <tr key={match.id} className="border-b last:border-0">
                      <td className="py-2 px-4">
                        {new Date(match.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-4">{users.find(user => user.id === match.winner_id)?.name}</td>
                      <td className="py-2 px-4">{users.find(user => user.id === match.loser_id)?.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
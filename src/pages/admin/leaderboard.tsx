import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/utils/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/router'
import type { Database } from '@/types/database.types'

type User = Database['public']['Tables']['users']['Row']
type Match = Database['public']['Tables']['matches']['Row']

interface LeaderboardEntry {
  userId: string
  name: string
  wins: number
  losses: number
  winRate: number
}

interface MonthOption {
  value: string
  label: string
}

interface LeaderboardStats {
  [key: string]: LeaderboardEntry
}

export default function AdminLeaderboard() {
  const { user: currentUser } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  )

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
      try {
        // Fetch users
        const { data: usersData } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })

        if (usersData) {
          setUsers(usersData)
        }

        // Parse selected month
        const [year, month] = selectedMonth.split('-')
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
        const endDate = new Date(parseInt(year), parseInt(month), 0)

        // Fetch matches for selected month
        const { data: matchesData } = await supabase
          .from('matches')
          .select('*')
          .gte('match_date', startDate.toISOString())
          .lte('match_date', endDate.toISOString())
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
  }, [selectedMonth])

  const calculateLeaderboard = (): LeaderboardEntry[] => {
    const stats: LeaderboardStats = {}

    // Initialize stats for all users
    users.forEach(user => {
      stats[user.id] = {
        userId: user.id,
        name: user.name || 'Unknown',
        wins: 0,
        losses: 0,
        winRate: 0
      }
    })

    // Calculate wins and losses
    matches.forEach(match => {
      const player1Score = match.player1_score
      const player2Score = match.player2_score
      const player1Id = match.player1_id
      const player2Id = match.player2_id

      if (!stats[player1Id] || !stats[player2Id]) return

      if (player1Score > player2Score) {
        stats[player1Id].wins++
        stats[player2Id].losses++
      } else if (player2Score > player1Score) {
        stats[player2Id].wins++
        stats[player1Id].losses++
      }
    })

    // Calculate win rates and convert to array
    return Object.values(stats)
      .map(entry => ({
        ...entry,
        winRate: entry.wins + entry.losses > 0
          ? Math.round((entry.wins / (entry.wins + entry.losses)) * 100)
          : 0
      }))
      .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins)  // Sort by win rate, then by total wins
  }

  const generateMonthOptions = (): MonthOption[] => {
    const options: MonthOption[] = []
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const leaderboard = calculateLeaderboard()

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">排行榜管理</h1>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border rounded px-3 py-2"
        >
          {generateMonthOptions().map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                排名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                用户名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                胜场
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                负场
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                胜率
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leaderboard.map((entry, index) => (
              <tr key={entry.userId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {entry.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.wins}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.losses}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.winRate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 
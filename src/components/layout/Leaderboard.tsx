import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase'
import type { Database } from '@/types/database.types'

type Match = Database['public']['Tables']['matches']['Row']
type User = Database['public']['Tables']['users']['Row']
type Set = Match['sets'][0]

type LeaderboardItem = {
  user: User
  totalMatches: number
  totalPoints: number
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([])

  useEffect(() => {
    fetchLeaderboardData()
  }, [])

  async function fetchLeaderboardData() {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const { data: users } = await supabase.from('users').select('*')
    if (!users) return

    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .gte('match_date', firstDay.toISOString())
      .lte('match_date', lastDay.toISOString())

    if (!matches) return

    const leaderboardData = users.map(user => {
      const userMatches = matches.filter(m => 
        m.player1_id === user.id || m.player2_id === user.id
      )
      
      const totalMatches = userMatches.length
      const totalPoints = userMatches.reduce((acc, match) => {
        const matchPoints = match.sets.reduce((sum: number, set: Set) => {
          if (match.player1_id === user.id) {
            return sum + set.player1_score
          } else {
            return sum + set.player2_score
          }
        }, 0)
        return acc + matchPoints
      }, 0)

      return {
        user,
        totalMatches,
        totalPoints
      }
    })

    const sortedLeaderboard = leaderboardData
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .filter(item => item.totalMatches > 0)

    setLeaderboard(sortedLeaderboard)
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-6">本月排行榜</h2>
      <div className="overflow-x-auto">
        <style jsx>{`
          table {
            border-collapse: collapse;
            width: 100%;
          }
          table, th, td {
            border: 2px solid black;
          }
          th, td {
            padding: 8px;
            text-align: center;
          }
        `}</style>
        <table>
          <thead>
            <tr>
              <th>排名</th>
              <th>用户</th>
              <th>比赛场数</th>
              <th>总积分</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((item, index) => (
              <tr key={item.user.id}>
                <td>{index + 1}</td>
                <td>{item.user.name}</td>
                <td>{item.totalMatches}</td>
                <td>{item.totalPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
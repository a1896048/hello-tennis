import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/utils/supabase'
import type { Database } from '@/types/database.types'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'

// 类型定义
type Match = Database['public']['Tables']['matches']['Row']
type User = Database['public']['Tables']['users']['Row']

export default function Statistics() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [monthlyStats, setMonthlyStats] = useState({
    totalMatches: 0,
    wonMatches: 0,
    totalPoints: 0,
    winRate: 0
  })

  // 将 calculateStats 用 useCallback 包装
  const calculateStats = useCallback((matches: Match[], userId: string) => {
    const stats = matches.reduce((acc, match) => {
      const isPlayer1 = match.player1_id === userId
      const playerScore = isPlayer1 ? match.player1_score : match.player2_score
      const opponentScore = isPlayer1 ? match.player2_score : match.player1_score
      const setPoints = match.sets?.reduce((sum, set) => {
        return sum + (isPlayer1 ? set.player1_score : set.player2_score)
      }, 0) || 0

      return {
        totalMatches: acc.totalMatches + 1,
        wonMatches: acc.wonMatches + (playerScore > opponentScore ? 1 : 0),
        totalPoints: acc.totalPoints + setPoints,
        winRate: 0
      }
    }, {
      totalMatches: 0,
      wonMatches: 0,
      totalPoints: 0,
      winRate: 0
    })

    stats.winRate = stats.totalMatches > 0 
      ? (stats.wonMatches / stats.totalMatches) * 100 
      : 0

    setMonthlyStats(stats)
  }, [])

  const fetchMonthlyMatches = useCallback(async (userId: string) => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const { data } = await supabase
      .from('matches')
      .select('*')
      .gte('match_date', firstDay.toISOString())
      .lte('match_date', lastDay.toISOString())
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .order('match_date', { ascending: false })

    if (data) {
      setMatches(data)
      calculateStats(data, userId)
    }
  }, [calculateStats])

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (data) {
        setCurrentUser(data)
        fetchMonthlyMatches(data.id)
      }
    }
  }, [fetchMonthlyMatches])

  useEffect(() => {
    checkUser()
  }, [checkUser])

  if (!currentUser) {
    return <div>请先登录</div>
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">本月统计</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-gray-600">总场数</div>
          <div className="text-3xl font-bold mt-2">{monthlyStats.totalMatches}</div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-gray-600">胜场</div>
          <div className="text-3xl font-bold mt-2">{monthlyStats.wonMatches}</div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 flex flex-col items-center">
          <div className="text-gray-600 mb-2">胜率</div>
          <div style={{ width: '80px' }}>
            <CircularProgressbar 
              value={monthlyStats.winRate} 
              text={`${monthlyStats.winRate.toFixed(1)}%`}
              styles={buildStyles({
                textSize: '20px',
                pathColor: monthlyStats.winRate === 100 ? '#10B981' : '#ef4444',
                textColor: '#111827',
                trailColor: '#E5E7EB',
                pathTransitionDuration: 0.5,
              })}
            />
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-gray-600">总积分</div>
          <div className="text-3xl font-bold mt-2">{monthlyStats.totalPoints}</div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">本月比赛记录</h2>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '2px solid black', padding: '8px 16px', backgroundColor: '#f9fafb' }}>日期</th>
              <th style={{ border: '2px solid black', padding: '8px 16px', backgroundColor: '#f9fafb' }}>比分</th>
              <th style={{ border: '2px solid black', padding: '8px 16px', backgroundColor: '#f9fafb' }}>获得积分</th>
              <th style={{ border: '2px solid black', padding: '8px 16px', backgroundColor: '#f9fafb' }}>结果</th>
            </tr>
          </thead>
          <tbody>
            {matches.map(match => {
              const isPlayer1 = match.player1_id === currentUser.id

              const matchPoints = match.sets?.reduce((total, set) => {
                return total + (isPlayer1 ? set.player1_score : set.player2_score)
              }, 0) || 0
            
              return (
                <tr key={match.id}>
                  <td style={{ border: '2px solid black', padding: '8px 16px', textAlign: 'center' }}>
                    {new Date(match.match_date).toLocaleDateString()}
                  </td>
                  <td style={{ border: '2px solid black', padding: '8px 16px', textAlign: 'center' }}>
                    {match.sets?.map((set, index) => (
                      <span key={index}>
                        {isPlayer1 ? set.player1_score : set.player2_score} : {isPlayer1 ? set.player2_score : set.player1_score}
                        {index < match.sets.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </td>
                  <td style={{ border: '2px solid black', padding: '8px 16px', textAlign: 'center' }}>
                    {matchPoints}
                  </td>
                  <td style={{ border: '2px solid black', padding: '8px 16px', textAlign: 'center' }}>
                    <span className={isPlayer1 ? 'text-green-600' : 'text-red-600'}>
                      {isPlayer1 ? '胜' : '负'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
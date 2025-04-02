// 导入必要的依赖
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/utils/supabase'
import type { Database } from '@/types/database.types'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import CreateMatch from './matches/CreateMatch'  
import HomeButton from '@/components/layout/HomeButton'
import { useRouter } from 'next/router'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

// 类型定义
type Match = Database['public']['Tables']['matches']['Row']
type User = Database['public']['Tables']['users']['Row']

type Set = {
  player1_score: number
  player2_score: number
  tiebreak?: {
    player1_score: number
    player2_score: number
  }
}

type MatchData = {
  sets: Set[]
  match_date: string
  player1_id: string
  player2_id: string
  match_type: 'women_singles' | 'men_singles' | 'women_doubles' | 'men_doubles' | 'mixed_singles' | 'mixed_doubles'
  teammate_id?: string
}

// 主页组件
export default function Home() {
  // ===== 状态管理 =====
  const { user: currentUser, loading: authLoading, signOut } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [showMatchHistory, setShowMatchHistory] = useState(false)
  const [showCreateMatch, setShowCreateMatch] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  })
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  // ===== 数据获取函数 =====
  // 获取比赛记录
  const fetchMatches = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .or(`player1_id.eq.${currentUser.id},player2_id.eq.${currentUser.id},teammate_id.eq.${currentUser.id},opponent2_id.eq.${currentUser.id}`)
        .gte('match_date', firstDay.toISOString().split('T')[0])
        .lte('match_date', lastDay.toISOString().split('T')[0])
        .eq('status', 'completed')
        .order('match_date', { ascending: false })
      
      if (error) {
        console.error('Error fetching matches:', error)
        return
      }
      
      if (data) {
        console.log('本月比赛数据:', data)
        setMatches(data)
      }
    } catch (error) {
      console.error('Error fetching matches:', error)
    }
  }, [currentUser?.id])

  // 获取用户列表
  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
      
      if (error) {
        console.error('Error fetching users:', error)
        return
      }
      
      if (data) setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }, [])

  // 获取比赛和用户数据
  useEffect(() => {
    if (currentUser?.id) {
      console.log('Current user role:', currentUser.role)  // 添加调试信息
      console.log('Current user data:', currentUser)       // 添加完整用户信息调试
      fetchMatches()
      fetchUsers()
    }
    setLoading(false)
  }, [currentUser?.id, fetchMatches, fetchUsers])

  // 获取月度数据
  const fetchMonthlyData = async (monthStr: string) => {
    try {
      const [year, month] = monthStr.split('-')
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0)

      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })

      if (matchesError) {
        console.error('Error fetching matches:', matchesError)
        return
      }

      // 更新比赛数据
      setMatches(matchesData || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // ===== 比赛相关函数 =====
  // 创建新比赛
  const handleCreateMatch = useCallback(async (matchData: MatchData) => {
    try {
      // 计算总分
      const player1TotalScore = matchData.sets.reduce((sum: number, set: Set) => sum + set.player1_score, 0)
      const player2TotalScore = matchData.sets.reduce((sum: number, set: Set) => sum + set.player2_score, 0)

      // 准备比赛数据
      const newMatch = {
        ...matchData,
        status: 'completed' as const,
        player1_score: player1TotalScore,
        player2_score: player2TotalScore,
        player1_points: player1TotalScore,
        player2_points: player2TotalScore,
      }

      // 保存到数据库
      const { error } = await supabase
        .from('matches')
        .insert(newMatch)
        .select()

      if (error) {
        console.error('创建失败:', error)
        alert(`创建失败: ${error.message}`)
        return
      }

      setShowCreateMatch(false)
      fetchMatches()

    } catch (err) {
      console.error('发生错误:', err)
      alert('创建比赛失败，请重试')
    }
  }, [fetchMatches])

  // 删除比赛记录
  const deleteMatch = useCallback(async (matchId: string) => {
    if (confirm('确定要删除这场比赛记录吗？')) {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId)
      
      if (!error) {
        fetchMatches()
      }
    }
  }, [fetchMatches])

  // ===== 计算统计数据 =====
  const userMatches = matches.filter(m => 
    m.player1_id === currentUser?.id || 
    m.player2_id === currentUser?.id ||
    m.teammate_id === currentUser?.id ||
    m.opponent2_id === currentUser?.id
  )

  const totalMatches = userMatches.length
  const wonMatches = userMatches.filter(m => {
    if (m.player1_id === currentUser?.id || m.teammate_id === currentUser?.id) {
      // 用户在队伍1
      return m.player1_score > m.player2_score
    } else {
      // 用户在队伍2
      return m.player2_score > m.player1_score
    }
  }).length

  const winRate = totalMatches > 0 ? (wonMatches / totalMatches * 100) : 0
  const totalPoints = userMatches.reduce((sum, m) => {
    if (m.player1_id === currentUser?.id || m.teammate_id === currentUser?.id) {
      // 用户在队伍1
      return sum + (m.player1_points || 0)
    } else {
      // 用户在队伍2
      return sum + (m.player2_points || 0)
    }
  }, 0)

  // 生成月份选项
  const generateMonthOptions = () => {
    const options = []
    const today = new Date()
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = `${date.getFullYear()}年${date.getMonth() + 1}月`
      options.push({ value, label })
    }
    
    return options
  }

  // 处理月份选择变化
  const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(event.target.value)
    fetchMonthlyData(event.target.value)
  }

  // 监听月份变化
  useEffect(() => {
    if (currentUser?.role === 'admin' && selectedMonth) {
      // 这里添加获取指定月份数据的逻辑
      fetchMonthlyData(selectedMonth)
    }
  }, [selectedMonth, currentUser])

  // 如果正在加载认证状态，显示加载中
  if (loading) {
    console.log('Auth loading...')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // 未登录状态处理
  if (!currentUser) {
    console.log('No current user, showing login page')
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <h1 className="text-3xl font-bold mb-8">Hello Tennis</h1>
        <div className="text-xl mb-4">请先登录</div>
        <div className="space-x-4">
          <button
            onClick={() => router.push('/auth/login')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            登录
          </button>
          <button
            onClick={() => router.push('/auth/register')}
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
          >
            注册
          </button>
        </div>
      </div>
    )
  }

  console.log('Current user:', currentUser)

  // ===== 页面渲染 =====
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* 顶部导航栏 */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Hello Tennis</h1>
            <HomeButton />
          </div>
          <div className="flex items-center gap-4">
            {/* 管理员功能按钮组 */}
            {currentUser?.role === 'admin' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/admin/users')}
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
                >
                  用户管理
                </button>
                <button
                  onClick={() => router.push('/admin/matches')}
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
                >
                  比赛管理
                </button>
                <button
                  onClick={() => router.push('/admin/settings')}
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
                >
                  系统设置
                </button>
              </div>
            )}
            <button
              onClick={() => setShowCreateMatch(!showCreateMatch)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              创建比赛
            </button>
            <span>欢迎, {currentUser.name} {currentUser.role === 'admin' ? '(管理员)' : ''}</span>
            <button
              onClick={async () => {
                try {
                  await signOut()
                  router.push('/auth/login')
                } catch (error) {
                  console.error('Error signing out:', error)
                }
              }}
              className="bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              退出
            </button>
          </div>
        </div>
      </div>

      {/* 创建比赛表单 */}
      {showCreateMatch && currentUser && (
        <CreateMatch
          currentUser={currentUser}
          users={users}
          onClose={() => setShowCreateMatch(false)}
          onSubmit={handleCreateMatch}
        />
      )}

      {/* 比赛记录区块 */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">比赛记录</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowMatchHistory(!showMatchHistory)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              {showMatchHistory ? '隐藏记录' : '查看记录'}
            </button>
            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              {showLeaderboard ? '隐藏排行榜' : '本月排行榜'}
            </button>
          </div>
        </div>

        {/* 比赛记录表格 */}
        {showMatchHistory && (
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
                  <th>日期</th>
                  <th>比赛类型</th>
                  <th>对手</th>
                  <th>我的搭档</th>
                  <th>比分</th>
                  <th>获得积分</th>
                  <th>结果</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => {
                  const isPlayer1 = match.player1_id === currentUser.id;
                  
                  // 根据当前用户角色确定搭档和对手
                  let teammate: User | null = null;
                  let opponents: (User | null)[] = [];
                  
                  if (match.match_type.includes('doubles')) {
                    if (isPlayer1) {
                      // 当前用户是 player1
                      teammate = users.find(u => u.id === match.teammate_id) || null;
                      opponents = [
                        users.find(u => u.id === match.player2_id) || null,
                        users.find(u => u.id === match.opponent2_id) || null
                      ];
                    } else {
                      // 当前用户是 player2 或 opponent2_id
                      if (match.player2_id === currentUser.id) {
                        // 当前用户是 player2
                        teammate = users.find(u => u.id === match.opponent2_id) || null;
                        opponents = [
                          users.find(u => u.id === match.player1_id) || null,
                          users.find(u => u.id === match.teammate_id) || null
                        ];
                      } else if (match.opponent2_id === currentUser.id) {
                        // 当前用户是 opponent2_id
                        teammate = users.find(u => u.id === match.player2_id) || null;
                        opponents = [
                          users.find(u => u.id === match.player1_id) || null,
                          users.find(u => u.id === match.teammate_id) || null
                        ];
                      }
                    }
                  } else {
                    // 单打比赛
                    opponents = [users.find(u => u.id === (isPlayer1 ? match.player2_id : match.player1_id)) || null];
                  }

                  // 转换比赛类型显示
                  const matchTypeDisplay = {
                    'women_singles': '女单',
                    'men_singles': '男单',
                    'women_doubles': '女双',
                    'men_doubles': '男双',
                    'mixed_singles': '混合单打',
                    'mixed_doubles': '混合双打'
                  }[match.match_type];

                  // 处理对手显示
                  const opponentDisplay = match.match_type.includes('doubles')
                    ? `${opponents[0]?.name || '未知'} / ${opponents[1]?.name || '未知'}`
                    : opponents[0]?.name || '未知';

                  return (
                    <tr key={match.id}>
                      <td>{new Date(match.match_date).toLocaleDateString()}</td>
                      <td>{matchTypeDisplay}</td>
                      <td>{opponentDisplay}</td>
                      <td>
                        {match.match_type.includes('singles') 
                          ? '/' 
                          : (teammate?.name || '未知')}
                      </td>
                      <td>
                        {match.sets.map((set, index) => (
                          <span key={index}>
                            {isPlayer1 
                              ? `${set.player1_score}:${set.player2_score}` 
                              : `${set.player2_score}:${set.player1_score}`}
                            {set.tiebreak && (
                              <sup>
                                ({isPlayer1 
                                  ? `${set.tiebreak.player1_score}:${set.tiebreak.player2_score}`
                                  : `${set.tiebreak.player2_score}:${set.tiebreak.player1_score}`})
                              </sup>
                            )}
                            {index < match.sets.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </td>
                      <td>
                        {match.sets.reduce((sum, set) => 
                          sum + (isPlayer1 ? set.player1_score : set.player2_score), 0
                        )}
                      </td>
                      <td>
                        <span className={
                          match.sets.reduce((sum, set) => 
                            sum + (isPlayer1 ? set.player1_score : set.player2_score), 0
                          ) <
                          match.sets.reduce((sum, set) => 
                            sum + (isPlayer1 ? set.player2_score : set.player1_score), 0
                          )
                            ? 'text-red-600'
                            : 'text-green-600'
                        }>
                          {match.sets.reduce((sum, set) => 
                            sum + (isPlayer1 ? set.player1_score : set.player2_score), 0
                          ) <
                          match.sets.reduce((sum, set) => 
                            sum + (isPlayer1 ? set.player2_score : set.player1_score), 0
                          )
                            ? '负'
                            : '胜'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => deleteMatch(match.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 排行榜（条件渲染） */}
      {showLeaderboard && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">本月排行榜</h2>
            {currentUser?.role === 'admin' && (
              <select
                value={selectedMonth}
                onChange={handleMonthChange}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                {generateMonthOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>
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
                  <th>用户名</th>
                  <th>总场数</th>
                  <th>胜场</th>
                  <th>胜率</th>
                  <th>总积分</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .map(user => {
                    // 获取用户的比赛记录
                    const userMatches = matches.filter(m => 
                      m.player1_id === user.id || 
                      m.player2_id === user.id ||
                      m.teammate_id === user.id ||
                      m.opponent2_id === user.id
                    )

                    // 计算用户统计数据
                    const totalMatches = userMatches.length
                    const wonMatches = userMatches.filter(m => {
                      if (m.player1_id === user.id || m.teammate_id === user.id) {
                        return m.player1_score > m.player2_score
                      } else {
                        return m.player2_score > m.player1_score
                      }
                    }).length

                    const winRate = totalMatches > 0 ? (wonMatches / totalMatches * 100) : 0
                    const totalPoints = userMatches.reduce((sum, m) => {
                      if (m.player1_id === user.id || m.teammate_id === user.id) {
                        return sum + (m.player1_points || 0)
                      } else {
                        return sum + (m.player2_points || 0)
                      }
                    }, 0)

                    return {
                      id: user.id,
                      name: user.name,
                      totalMatches,
                      wonMatches,
                      winRate,
                      totalPoints
                    }
                  })
                  .sort((a, b) => b.totalPoints - a.totalPoints)
                  .map((userData, index) => (
                    <tr key={userData.id}>
                      <td>{index + 1}</td>
                      <td>{userData.name}</td>
                      <td>{userData.totalMatches}</td>
                      <td>{userData.wonMatches}</td>
                      <td>{userData.winRate.toFixed(1)}%</td>
                      <td>{userData.totalPoints}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 本月统计区块 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">本月统计</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg mb-2">总场数</h3>
            <p className="text-3xl font-bold">{totalMatches}</p>
          </div>
          <div>
            <h3 className="text-lg mb-2">胜场</h3>
            <p className="text-3xl font-bold">{wonMatches}</p>
          </div>
          <div className="flex flex-col items-center">
            <h3 className="text-lg mb-2">胜率</h3>
            <div style={{ width: '120px', height: '120px' }}>
              <CircularProgressbar
                value={winRate}
                text={`${winRate.toFixed(1)}%`}
                styles={buildStyles({
                  pathColor: '#3B82F6',
                  textColor: '#1F2937',
                  trailColor: '#E5E7EB',
                  textSize: '16px',
                  strokeLinecap: 'round',
                  pathTransitionDuration: 0.5,
                })}
              />
            </div>
          </div>
          <div>
            <h3 className="text-lg mb-2">总得分</h3>
            <p className="text-3xl font-bold">{totalPoints}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
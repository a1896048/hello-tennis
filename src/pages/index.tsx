// 导入必要的依赖
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/utils/supabase'
import type { Database } from '@/types/database.types'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import CreateMatch from './matches/CreateMatch'  
import HomeButton from '@/components/layout/HomeButton'
import Leaderboard from '@/components/layout/Leaderboard'

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
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [showMatchHistory, setShowMatchHistory] = useState(false)
  const [showCreateMatch, setShowCreateMatch] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  // ===== 数据获取函数 =====
  // 检查当前用户状态
  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      setCurrentUser(data)
    }
  }, [])

  // 获取比赛记录
  const fetchMatches = useCallback(async () => {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: false })
    
    if (error) {
      console.error('Error fetching matches:', error)
      return
    }
    
    if (data) setMatches(data)
  }, [])

  // 获取用户列表
  const fetchUsers = useCallback(async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
    if (data) setUsers(data)
  }, [])

  // 修改 useEffect 依赖
  useEffect(() => {
    fetchMatches()
    fetchUsers()
    checkUser()
  }, [fetchMatches, fetchUsers, checkUser])

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
  const totalMatches = matches.length
  const wonMatches = matches.filter(m => {
    const isPlayer1 = m.player1_id === currentUser?.id
    return isPlayer1 
      ? m.player1_score > m.player2_score 
      : m.player2_score > m.player1_score
  }).length
  const winRate = totalMatches > 0 ? (wonMatches / totalMatches * 100) : 0
  const totalPoints = matches.reduce((sum, m) => {
    const isPlayer1 = m.player1_id === currentUser?.id
    return sum + (isPlayer1 ? m.player1_points : m.player2_points)
  }, 0)

  // 未登录状态处理
  if (!currentUser) {
    return <div>请先登录</div>
  }

  // ===== 页面渲染 =====
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* 顶部导航栏 */}
      <div className="bg-white shadow rounded-lg p-4 mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Hello Tennis</h1>
          <HomeButton />
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowCreateMatch(!showCreateMatch)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            创建比赛
          </button>
          <span>欢迎, {currentUser.name}</span>
          <button
            onClick={() => supabase.auth.signOut()}
            className="bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200"
          >
            退出
          </button>
        </div>
      </div>

      {/* 创建比赛表单 */}
      {showCreateMatch && currentUser && (
        <CreateMatch
          currentUser={currentUser}
          users={users}
          onCancel={() => setShowCreateMatch(false)}
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
                  const opponent1 = users.find(u => u.id === (isPlayer1 ? match.player2_id : match.player1_id));
                  const opponent2 = match.opponent2_id ? users.find(u => u.id === match.opponent2_id) : null;
                  const teammate = match.teammate_id ? users.find(u => u.id === match.teammate_id) : null;
                  
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
                    ? `${opponent1?.name || '未知'} / ${opponent2?.name || '未知'}`
                    : opponent1?.name || '未知';

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
        <div className="mb-6">
          <Leaderboard />
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
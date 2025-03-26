// 导入必要的依赖
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
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

// 主页组件
export default function Home() {
  const router = useRouter()
  
  // ===== 状态管理 =====
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [showMatchHistory, setShowMatchHistory] = useState(false)
  const [showCreateMatch, setShowCreateMatch] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  // ===== 生命周期函数 =====
  useEffect(() => {
    fetchMatches()
    fetchUsers()
    checkUser()
  }, [])

  // ===== 数据获取函数 =====
  // 检查当前用户状态
  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      setCurrentUser(data)
    }
  }

  // 获取比赛记录
  async function fetchMatches() {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: false })
    
    if (error) {
      console.error('Error fetching matches:', error)
      return
    }
    
    if (data) setMatches(data)
  }

  // 获取用户列表
  async function fetchUsers() {
    const { data } = await supabase
      .from('users')
      .select('*')
    if (data) setUsers(data)
  }

  // ===== 比赛相关函数 =====
  // 创建新比赛
  async function handleCreateMatch(matchData: any) {
    try {
      // 计算总分
      const player1TotalScore = matchData.sets.reduce((sum: number, set: any) => sum + set.player1_score, 0)
      const player2TotalScore = matchData.sets.reduce((sum: number, set: any) => sum + set.player2_score, 0)

      // 准备比赛数据
      const newMatch = {
        ...matchData,
        status: 'completed' as const,
        match_type: 'singles' as const,
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
  }

  // 删除比赛记录
  async function deleteMatch(matchId: string, e: React.MouseEvent) {
    e.preventDefault()
    if (confirm('确定要删除这场比赛记录吗？')) {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId)
      
      if (!error) {
        fetchMatches()
      }
    }
  }

  // ===== 计算统计数据 =====
  const totalMatches = matches.length
  const wonMatches = matches.filter(m => 
    m.sets.reduce((sum, set) => sum + set.player1_score, 0) >
    m.sets.reduce((sum, set) => sum + set.player2_score, 0)
  ).length
  const winRate = totalMatches > 0 ? (wonMatches / totalMatches * 100) : 0
  const totalPoints = matches.reduce((sum, m) => 
    sum + m.sets.reduce((s, set) => s + set.player1_score, 0), 0
  )

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

    {/* 其余内容保持不变 */}

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
                  <th>比分</th>
                  <th>获得积分</th>
                  <th>结果</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => (
                  <tr key={match.id}>
                    <td>{new Date(match.match_date).toLocaleDateString()}</td>
                    <td>
                      {match.sets.map((set, index) => (
                        <span key={index}>
                          {set.player1_score}:{set.player2_score}
                          {index < match.sets.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </td>
                    <td>{match.sets.reduce((sum, set) => sum + set.player1_score, 0)}</td>
                    <td>
                      <span className={
                        match.sets.reduce((sum, set) => sum + set.player1_score, 0) <
                        match.sets.reduce((sum, set) => sum + set.player2_score, 0)
                          ? 'text-red-600'
                          : 'text-green-600'
                      }>
                        {match.sets.reduce((sum, set) => sum + set.player1_score, 0) <
                         match.sets.reduce((sum, set) => sum + set.player2_score, 0)
                          ? '负'
                          : '胜'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={(e) => deleteMatch(match.id, e)}
                        className="text-red-600 hover:text-red-800"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
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


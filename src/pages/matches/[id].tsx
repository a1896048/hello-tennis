import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'
import type { Database } from '@/types/database.types'

type Match = Database['public']['Tables']['matches']['Row']
type User = Database['public']['Tables']['users']['Row']

export default function MatchDetail() {
  const router = useRouter()
  const { id } = router.query
  const [match, setMatch] = useState<Match | null>(null)
  const [player1, setPlayer1] = useState<User | null>(null)
  const [player2, setPlayer2] = useState<User | null>(null)
  const [teammate, setTeammate] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    if (id) {
      fetchMatchDetails()
    }
  }, [id])

  async function fetchMatchDetails() {
    const { data: matchData } = await supabase
      .from('matches')
      .select('*')
      .eq('id', id)
      .single()

    if (matchData) {
      setMatch(matchData)
      
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
      
      if (usersData) {
        setUsers(usersData)
        setPlayer1(usersData.find(u => u.id === matchData.player1_id) || null)
        setPlayer2(usersData.find(u => u.id === matchData.player2_id) || null)
        if (matchData.teammate_id) {
          setTeammate(usersData.find(u => u.id === matchData.teammate_id) || null)
        }
      }
    }
  }

  if (!match || !player1 || !player2) {
    return <div className="flex justify-center items-center h-screen">加载中...</div>
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <button
        onClick={() => router.push('/')}
        className="mb-6 text-blue-500 hover:text-blue-700 flex items-center"
      >
        ← 返回首页
      </button>

      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">比赛详情</h1>
        
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '2px solid black', padding: '8px 16px', backgroundColor: '#f9fafb' }}>比赛类型</th>
                <th style={{ border: '2px solid black', padding: '8px 16px', backgroundColor: '#f9fafb' }}>队友</th>
                <th style={{ border: '2px solid black', padding: '8px 16px', backgroundColor: '#f9fafb' }}>对手</th>
                <th style={{ border: '2px solid black', padding: '8px 16px', backgroundColor: '#f9fafb' }}>第一盘</th>
                <th style={{ border: '2px solid black', padding: '8px 16px', backgroundColor: '#f9fafb' }}>第二盘</th>
                <th style={{ border: '2px solid black', padding: '8px 16px', backgroundColor: '#f9fafb' }}>第三盘</th>
                <th style={{ border: '2px solid black', padding: '8px 16px', backgroundColor: '#f9fafb' }}>比赛日期</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '2px solid black', padding: '8px 16px', textAlign: 'center' }}>
                  {match.match_type === 'doubles' ? '双打' : '单打'}
                </td>
                <td style={{ border: '2px solid black', padding: '8px 16px', textAlign: 'center' }}>
                  {teammate ? teammate.name : '-'}
                </td>
                <td style={{ border: '2px solid black', padding: '8px 16px', textAlign: 'center' }}>
                  {player2.name}
                </td>
                {match.sets?.map((set, index) => (
                  <td key={index} style={{ border: '2px solid black', padding: '8px 16px', textAlign: 'center' }}>
                    {set.player1_score} : {set.player2_score}
                  </td>
                ))}
                <td style={{ border: '2px solid black', padding: '8px 16px', textAlign: 'center' }}>
                  {new Date(match.match_date).toLocaleDateString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
import { useRouter } from 'next/router'
import { useEffect, useState, useCallback } from 'react'
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

  const fetchMatchDetails = useCallback(async () => {
    if (!id) return

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
        setPlayer1(usersData.find(u => u.id === matchData.player1_id) || null)
        setPlayer2(usersData.find(u => u.id === matchData.player2_id) || null)
        if (matchData.teammate_id) {
          setTeammate(usersData.find(u => u.id === matchData.teammate_id) || null)
        }
      }
    }
  }, [id])

  useEffect(() => {
    fetchMatchDetails()
  }, [fetchMatchDetails])

  if (!match || !player1 || !player2) {
    return <div>加载中...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">比赛详情</h1>
      
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg font-semibold">日期</h2>
            <p>{new Date(match.match_date).toLocaleDateString()}</p>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold">类型</h2>
            <p>{match.match_type.includes('singles') ? '单打' : '双打'}</p>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold">玩家1</h2>
            <p>{player1.name}</p>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold">玩家2</h2>
            <p>{player2.name}</p>
          </div>
          
          {teammate && (
            <div>
              <h2 className="text-lg font-semibold">队友</h2>
              <p>{teammate.name}</p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">比分</h2>
          <div className="flex gap-4">
            {match.sets.map((set, index) => (
              <div key={index} className="text-center">
                <p className="font-bold">第 {index + 1} 局</p>
                <p>{set.player1_score} : {set.player2_score}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">总分</h2>
          <p>
            {match.player1_score} : {match.player2_score}
          </p>
        </div>
      </div>
    </div>
  )
}
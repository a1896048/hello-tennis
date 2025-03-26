import type { Database } from '@/types/database.types'
import { useState } from 'react'

// 定义 User 类型
type User = Database['public']['Tables']['users']['Row']

// 定义组件的 props 类型
interface CreateMatchProps {
  currentUser: User
  users: User[]
  onCancel: () => void
  onSubmit: (matchData: {
    player1_id: string
    player2_id: string
    match_date: string
    sets: Array<{
      set_number: number
      player1_score: number
      player2_score: number
    }>
  }) => void
}


export default function CreateMatch({ currentUser, users, onCancel, onSubmit }: CreateMatchProps) {
  // 状态管理
  const [selectedOpponent, setSelectedOpponent] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [matchType, setMatchType] = useState<string>('men_singles')
  const [opponentSearch, setOpponentSearch] = useState('')
  const [partnerSearch, setPartnerSearch] = useState('')
  const [selectedPartner, setSelectedPartner] = useState<string>('')
  const [sets, setSets] = useState([
    { set_number: 1, player1_score: 0, player2_score: 0 },
    { set_number: 2, player1_score: 0, player2_score: 0 },
    { set_number: 3, player1_score: 0, player2_score: 0 },
    { set_number: 4, player1_score: 0, player2_score: 0 },
    { set_number: 5, player1_score: 0, player2_score: 0 }
  ])

  const [tiebreakScores, setTiebreakScores] = useState({
    player1_score: 0,
    player2_score: 0
  })

  const isMenSingles = matchType === 'men_singles'
  const totalSets = isMenSingles ? 5 : 3

  // 更新比分
  const updateSetScore = (setIndex: number, player: 'player1' | 'player2', score: number) => {
    const newSets = [...sets]
    if (player === 'player1') {
      newSets[setIndex].player1_score = score
    } else {
      newSets[setIndex].player2_score = score
    }
    setSets(newSets)
  }

  // 更新抢七比分
  const updateTiebreakScore = (player: 'player1' | 'player2', score: number) => {
    if (score >= 0 && score <= 99) {
      setTiebreakScores(prev => ({
        ...prev,
        [`${player}_score`]: score
      }))
    }
  }

  // 提交表单
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentUser?.id || !selectedOpponent || !selectedDate) {
      alert('请填写所有必要信息')
      return
    }

    onSubmit({
      player1_id: currentUser.id,
      player2_id: selectedOpponent,
      match_date: selectedDate,
      sets: sets.map((set, index) => ({
        set_number: index + 1,
        player1_score: set.player1_score,
        player2_score: set.player2_score
      }))
    })
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">创建比赛</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. 比赛类型选择 - 始终在第一位 */}
        <div>
          <label className="block text-sm font-medium mb-1">比赛类型</label>
          <select
            value={matchType}
            onChange={(e) => setMatchType(e.target.value)}
            className="w-full p-2 border rounded"
            required
          >
            <option value="women_singles">女子单打</option>
            <option value="men_singles">男子单打</option>
            <option value="women_doubles">女子双打</option>
            <option value="men_doubles">男子双打</option>
            <option value="mixed_singles">混合单打</option>
            <option value="mixed_doubles">混合双打</option>
          </select>
        </div>

        {/* 2. 双打时显示搭档选择 */}
        {matchType.includes('doubles') && (
          <div>
            <label className="block text-sm font-medium mb-1">我的搭档</label>
            <div className="relative">
              <input
                type="text"
                value={partnerSearch}
                onChange={(e) => setPartnerSearch(e.target.value)}
                placeholder="搜索搭档..."
                className="w-full p-2 border rounded"
              />
              {partnerSearch && (
                <div className="absolute z-10 w-full bg-white border rounded-lg mt-1 max-h-48 overflow-y-auto">
                  {users
                    .filter(user => 
                      user.name.toLowerCase().includes(partnerSearch.toLowerCase()) &&
                      user.id !== currentUser.id &&
                      user.id !== selectedOpponent
                    )
                    .map(user => (
                      <div
                        key={user.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setSelectedPartner(user.id)
                          setPartnerSearch(user.name)
                        }}
                      >
                        {user.name}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. 选择对手 */}
        <div>
          <label className="block text-sm font-medium mb-1">选择对手</label>
          <div className="relative">
            <input
              type="text"
              value={opponentSearch}
              onChange={(e) => setOpponentSearch(e.target.value)}
              placeholder="搜索对手..."
              className="w-full p-2 border rounded"
            />
            {opponentSearch && (
              <div className="absolute z-10 w-full bg-white border rounded-lg mt-1 max-h-48 overflow-y-auto">
                {users
                  .filter(user => 
                    user.name.toLowerCase().includes(opponentSearch.toLowerCase()) &&
                    user.id !== currentUser.id &&
                    user.id !== selectedPartner
                  )
                  .map(user => (
                    <div
                      key={user.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setSelectedOpponent(user.id)
                        setOpponentSearch(user.name)
                      }}
                    >
                      {user.name}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* 4. 比赛日期 */}
        <div>
          <label className="block text-sm font-medium mb-1">比赛日期</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* 5. 比分 */}
        <div>
          <label className="block text-sm font-medium mb-1">比分</label>
          {sets.slice(0, totalSets).map((set, index) => (
            <div key={index} className="flex gap-4 mb-2 items-center">
              <span className="w-20">第 {index + 1} 盘</span>
              <input
                type="number"
                min="0"
                max="7"
                value={set.player1_score}
                onChange={(e) => updateSetScore(index, 'player1', parseInt(e.target.value) || 0)}
                className="w-16 p-2 border rounded"
                required
              />
              <span>:</span>
              <input
                type="number"
                min="0"
                max="7"
                value={set.player2_score}
                onChange={(e) => updateSetScore(index, 'player2', parseInt(e.target.value) || 0)}
                className="w-16 p-2 border rounded"
                required
              />
            </div>
          ))}

          {/* 抢七比分 */}
          <div className="mt-4">
            <div className="flex gap-4 items-center">
              <span className="w-32">最后一盘抢七</span>
              <input
                type="number"
                min="0"
                max="99"
                value={tiebreakScores.player1_score}
                onChange={(e) => updateTiebreakScore('player1', parseInt(e.target.value) || 0)}
                className="w-16 p-2 border rounded"
              />
              <span>:</span>
              <input
                type="number"
                min="0"
                max="99"
                value={tiebreakScores.player2_score}
                onChange={(e) => updateTiebreakScore('player2', parseInt(e.target.value) || 0)}
                className="w-16 p-2 border rounded"
              />
            </div>
          </div>
        </div>


        {/* 按钮部分保持不变 */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            取消
          </button>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            保存
          </button>
        </div>
      </form>
    </div>
  )
}
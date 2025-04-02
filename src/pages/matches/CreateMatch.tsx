import type { Database } from '@/types/database.types'
import { useState } from 'react'

// 定义 User 类型
type User = Database['public']['Tables']['users']['Row']

// 定义组件的 props 类型
interface CreateMatchProps {
  currentUser: User
  users: User[]
  onClose: () => void
  onSubmit: (matchData: {
    player1_id: string
    player2_id: string
    match_date: string
    match_type: 'women_singles' | 'men_singles' | 'women_doubles' | 'men_doubles' | 'mixed_singles' | 'mixed_doubles'
    teammate_id?: string
    opponent2_id?: string
    sets: Array<{
      set_number: number
      player1_score: number
      player2_score: number
      tiebreak?: {
        player1_score: number
        player2_score: number
      }
    }>
  }) => void
}

export default function CreateMatch({ currentUser, users, onClose, onSubmit }: CreateMatchProps) {
  // ===== 状态管理 =====
  const [selectedOpponent1, setSelectedOpponent1] = useState<string>('')
  const [selectedOpponent2, setSelectedOpponent2] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [matchType, setMatchType] = useState<string>('men_singles')
  const [opponent1Search, setOpponent1Search] = useState('')
  const [opponent2Search, setOpponent2Search] = useState('')
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

  const [isOpponent1Focused, setIsOpponent1Focused] = useState(false)
  const [isOpponent2Focused, setIsOpponent2Focused] = useState(false)
  const [isPartnerFocused, setIsPartnerFocused] = useState(false)

  // ===== 计算和辅助函数 =====
  const isMenSingles = matchType === 'men_singles'
  const totalSets = isMenSingles ? 5 : 3
  const isDoubles = matchType.includes('doubles')

  // 更新比分
  const updateSetScore = (setIndex: number, player: 'player1' | 'player2', score: number) => {
    if (score >= 0 && score <= 7) {
      const newSets = [...sets]
      if (player === 'player1') {
        newSets[setIndex].player1_score = score
      } else {
        newSets[setIndex].player2_score = score
      }
      setSets(newSets)
    }
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

  // ===== 表单提交 =====
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 验证必填字段
    if (!currentUser?.id || !selectedDate) {
      alert('请填写所有必要信息')
      return
    }

    // 验证双打时必须选择搭档和两个对手
    if (isDoubles) {
      if (!selectedPartner) {
        alert('双打比赛必须选择搭档')
        return
      }
      if (!selectedOpponent1 || !selectedOpponent2) {
        alert('双打比赛必须选择两个对手')
        return
      }
    } else {
      // 单打时必须选择一个对手
      if (!selectedOpponent1) {
        alert('请选择对手')
        return
      }
    }

    // 提交数据
    onSubmit({
      player1_id: currentUser.id,
      player2_id: isDoubles ? selectedOpponent1 : selectedOpponent1, // 单打时使用 opponent1
      match_date: selectedDate,
      match_type: matchType as 'women_singles' | 'men_singles' | 'women_doubles' | 'men_doubles' | 'mixed_singles' | 'mixed_doubles',
      teammate_id: isDoubles ? selectedPartner : undefined,
      opponent2_id: isDoubles ? selectedOpponent2 : undefined, // 新增：双打时的第二个对手
      sets: sets.slice(0, totalSets).map((set, index) => ({
        set_number: index + 1,
        player1_score: set.player1_score,
        player2_score: set.player2_score,
        tiebreak: index === totalSets - 1 && (set.player1_score === 6 && set.player2_score === 7 || 
                                            set.player1_score === 7 && set.player2_score === 6) 
          ? tiebreakScores 
          : undefined
      }))
    })
  }

  // ===== 渲染表单 =====
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">创建比赛</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. 比赛类型选择 */}
        <div>
          <label className="block text-sm font-medium mb-1">比赛类型</label>
          <select
            value={matchType}
            onChange={(e) => {
              setMatchType(e.target.value)
              if (!e.target.value.includes('doubles')) {
                setSelectedPartner('')
                setPartnerSearch('')
                setSelectedOpponent2('')
                setOpponent2Search('')
              }
            }}
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
        {isDoubles && (
          <div>
            <label className="block text-sm font-medium mb-1">我的搭档</label>
            <div className="relative">
              <input
                type="text"
                value={partnerSearch}
                onChange={(e) => setPartnerSearch(e.target.value)}
                onFocus={() => setIsPartnerFocused(true)}
                onBlur={() => setTimeout(() => setIsPartnerFocused(false), 200)}
                placeholder="搜索搭档..."
                className="w-full p-2 border rounded"
                required
              />
              {(isPartnerFocused || partnerSearch) && (
                <div className="absolute z-10 w-full bg-white border rounded-lg mt-1 max-h-48 overflow-y-auto">
                  {users
                    .filter(user => 
                      user.id !== currentUser.id &&
                      user.id !== selectedOpponent1 &&
                      user.id !== selectedOpponent2 &&
                      (partnerSearch === '' || 
                       user.name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
                       user.id.toLowerCase().includes(partnerSearch.toLowerCase()))
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
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {isDoubles ? '对手1' : '选择对手'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={opponent1Search}
                onChange={(e) => setOpponent1Search(e.target.value)}
                onFocus={() => setIsOpponent1Focused(true)}
                onBlur={() => setTimeout(() => setIsOpponent1Focused(false), 200)}
                placeholder={isDoubles ? '搜索对手1...' : '搜索对手...'}
                className="w-full p-2 border rounded"
                required
              />
              {(isOpponent1Focused || opponent1Search) && (
                <div className="absolute z-10 w-full bg-white border rounded-lg mt-1 max-h-48 overflow-y-auto">
                  {users
                    .filter(user => 
                      user.id !== currentUser.id &&
                      user.id !== selectedPartner &&
                      user.id !== selectedOpponent2 &&
                      (opponent1Search === '' || 
                       user.name.toLowerCase().includes(opponent1Search.toLowerCase()) ||
                       user.id.toLowerCase().includes(opponent1Search.toLowerCase()))
                    )
                    .map(user => (
                      <div
                        key={user.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setSelectedOpponent1(user.id)
                          setOpponent1Search(user.name)
                        }}
                      >
                        {user.name}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* 双打时显示第二个对手选择 */}
          {isDoubles && (
            <div>
              <label className="block text-sm font-medium mb-1">对手2</label>
              <div className="relative">
                <input
                  type="text"
                  value={opponent2Search}
                  onChange={(e) => setOpponent2Search(e.target.value)}
                  onFocus={() => setIsOpponent2Focused(true)}
                  onBlur={() => setTimeout(() => setIsOpponent2Focused(false), 200)}
                  placeholder="搜索对手2..."
                  className="w-full p-2 border rounded"
                  required
                />
                {(isOpponent2Focused || opponent2Search) && (
                  <div className="absolute z-10 w-full bg-white border rounded-lg mt-1 max-h-48 overflow-y-auto">
                    {users
                      .filter(user => 
                        user.id !== currentUser.id &&
                        user.id !== selectedPartner &&
                        user.id !== selectedOpponent1 &&
                        (opponent2Search === '' || 
                         user.name.toLowerCase().includes(opponent2Search.toLowerCase()) ||
                         user.id.toLowerCase().includes(opponent2Search.toLowerCase()))
                      )
                      .map(user => (
                        <div
                          key={user.id}
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setSelectedOpponent2(user.id)
                            setOpponent2Search(user.name)
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
              {/* 显示抢七输入框的条件：最后一盘且比分为6:7或7:6 */}
              {index === totalSets - 1 && 
               (set.player1_score === 6 && set.player2_score === 7 || 
                set.player1_score === 7 && set.player2_score === 6) && (
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-sm">抢七</span>
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
              )}
            </div>
          ))}
        </div>
      </form>
      <div className="flex justify-end gap-4 mt-6">
        <button
          type="button"
          onClick={onClose}
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
    </div>
  )
}
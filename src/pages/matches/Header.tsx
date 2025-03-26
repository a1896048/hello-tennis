import type { Database } from '@/types/database.types'
import { supabase } from '@/utils/supabase'

// 从数据库类型定义中获取 User 类型
type User = Database['public']['Tables']['users']['Row']

interface HeaderProps {
  currentUser: User
  onCreateClick: () => void
}

export default function Header({ currentUser, onCreateClick }: HeaderProps) {
  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6 flex justify-between items-center">
      <h1 className="text-2xl font-bold">Hello Tennis</h1>
      <div className="flex items-center gap-4">
        <button
          onClick={onCreateClick}
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
  )
}
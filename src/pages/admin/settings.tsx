import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/utils/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/router'
import type { Database } from '@/types/database.types'

type User = Database['public']['Tables']['users']['Row']

interface SystemSettings {
  allowRegistration: boolean
  matchApprovalRequired: boolean
  maxMatchesPerDay: number
}

export default function AdminSettings() {
  const { user: currentUser } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SystemSettings>({
    allowRegistration: true,
    matchApprovalRequired: true,
    maxMatchesPerDay: 3
  })

  const checkAdminAccess = useCallback(async () => {
    if (!currentUser) {
      router.push('/')
      return
    }

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser.id)
        .single()

      if (!userData || userData.role !== 'admin') {
        router.push('/')
      }
    } catch (err) {
      console.error('Error checking admin access:', err)
      router.push('/')
    }
  }, [currentUser, router])

  useEffect(() => {
    checkAdminAccess()
  }, [checkAdminAccess])

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // In a real app, you would load settings from your database
        // For now, we'll just use the default values
        setLoading(false)
      } catch (error) {
        console.error('Error loading settings:', error)
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      // In a real app, you would save settings to your database
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('设置已保存')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('保存设置时出错')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">系统设置</h1>
        <button
          onClick={() => router.push('/admin')}
          className="bg-gray-100 text-gray-600 px-4 py-2 rounded hover:bg-gray-200"
        >
          返回
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.allowRegistration}
                onChange={(e) => setSettings({
                  ...settings,
                  allowRegistration: e.target.checked
                })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-gray-700">允许新用户注册</span>
            </label>
          </div>

          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.matchApprovalRequired}
                onChange={(e) => setSettings({
                  ...settings,
                  matchApprovalRequired: e.target.checked
                })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-gray-700">比赛结果需要管理员审核</span>
            </label>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">每日最大比赛场数</label>
            <input
              type="number"
              value={settings.maxMatchesPerDay}
              onChange={(e) => setSettings({
                ...settings,
                maxMatchesPerDay: parseInt(e.target.value) || 0
              })}
              min="1"
              max="10"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                saving
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {saving ? '保存中...' : '保存设置'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 
import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/router'

export default function SystemSettings() {
  const { user: currentUser, loading: authLoading } = useAuth()
  const router = useRouter()
  const [settings, setSettings] = useState<any>({
    registration_enabled: true,
    match_creation_enabled: true,
    maintenance_mode: false,
    system_notice: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 获取系统设置
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            // 如果没有设置记录，创建一个默认记录
            const { data: newData, error: createError } = await supabase
              .from('system_settings')
              .insert([settings])
              .select()
              .single()

            if (createError) throw createError
            if (newData) setSettings(newData)
          } else {
            throw error
          }
        } else if (data) {
          setSettings(data)
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // 检查权限
  useEffect(() => {
    if (!authLoading && (!currentUser || currentUser.role !== 'admin')) {
      router.push('/')
    }
  }, [authLoading, currentUser, router])

  // 保存设置
  const saveSettings = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('system_settings')
        .update(settings)
        .eq('id', settings.id)

      if (error) throw error

      alert('设置已保存')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('保存设置失败')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return null
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">系统设置</h1>
          <button
            onClick={() => router.push('/')}
            className="bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200"
          >
            返回
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              允许新用户注册
            </label>
            <div className="relative inline-block w-12 mr-2 align-middle select-none">
              <input
                type="checkbox"
                checked={settings.registration_enabled}
                onChange={(e) => setSettings({
                  ...settings,
                  registration_enabled: e.target.checked
                })}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
              />
              <label className={`toggle-label block overflow-hidden h-6 rounded-full ${
                settings.registration_enabled ? 'bg-blue-500' : 'bg-gray-300'
              } cursor-pointer`}></label>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              允许创建比赛
            </label>
            <div className="relative inline-block w-12 mr-2 align-middle select-none">
              <input
                type="checkbox"
                checked={settings.match_creation_enabled}
                onChange={(e) => setSettings({
                  ...settings,
                  match_creation_enabled: e.target.checked
                })}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
              />
              <label className={`toggle-label block overflow-hidden h-6 rounded-full ${
                settings.match_creation_enabled ? 'bg-blue-500' : 'bg-gray-300'
              } cursor-pointer`}></label>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              维护模式
            </label>
            <div className="relative inline-block w-12 mr-2 align-middle select-none">
              <input
                type="checkbox"
                checked={settings.maintenance_mode}
                onChange={(e) => setSettings({
                  ...settings,
                  maintenance_mode: e.target.checked
                })}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
              />
              <label className={`toggle-label block overflow-hidden h-6 rounded-full ${
                settings.maintenance_mode ? 'bg-blue-500' : 'bg-gray-300'
              } cursor-pointer`}></label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              系统公告
            </label>
            <textarea
              value={settings.system_notice}
              onChange={(e) => setSettings({
                ...settings,
                system_notice: e.target.value
              })}
              rows={4}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="输入系统公告内容..."
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={saving}
              className={`${
                saving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white px-4 py-2 rounded-lg`}
            >
              {saving ? '保存中...' : '保存设置'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .toggle-checkbox:checked {
          right: 0;
          border-color: #fff;
        }
        .toggle-checkbox:checked + .toggle-label {
          background-color: #3b82f6;
        }
        .toggle-checkbox {
          right: 6px;
          transition: all 0.3s;
        }
        .toggle-label {
          transition: background-color 0.3s;
        }
      `}</style>
    </div>
  )
} 
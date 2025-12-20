'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trash2, Edit2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import ScenarioCard from '@/app/components/ScenarioCard'
import StatisticsDashboard from '@/app/components/StatisticsDashboard'

interface WeaponDetail {
  weapon_id: number
  weapon_name: string
  icon_url: string | null
  display_order: number
}

interface UserScenario {
  code: string
  stage_id: number
  stage_name: string
  danger_rate: number
  total_golden_eggs: number
  created_at: string
  weapons: WeaponDetail[]
}

interface StageStats {
  stage_id: number
  stage_name: string
  count: number
}

interface LikedScenario {
  code: string
  stage_id: number
  stage_name: string
  danger_rate: number
  total_golden_eggs: number
  created_at: string
  weapons: WeaponDetail[]
}

interface StatisticsData {
  average_golden_eggs: number
  max_golden_eggs: number
  total_scenarios: number
  stage_stats: StageStats[]
  liked_scenarios: LikedScenario[]
}

interface User {
  id: string
  email: string
  name: string
}

interface ProfileClientProps {
  user: User
  initialScenarios: UserScenario[]
  initialStatisticsData?: StatisticsData | null
}

export default function ProfileClient({
  user,
  initialScenarios,
  initialStatisticsData,
}: ProfileClientProps) {
  const [scenarios, setScenarios] = useState(initialScenarios)
  const [deletingCodes, setDeletingCodes] = useState<Set<string>>(new Set())
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileName, setProfileName] = useState(user.name)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const router = useRouter()

  const handleDelete = useCallback(
    async (scenarioCode: string) => {
      if (!confirm('このシナリオを削除してもよろしいですか？')) {
        return
      }

      setDeletingCodes((prev) => new Set(prev).add(scenarioCode))

      try {
        const response = await fetch(`/api/scenarios/${scenarioCode}`, {
          method: 'DELETE',
        })

        const data = await response.json()

        if (data.success) {
          setScenarios((prev) => prev.filter((s) => s.code !== scenarioCode))
          toast.success('シナリオを削除しました')
        } else {
          toast.error(data.error || 'シナリオの削除に失敗しました')
        }
      } catch (error) {
        console.error('削除エラー:', error)
        toast.error('シナリオの削除に失敗しました')
      } finally {
        setDeletingCodes((prev) => {
          const next = new Set(prev)
          next.delete(scenarioCode)
          return next
        })
      }
    },
    []
  )

  const handleSaveProfile = useCallback(async () => {
    if (!profileName.trim()) {
      toast.error('ユーザー名を入力してください')
      return
    }

    setIsSavingProfile(true)

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: profileName.trim() }),
      })

      const data = await response.json()

      if (data.success) {
        setIsEditingProfile(false)
        toast.success('プロフィールを更新しました')
        router.refresh()
      } else {
        toast.error(data.error || 'プロフィールの更新に失敗しました')
      }
    } catch (error) {
      console.error('プロフィール更新エラー:', error)
      toast.error('プロフィールの更新に失敗しました')
    } finally {
      setIsSavingProfile(false)
    }
  }, [profileName, router])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* 戻るボタン */}
        <Link
          href="/"
          className="inline-flex items-center text-gray-400 hover:text-gray-200 mb-6 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          一覧に戻る
        </Link>

        {/* プロフィール情報 */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
            <div className="flex-1 mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-gray-100 mb-2">マイページ</h1>
              {!isEditingProfile ? (
                <div>
                  <p className="text-lg text-gray-300 mb-1">{user.name}</p>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="ユーザー名"
                    className="w-full md:w-64 bg-gray-700 text-gray-100 rounded-lg p-2 border border-gray-600 focus:border-orange-500 focus:outline-none mb-2"
                    maxLength={50}
                  />
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {!isEditingProfile ? (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="inline-flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  編集
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsEditingProfile(false)
                      setProfileName(user.name)
                    }}
                    className="inline-flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                    disabled={isSavingProfile}
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingProfile ? '保存中...' : '保存'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 統計ダッシュボード */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">統計ダッシュボード</h2>
          <StatisticsDashboard initialData={initialStatisticsData || undefined} />
        </div>

        {/* 投稿一覧 */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">投稿したシナリオ ({scenarios.length}件)</h2>
          {scenarios.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
              <p className="text-gray-400">まだ投稿がありません</p>
              <Link
                href="/analyze"
                className="inline-block mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
              >
                シナリオを解析・投稿する
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scenarios.map((scenario) => (
                <div key={scenario.code} className="relative">
                  <div className="relative">
                    <ScenarioCard
                      code={scenario.code}
                      stageName={scenario.stage_name}
                      dangerRate={scenario.danger_rate}
                      totalGoldenEggs={scenario.total_golden_eggs}
                      weapons={scenario.weapons}
                    />
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleDelete(scenario.code)
                        }}
                        disabled={deletingCodes.has(scenario.code)}
                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        title="削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    {formatDate(scenario.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


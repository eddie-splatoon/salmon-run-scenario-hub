'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import ScenarioCard from './ScenarioCard'

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
  weapons: Array<{
    weapon_id: number
    weapon_name: string
    icon_url: string | null
    display_order: number
  }>
}

interface StatisticsData {
  average_golden_eggs: number
  max_golden_eggs: number
  total_scenarios: number
  stage_stats: StageStats[]
  liked_scenarios: LikedScenario[]
}

interface StatisticsDashboardProps {
  initialData?: StatisticsData
}

// パイチャート用の色配列
const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']

export default function StatisticsDashboard({ initialData }: StatisticsDashboardProps) {
  const [data, setData] = useState<StatisticsData | null>(initialData || null)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!initialData) {
      // データが初期値として渡されていない場合、APIから取得
      const fetchStats = async () => {
        setIsLoading(true)
        setError(null)
        try {
          const response = await fetch('/api/profile/stats')
          const result = await response.json()

          if (result.success && result.data) {
            setData(result.data)
          } else {
            setError(result.error || '統計データの取得に失敗しました')
          }
        } catch (err) {
          console.error('統計データ取得エラー:', err)
          setError('統計データの取得中にエラーが発生しました')
        } finally {
          setIsLoading(false)
        }
      }

      fetchStats()
    }
  }, [initialData])

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
        <p className="text-gray-400">統計データを読み込み中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
        <p className="text-gray-400">データがありません</p>
      </div>
    )
  }

  // パイチャート用のデータを準備
  const pieChartData = data.stage_stats.map((stat) => ({
    name: stat.stage_name,
    value: stat.count,
  }))

  return (
    <div className="space-y-6">
      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-sm text-gray-400 mb-2">平均金イクラ数</div>
          <div className="text-3xl font-bold text-yellow-400">{data.average_golden_eggs}</div>
          <div className="text-xs text-gray-500 mt-1">
            {data.total_scenarios > 0
              ? `${data.total_scenarios}件の投稿から算出`
              : '投稿がありません'}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-sm text-gray-400 mb-2">最高記録</div>
          <div className="text-3xl font-bold text-orange-500">{data.max_golden_eggs}</div>
          <div className="text-xs text-gray-500 mt-1">これまでの最高納品数</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-sm text-gray-400 mb-2">総投稿数</div>
          <div className="text-3xl font-bold text-blue-400">{data.total_scenarios}</div>
          <div className="text-xs text-gray-500 mt-1">これまでの投稿数</div>
        </div>
      </div>

      {/* ステージ別投稿数のパイチャート */}
      {data.stage_stats.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">ステージ別投稿数</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* お気に入り（いいねした）シナリオの一覧 */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-gray-100 mb-4">
          お気に入りシナリオ ({data.liked_scenarios.length}件)
        </h2>
        {data.liked_scenarios.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">まだお気に入りのシナリオがありません</p>
            <p className="text-sm text-gray-500 mt-2">
              シナリオ詳細ページで「いいね」を押すと、ここに表示されます
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.liked_scenarios.map((scenario) => (
              <ScenarioCard
                key={scenario.code}
                code={scenario.code}
                stageName={scenario.stage_name}
                dangerRate={scenario.danger_rate}
                totalGoldenEggs={scenario.total_golden_eggs}
                weapons={scenario.weapons}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


'use client'

import { useEffect, useState } from 'react'
import ScenarioCard from './components/ScenarioCard'
import Link from 'next/link'

interface Weapon {
  weapon_id: number
  weapon_name: string
  icon_url: string | null
  display_order: number
}

interface ScenarioListItem {
  code: string
  stage_id: number
  stage_name: string
  danger_rate: number
  total_golden_eggs: number
  created_at: string
  weapons: Weapon[]
}

interface Stage {
  id: number
  name: string
}

interface WeaponMaster {
  id: number
  name: string
  icon_url: string | null
}

export default function Home() {
  const [scenarios, setScenarios] = useState<ScenarioListItem[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [weapons, setWeapons] = useState<WeaponMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // フィルター状態
  const [selectedStageId, setSelectedStageId] = useState<string>('')
  const [selectedWeaponIds, setSelectedWeaponIds] = useState<number[]>([])
  const [minDangerRate, setMinDangerRate] = useState<string>('')

  // マスタデータの取得
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [stagesRes, weaponsRes] = await Promise.all([
          fetch('/api/stages'),
          fetch('/api/weapons'),
        ])

        if (!stagesRes.ok || !weaponsRes.ok) {
          throw new Error('マスタデータの取得に失敗しました')
        }

        const stagesData = await stagesRes.json()
        const weaponsData = await weaponsRes.json()

        if (stagesData.success) {
          setStages(stagesData.data || [])
        }
        if (weaponsData.success) {
          setWeapons(weaponsData.data || [])
        }
      } catch (err) {
        console.error('マスタデータ取得エラー:', err)
        setError(err instanceof Error ? err.message : 'マスタデータの取得に失敗しました')
      }
    }

    fetchMasterData()
  }, [])

  // シナリオ一覧の取得
  useEffect(() => {
    const fetchScenarios = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (selectedStageId) {
          params.append('stage_id', selectedStageId)
        }
        if (selectedWeaponIds.length > 0) {
          params.append('weapon_ids', selectedWeaponIds.join(','))
        }
        if (minDangerRate) {
          params.append('min_danger_rate', minDangerRate)
        }

        const response = await fetch(`/api/scenarios?${params.toString()}`)
        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'シナリオ一覧の取得に失敗しました')
        }

        setScenarios(data.data || [])
      } catch (err) {
        console.error('シナリオ一覧取得エラー:', err)
        setError(err instanceof Error ? err.message : 'シナリオ一覧の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchScenarios()
  }, [selectedStageId, selectedWeaponIds, minDangerRate])

  const handleWeaponToggle = (weaponId: number) => {
    setSelectedWeaponIds((prev) =>
      prev.includes(weaponId) ? prev.filter((id) => id !== weaponId) : [...prev, weaponId]
    )
  }

  return (
    <main className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-4 text-gray-100">
            Salmon Run Scenario Hub
          </h1>
          <div className="flex justify-center gap-4">
            <Link
              href="/analyze"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              画像解析
            </Link>
          </div>
        </div>

        {/* フィルター */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">フィルター</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* ステージフィルター */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">ステージ</label>
              <select
                value={selectedStageId}
                onChange={(e) => setSelectedStageId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
              >
                <option value="">すべて</option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id.toString()}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>

            {/* キケン度フィルター */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                キケン度（最小値）
              </label>
              <input
                type="number"
                min="0"
                max="333"
                value={minDangerRate}
                onChange={(e) => setMinDangerRate(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
              />
            </div>

            {/* 武器フィルター（選択中の武器数を表示） */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                武器（{selectedWeaponIds.length}個選択中）
              </label>
              <div className="max-h-32 overflow-y-auto bg-gray-700 rounded p-2">
                {weapons.length === 0 ? (
                  <p className="text-sm text-gray-500">読み込み中...</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {weapons.map((weapon) => (
                      <button
                        key={weapon.id}
                        type="button"
                        onClick={() => handleWeaponToggle(weapon.id)}
                        className={`px-2 py-1 rounded text-xs transition-colors ${
                          selectedWeaponIds.includes(weapon.id)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                        title={weapon.name}
                      >
                        {weapon.icon_url ? (
                          <img
                            src={weapon.icon_url}
                            alt={weapon.name}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              if (target.parentElement) {
                                target.parentElement.textContent = weapon.name.substring(0, 2)
                              }
                            }}
                          />
                        ) : (
                          <span>{weapon.name.substring(0, 2)}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* シナリオ一覧 */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">読み込み中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400">エラー: {error}</p>
          </div>
        ) : scenarios.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">シナリオが見つかりませんでした</p>
            <p className="text-gray-500 text-sm mt-2">
              フィルター条件を変更して再度検索してください
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {scenarios.map((scenario) => (
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
    </main>
  )
}

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  Box,
  Typography,
} from '@mui/material'
import { Grid, List, Filter } from 'lucide-react'
import ScenarioCard from '@/app/components/ScenarioCard'

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

interface WeaponOption {
  id: number
  name: string
  icon_url: string | null
}

interface ScenariosListClientProps {
  stages: Stage[]
  weapons: WeaponOption[]
}

type ViewMode = 'card' | 'table'

export default function ScenariosListClient({ stages, weapons }: ScenariosListClientProps) {
  const [scenarios, setScenarios] = useState<ScenarioListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [selectedStageId, setSelectedStageId] = useState<number | ''>('')
  const [selectedWeaponIds, setSelectedWeaponIds] = useState<number[]>([])
  const [minDangerRate, setMinDangerRate] = useState(0)
  const router = useRouter()

  const fetchScenarios = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedStageId) {
        params.append('stage_id', String(selectedStageId))
      }
      if (selectedWeaponIds.length > 0) {
        params.append('weapon_ids', selectedWeaponIds.join(','))
      }
      if (minDangerRate > 0) {
        params.append('min_danger_rate', String(minDangerRate))
      }

      const response = await fetch(`/api/scenarios?${params.toString()}`)
      const data = await response.json()

      if (data.success && data.data) {
        setScenarios(data.data)
      } else {
        console.error('シナリオ取得エラー:', data.error)
        setScenarios([])
      }
    } catch (error) {
      console.error('シナリオ取得エラー:', error)
      setScenarios([])
    } finally {
      setLoading(false)
    }
  }, [selectedStageId, selectedWeaponIds, minDangerRate])

  useEffect(() => {
    fetchScenarios()
  }, [fetchScenarios])

  const handleStageChange = (stageId: number | '') => {
    setSelectedStageId(stageId)
  }

  const handleWeaponToggle = (weaponId: number) => {
    setSelectedWeaponIds((prev) => {
      if (prev.includes(weaponId)) {
        return prev.filter((id) => id !== weaponId)
      } else {
        return [...prev, weaponId]
      }
    })
  }

  const handleDangerRateChange = (_event: Event, newValue: number | number[]) => {
    setMinDangerRate(Array.isArray(newValue) ? newValue[0] : newValue)
  }

  const handleViewModeChange = (_event: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => {
    if (newMode !== null) {
      setViewMode(newMode)
    }
  }

  const clearFilters = () => {
    setSelectedStageId('')
    setSelectedWeaponIds([])
    setMinDangerRate(0)
  }

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-6">シナリオ一覧</h1>

        {/* フィルタセクション */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-100">フィルタ</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* ステージフィルタ */}
            <FormControl fullWidth>
              <InputLabel id="stage-select-label" className="text-gray-300">
                ステージ
              </InputLabel>
              <Select
                labelId="stage-select-label"
                value={selectedStageId}
                onChange={(e) => handleStageChange(e.target.value as number | '')}
                label="ステージ"
                className="bg-gray-700 text-gray-100"
                sx={{
                  color: '#e5e7eb',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#4b5563',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#f97316',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#f97316',
                  },
                  '& .MuiSvgIcon-root': {
                    color: '#e5e7eb',
                  },
                }}
              >
                <MenuItem value="">
                  <em>すべて</em>
                </MenuItem>
                {stages.map((stage) => (
                  <MenuItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 武器フィルタ */}
            <FormControl fullWidth>
              <InputLabel id="weapon-select-label" className="text-gray-300">
                武器
              </InputLabel>
              <Select
                labelId="weapon-select-label"
                multiple
                value={selectedWeaponIds}
                onChange={(e) => {
                  const value = e.target.value
                  setSelectedWeaponIds(typeof value === 'string' ? [] : value)
                }}
                label="武器"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as number[]).map((weaponId) => {
                      const weapon = weapons.find((w) => w.id === weaponId)
                      return weapon ? (
                        <Chip
                          key={weaponId}
                          label={weapon.name}
                          size="small"
                          onDelete={() => handleWeaponToggle(weaponId)}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                      ) : null
                    })}
                  </Box>
                )}
                className="bg-gray-700 text-gray-100"
                sx={{
                  color: '#e5e7eb',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#4b5563',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#f97316',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#f97316',
                  },
                  '& .MuiSvgIcon-root': {
                    color: '#e5e7eb',
                  },
                }}
              >
                {weapons.map((weapon) => (
                  <MenuItem key={weapon.id} value={weapon.id}>
                    {weapon.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* キケン度フィルタ */}
            <Box>
              <Typography className="text-gray-300 mb-2">
                最小キケン度: {minDangerRate}%
              </Typography>
              <Slider
                value={minDangerRate}
                onChange={handleDangerRateChange}
                min={0}
                max={333}
                step={1}
                valueLabelDisplay="auto"
                sx={{
                  color: '#f97316',
                  '& .MuiSlider-thumb': {
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: '0 0 0 8px rgba(249, 115, 22, 0.16)',
                    },
                  },
                }}
              />
            </Box>
          </div>

          {/* フィルタクリアボタン */}
          {(selectedStageId || selectedWeaponIds.length > 0 || minDangerRate > 0) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold rounded-lg transition-colors"
            >
              フィルタをクリア
            </button>
          )}
        </div>

        {/* 表示モード切り替えと結果数 */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-gray-400">
            {loading ? '読み込み中...' : `${scenarios.length}件のシナリオが見つかりました`}
          </div>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            aria-label="表示モード"
            sx={{
              '& .MuiToggleButton-root': {
                color: '#9ca3af',
                borderColor: '#4b5563',
                '&.Mui-selected': {
                  color: '#f97316',
                  borderColor: '#f97316',
                  backgroundColor: 'rgba(249, 115, 22, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(249, 115, 22, 0.2)',
                  },
                },
              },
            }}
          >
            <ToggleButton value="card" aria-label="カード表示">
              <Grid className="mr-2 h-4 w-4" />
              カード
            </ToggleButton>
            <ToggleButton value="table" aria-label="テーブル表示">
              <List className="mr-2 h-4 w-4" />
              テーブル
            </ToggleButton>
          </ToggleButtonGroup>
        </div>

        {/* シナリオ一覧 */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">読み込み中...</p>
          </div>
        ) : scenarios.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">シナリオが見つかりませんでした</p>
            <p className="text-gray-500 text-sm mt-2">フィルタ条件を変更してお試しください</p>
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-800 border-b border-gray-700">
                  <th className="border border-gray-600 px-4 py-3 text-left text-gray-200">コード</th>
                  <th className="border border-gray-600 px-4 py-3 text-left text-gray-200">ステージ</th>
                  <th className="border border-gray-600 px-4 py-3 text-left text-gray-200">キケン度</th>
                  <th className="border border-gray-600 px-4 py-3 text-left text-gray-200">金イクラ</th>
                  <th className="border border-gray-600 px-4 py-3 text-left text-gray-200">武器</th>
                  <th className="border border-gray-600 px-4 py-3 text-left text-gray-200">作成日時</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((scenario) => (
                  <tr
                    key={scenario.code}
                    className="bg-gray-800/50 hover:bg-gray-700/50 cursor-pointer"
                    onClick={() => router.push(`/scenarios/${scenario.code}`)}
                  >
                    <td className="border border-gray-600 px-4 py-3 text-gray-200 font-bold">
                      {scenario.code}
                    </td>
                    <td className="border border-gray-600 px-4 py-3 text-gray-300">
                      {scenario.stage_name}
                    </td>
                    <td className="border border-gray-600 px-4 py-3 text-red-400 font-semibold">
                      {scenario.danger_rate}%
                    </td>
                    <td className="border border-gray-600 px-4 py-3 text-yellow-400 font-semibold">
                      {scenario.total_golden_eggs}
                    </td>
                    <td className="border border-gray-600 px-4 py-3">
                      <div className="flex gap-1">
                        {scenario.weapons.slice(0, 4).map((weapon) => (
                          <div
                            key={weapon.weapon_id}
                            className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center"
                            title={weapon.weapon_name}
                          >
                            {weapon.icon_url ? (
                              <img
                                src={weapon.icon_url}
                                alt={weapon.weapon_name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <span className="text-xs text-gray-300">{weapon.weapon_name.charAt(0)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="border border-gray-600 px-4 py-3 text-gray-400 text-sm">
                      {new Date(scenario.created_at).toLocaleDateString('ja-JP')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}


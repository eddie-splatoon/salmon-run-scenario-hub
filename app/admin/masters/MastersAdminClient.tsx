'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'

interface Stage {
  id: number
  name: string
  image_url: string | null
  created_at: string
  updated_at: string
}

interface Weapon {
  id: number
  name: string
  icon_url: string | null
  is_grizzco_weapon: boolean
  created_at: string
  updated_at: string
}

interface UnknownStage {
  id: number
  name: string
  detected_at: string
  resolved_at: string | null
}

interface UnknownWeapon {
  id: number
  name: string
  detected_at: string
  resolved_at: string | null
}

type TabType = 'stages' | 'weapons' | 'unknown'

export default function MastersAdminClient() {
  const [activeTab, setActiveTab] = useState<TabType>('stages')
  const [stages, setStages] = useState<Stage[]>([])
  const [weapons, setWeapons] = useState<Weapon[]>([])
  const [unknownStages, setUnknownStages] = useState<UnknownStage[]>([])
  const [unknownWeapons, setUnknownWeapons] = useState<UnknownWeapon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingStage, setEditingStage] = useState<Stage | null>(null)
  const [editingWeapon, setEditingWeapon] = useState<Weapon | null>(null)
  const [showAddStage, setShowAddStage] = useState(false)
  const [showAddWeapon, setShowAddWeapon] = useState(false)

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      if (activeTab === 'stages') {
        const response = await fetch('/api/admin/masters/stages')
        const data = await response.json()
        if (data.success) {
          setStages(data.data)
        } else {
          setError(data.error || 'データの取得に失敗しました')
        }
      } else if (activeTab === 'weapons') {
        const response = await fetch('/api/admin/masters/weapons')
        const data = await response.json()
        if (data.success) {
          setWeapons(data.data)
        } else {
          setError(data.error || 'データの取得に失敗しました')
        }
      } else if (activeTab === 'unknown') {
        const stagesResponse = await fetch('/api/admin/unknown?type=stages')
        const stagesData = await stagesResponse.json()
        if (stagesData.success) {
          setUnknownStages(stagesData.data)
        } else {
          setError(stagesData.error || '未知のステージデータの取得に失敗しました')
        }

        const weaponsResponse = await fetch('/api/admin/unknown?type=weapons')
        const weaponsData = await weaponsResponse.json()
        if (weaponsData.success) {
          setUnknownWeapons(weaponsData.data)
        } else {
          setError(weaponsData.error || '未知の武器データの取得に失敗しました')
        }
      }
    } catch (err) {
      setError('データの取得に失敗しました')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleDeleteStage = async (id: number) => {
    if (!confirm('このステージを削除しますか？')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/masters/stages/${id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        await loadData()
      } else {
        alert(data.error || '削除に失敗しました')
      }
    } catch (err) {
      alert('削除に失敗しました')
      console.error(err)
    }
  }

  const handleDeleteWeapon = async (id: number) => {
    if (!confirm('この武器を削除しますか？')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/masters/weapons/${id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        await loadData()
      } else {
        alert(data.error || '削除に失敗しました')
      }
    } catch (err) {
      alert('削除に失敗しました')
      console.error(err)
    }
  }

  const handleSaveStage = async (stage: { name: string; image_url?: string }) => {
    try {
      const url = editingStage
        ? `/api/admin/masters/stages/${editingStage.id}`
        : '/api/admin/masters/stages'
      const method = editingStage ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stage),
      })

      const data = await response.json()
      if (data.success) {
        setEditingStage(null)
        setShowAddStage(false)
        await loadData()
      } else {
        alert(data.error || '保存に失敗しました')
      }
    } catch (err) {
      alert('保存に失敗しました')
      console.error(err)
    }
  }

  const handleSaveWeapon = async (weapon: {
    name: string
    icon_url?: string
    is_grizzco_weapon?: boolean
  }) => {
    try {
      const url = editingWeapon
        ? `/api/admin/masters/weapons/${editingWeapon.id}`
        : '/api/admin/masters/weapons'
      const method = editingWeapon ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(weapon),
      })

      const data = await response.json()
      if (data.success) {
        setEditingWeapon(null)
        setShowAddWeapon(false)
        await loadData()
      } else {
        alert(data.error || '保存に失敗しました')
      }
    } catch (err) {
      alert('保存に失敗しました')
      console.error(err)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">マスタ管理</h1>

      {/* タブ */}
      <div className="flex space-x-2 mb-6 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('stages')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'stages'
              ? 'text-orange-500 border-b-2 border-orange-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          ステージ
        </button>
        <button
          onClick={() => setActiveTab('weapons')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'weapons'
              ? 'text-orange-500 border-b-2 border-orange-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          武器
        </button>
        <button
          onClick={() => setActiveTab('unknown')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'unknown'
              ? 'text-orange-500 border-b-2 border-orange-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          未知データ
          {(unknownStages.length > 0 || unknownWeapons.length > 0) && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unknownStages.length + unknownWeapons.length}
            </span>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-400">読み込み中...</div>
      ) : (
        <>
          {activeTab === 'stages' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">ステージ一覧</h2>
                <button
                  onClick={() => {
                    setShowAddStage(true)
                    setEditingStage(null)
                  }}
                  className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>追加</span>
                </button>
              </div>

              {showAddStage && (
                <StageForm
                  stage={editingStage}
                  onSave={handleSaveStage}
                  onCancel={() => {
                    setShowAddStage(false)
                    setEditingStage(null)
                  }}
                />
              )}

              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                        名前
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                        画像URL
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {stages.map((stage) => (
                      <tr key={stage.id} className="hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm text-gray-300">{stage.id}</td>
                        <td className="px-4 py-3 text-sm text-white">{stage.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {stage.image_url || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => {
                                setEditingStage(stage)
                                setShowAddStage(true)
                              }}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStage(stage.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'weapons' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">武器一覧</h2>
                <button
                  onClick={() => {
                    setShowAddWeapon(true)
                    setEditingWeapon(null)
                  }}
                  className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>追加</span>
                </button>
              </div>

              {showAddWeapon && (
                <WeaponForm
                  weapon={editingWeapon}
                  onSave={handleSaveWeapon}
                  onCancel={() => {
                    setShowAddWeapon(false)
                    setEditingWeapon(null)
                  }}
                />
              )}

              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                        名前
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                        アイコンURL
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                        クマサン武器
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {weapons.map((weapon) => (
                      <tr key={weapon.id} className="hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm text-gray-300">{weapon.id}</td>
                        <td className="px-4 py-3 text-sm text-white">{weapon.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {weapon.icon_url || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {weapon.is_grizzco_weapon ? (
                            <CheckCircle2 className="h-5 w-5 text-yellow-500" />
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => {
                                setEditingWeapon(weapon)
                                setShowAddWeapon(true)
                              }}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteWeapon(weapon.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'unknown' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span>未知のステージ</span>
                  {unknownStages.length > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                      {unknownStages.length}
                    </span>
                  )}
                </h2>
                {unknownStages.length === 0 ? (
                  <div className="bg-gray-800 rounded-lg p-4 text-gray-400 text-center">
                    未知のステージはありません
                  </div>
                ) : (
                  <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                            名前
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                            検出日時
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {unknownStages.map((stage) => (
                          <tr key={stage.id} className="hover:bg-gray-700/50">
                            <td className="px-4 py-3 text-sm text-white">{stage.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-400">
                              {new Date(stage.detected_at).toLocaleString('ja-JP')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span>未知の武器</span>
                  {unknownWeapons.length > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                      {unknownWeapons.length}
                    </span>
                  )}
                </h2>
                {unknownWeapons.length === 0 ? (
                  <div className="bg-gray-800 rounded-lg p-4 text-gray-400 text-center">
                    未知の武器はありません
                  </div>
                ) : (
                  <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                            名前
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                            検出日時
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {unknownWeapons.map((weapon) => (
                          <tr key={weapon.id} className="hover:bg-gray-700/50">
                            <td className="px-4 py-3 text-sm text-white">{weapon.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-400">
                              {new Date(weapon.detected_at).toLocaleString('ja-JP')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

interface StageFormProps {
  stage: Stage | null
  onSave: (stage: { name: string; image_url?: string }) => void
  onCancel: () => void
}

function StageForm({ stage, onSave, onCancel }: StageFormProps) {
  const [name, setName] = useState(stage?.name || '')
  const [imageUrl, setImageUrl] = useState(stage?.image_url || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ name, image_url: imageUrl || undefined })
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-bold text-white mb-4">
        {stage ? 'ステージを編集' : 'ステージを追加'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">名前</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">画像URL</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div className="flex space-x-2">
          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            保存
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  )
}

interface WeaponFormProps {
  weapon: Weapon | null
  onSave: (weapon: { name: string; icon_url?: string; is_grizzco_weapon?: boolean }) => void
  onCancel: () => void
}

function WeaponForm({ weapon, onSave, onCancel }: WeaponFormProps) {
  const [name, setName] = useState(weapon?.name || '')
  const [iconUrl, setIconUrl] = useState(weapon?.icon_url || '')
  const [isGrizzcoWeapon, setIsGrizzcoWeapon] = useState(weapon?.is_grizzco_weapon || false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ name, icon_url: iconUrl || undefined, is_grizzco_weapon: isGrizzcoWeapon })
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-bold text-white mb-4">
        {weapon ? '武器を編集' : '武器を追加'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">名前</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">アイコンURL</label>
          <input
            type="url"
            value={iconUrl}
            onChange={(e) => setIconUrl(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isGrizzcoWeapon}
              onChange={(e) => setIsGrizzcoWeapon(e.target.checked)}
              className="w-4 h-4 text-orange-500 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
            />
            <span className="text-sm text-gray-300">クマサン武器</span>
          </label>
        </div>
        <div className="flex space-x-2">
          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            保存
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  )
}


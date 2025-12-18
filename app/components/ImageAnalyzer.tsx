'use client'

import { useState, useEffect, useRef } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { AnalyzedScenario, AnalyzeResponse, WaveInfo } from '@/app/types/analyze'

interface Stage {
  id: number
  name: string
}

interface Weapon {
  id: number
  name: string
}

// イベントの選択肢
const EVENT_OPTIONS = [
  { value: '', label: 'なし' },
  { value: 'ハコビヤ襲来', label: 'ハコビヤ襲来' },
  { value: 'キンシャケ探し', label: 'キンシャケ探し' },
  { value: 'グリル発進', label: 'グリル発進' },
  { value: 'ドスコイ大量発生', label: 'ドスコイ大量発生' },
  { value: 'ラッシュ', label: 'ラッシュ' },
  { value: '霧', label: '霧' },
]

// オカシラの選択肢（WAVE EX用）
const OCCASULAR_OPTIONS = [
  { value: 'ヨコヅナ', label: 'ヨコヅナ' },
  { value: 'タツ', label: 'タツ' },
  { value: 'ジョー', label: 'ジョー' },
  { value: 'オカシラ連合', label: 'オカシラ連合' },
]

export default function ImageAnalyzer() {
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalyzedScenario | null>(null)
  const [editableData, setEditableData] = useState<AnalyzedScenario | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [weapons, setWeapons] = useState<Weapon[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)

  // プレビューURLのクリーンアップ
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // コンポーネントのアンマウント時に進行中のリクエストをキャンセル
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // ステージ一覧を取得
  useEffect(() => {
    const fetchStages = async () => {
      try {
        const response = await fetch('/api/stages')
        const data = await response.json()
        if (data.success && data.data) {
          setStages(data.data)
        }
      } catch (err) {
        console.error('Failed to fetch stages:', err)
      }
    }
    fetchStages()
  }, [])

  // 武器一覧を取得
  useEffect(() => {
    const fetchWeapons = async () => {
      try {
        const response = await fetch('/api/weapons')
        const data = await response.json()
        if (data.success && data.data) {
          setWeapons(data.data)
        }
      } catch (err) {
        console.error('Failed to fetch weapons:', err)
      }
    }
    fetchWeapons()
  }, [])

  // プレビューURLのクリーンアップ
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // コンポーネントのアンマウント時に進行中のリクエストをキャンセル
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // 進行中のリクエストをキャンセル
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }

      // 古いプレビューURLを破棄
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }

      setIsAnalyzing(false)
      setSelectedImage(file)
      setAnalysisResult(null)
      setError(null)

      // プレビュー用のURLを生成
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError('画像を選択してください')
      return
    }

    // 前のリクエストをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // 新しいAbortControllerを作成
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setIsAnalyzing(true)
    setError(null)
    setAnalysisResult(null)

    try {
      const formData = new FormData()
      formData.append('image', selectedImage)

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
        signal: abortController.signal,
      })

      // リクエストがキャンセルされた場合は何もしない
      if (abortController.signal.aborted) {
        return
      }

      const data: AnalyzeResponse = await response.json()

      // リクエストがキャンセルされた場合は何もしない（JSONパース後もチェック）
      if (abortController.signal.aborted) {
        return
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || '解析に失敗しました')
      }

      if (data.data) {
        // WAVE EXの場合、イベントをデフォルトで「ヨコヅナ」に設定（解析結果がない場合）
        const processedData = {
          ...data.data,
          waves: data.data.waves.map((wave) => {
            if (wave.wave_number === 'EX') {
              return {
                ...wave,
                event: wave.event || 'ヨコヅナ', // 解析結果がない場合はデフォルトで「ヨコヅナ」
              }
            }
            return wave
          }),
        }
        setAnalysisResult(processedData)
        setEditableData(processedData)

        // 重複チェック
        checkDuplicate(processedData.scenario_code)
      }
    } catch (err) {
      // AbortErrorの場合はエラーとして扱わない
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      setError(err instanceof Error ? err.message : '解析中にエラーが発生しました')
    } finally {
      // このリクエストがまだアクティブな場合のみ状態を更新
      if (!abortController.signal.aborted) {
        setIsAnalyzing(false)
        abortControllerRef.current = null
      }
    }
  }

  const handleClear = () => {
    // プレビューURLを破棄
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setSelectedImage(null)
    setPreviewUrl(null)
    setAnalysisResult(null)
    setEditableData(null)
    setError(null)
    setSuccessMessage(null)
    setDuplicateWarning(null)
  }

  const checkDuplicate = async (scenarioCode: string) => {
    try {
      const response = await fetch(`/api/scenarios/check?code=${encodeURIComponent(scenarioCode)}`)
      const data = await response.json()

      if (data.success && data.exists) {
        setDuplicateWarning(`このシナリオコード "${scenarioCode}" は既に登録されています。保存しようとするとエラーになります。`)
      } else {
        setDuplicateWarning(null)
      }
    } catch (err) {
      console.error('Failed to check duplicate:', err)
      // 重複チェックのエラーは警告として表示しない（保存時にエラーが表示される）
    }
  }

  const handleFieldChange = (field: keyof AnalyzedScenario, value: string | number | string[] | undefined) => {
    if (!editableData) return

    setEditableData({
      ...editableData,
      [field]: value,
    })

    // シナリオコードが変更された場合は重複チェック
    if (field === 'scenario_code') {
      setDuplicateWarning(null) // 一旦警告をクリア
      if (typeof value === 'string' && value.trim()) {
        checkDuplicate(value.trim())
      }
    }
  }

  const handleWaveChange = (waveIndex: number, field: keyof WaveInfo, value: string | number | boolean | null | undefined) => {
    if (!editableData) return

    const updatedWaves = [...editableData.waves]

    updatedWaves[waveIndex] = {
      ...updatedWaves[waveIndex],
      [field]: value,
    }

    setEditableData({
      ...editableData,
      waves: updatedWaves,
    })
  }

  const handleWeaponChange = (weaponIndex: number, value: string) => {
    if (!editableData) return

    const updatedWeapons = [...editableData.weapons]
    updatedWeapons[weaponIndex] = value

    setEditableData({
      ...editableData,
      weapons: updatedWeapons,
    })
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!editableData) return

    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      console.warn('[ImageAnalyzer] 保存開始:', editableData)
      const response = await fetch('/api/scenarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editableData),
      })

      const data = await response.json()
      console.warn('[ImageAnalyzer] レスポンス:', { status: response.status, data })

      if (!response.ok || !data.success) {
        const errorMessage = data.error || '保存に失敗しました'
        console.error('[ImageAnalyzer] 保存エラー:', {
          status: response.status,
          error: errorMessage,
          data,
        })
        throw new Error(errorMessage)
      }

      console.warn('[ImageAnalyzer] 保存成功')
      setSuccessMessage('シナリオを保存しました')
      
      // ホームページにリダイレクト（詳細ページは別Issueで実装予定）
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 1500)
    } catch (err) {
      console.error('[ImageAnalyzer] 保存処理中にエラー:', err)
      setError(err instanceof Error ? err.message : '保存中にエラーが発生しました')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-100">画像解析</h2>

      {/* 画像アップロード */}
      <div className="mb-6">
        <label
          htmlFor="image-upload"
          className="block mb-2 text-sm font-medium text-gray-300"
        >
          サーモンランの結果画像を選択
        </label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          disabled={isAnalyzing}
        />
      </div>

      {/* プレビュー */}
      {previewUrl && (
        <div className="mb-6">
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt="プレビュー"
              className="max-w-full h-auto border border-gray-700 rounded-lg shadow-lg"
            />
          </div>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-700 text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* 成功メッセージ */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-900/30 border border-green-700 text-green-200 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* 重複警告 */}
      {duplicateWarning && (
        <div className="mb-4 p-4 bg-yellow-900/30 border border-yellow-700 text-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-yellow-400">⚠️</span>
            <span>{duplicateWarning}</span>
          </div>
        </div>
      )}

      {/* 解析ボタン */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={handleAnalyze}
          disabled={!selectedImage || isAnalyzing}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? '解析中...' : '解析する'}
        </button>
        {(selectedImage || analysisResult) && (
          <button
            onClick={handleClear}
            disabled={isAnalyzing}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            クリア
          </button>
        )}
      </div>

      {/* 解析結果と編集フォーム */}
      {editableData && (
        <form onSubmit={handleSave} className="mt-6 p-6 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-gray-100">解析結果の確認と編集</h3>

          <div className="space-y-6">
            {/* 基本情報 */}
            <div>
              <h4 className="font-semibold mb-3 text-gray-200">基本情報</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    シナリオコード
                  </label>
                  <input
                    type="text"
                    value={editableData.scenario_code}
                    onChange={(e) => handleFieldChange('scenario_code', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    ステージ
                  </label>
                  <select
                    value={editableData.stage_name}
                    onChange={(e) => handleFieldChange('stage_name', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
                    required
                  >
                    <option value="">選択してください</option>
                    {stages.map((stage) => (
                      <option key={stage.id} value={stage.name}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    キケン度
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="333"
                    value={editableData.danger_rate ?? ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10)
                      if (!isNaN(value)) {
                        handleFieldChange('danger_rate', value)
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
                    required
                  />
                </div>
                {editableData.score !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      スコア
                    </label>
                    <input
                      type="number"
                      value={editableData.score ?? ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10)
                        if (value === undefined || !isNaN(value)) {
                          handleFieldChange('score', value)
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 武器 */}
            <div>
              <h4 className="font-semibold mb-3 text-gray-200">武器</h4>
              <div className="space-y-2">
                {editableData.weapons.map((weapon, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      武器 {index + 1}
                    </label>
                    <select
                      value={weapon}
                      onChange={(e) => handleWeaponChange(index, e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
                      required
                    >
                      <option value="">選択してください</option>
                      {weapons.map((w) => (
                        <option key={w.id} value={w.name}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* WAVE情報 */}
            <div>
              <h4 className="font-semibold mb-3 text-gray-200">WAVE情報</h4>
              <div className="space-y-4">
                {editableData.waves.map((wave, index) => {
                  const isExWave = wave.wave_number === 'EX'
                  return (
                    <div
                      key={index}
                      className="p-4 bg-gray-700/50 rounded border border-gray-600"
                    >
                      <div className="font-semibold mb-3 text-gray-100">
                        WAVE {wave.wave_number}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">
                            潮位
                          </label>
                          <select
                            value={wave.tide}
                            onChange={(e) => handleWaveChange(index, 'tide', e.target.value as 'low' | 'normal' | 'high')}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
                            required
                          >
                            <option value="low">干潮</option>
                            <option value="normal">通常</option>
                            <option value="high">満潮</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">
                            {isExWave ? 'オカシラ' : 'イベント'}
                          </label>
                          {isExWave ? (
                            <select
                              value={wave.event || 'ヨコヅナ'}
                              onChange={(e) => handleWaveChange(index, 'event', e.target.value || null)}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
                              required
                            >
                              {OCCASULAR_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <select
                              value={wave.event || ''}
                              onChange={(e) => handleWaveChange(index, 'event', e.target.value || null)}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
                            >
                              {EVENT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        {!isExWave && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-1">
                                納品数
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={wave.delivered_count ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                                  if (!isNaN(value)) {
                                    handleWaveChange(index, 'delivered_count', value)
                                  }
                                }}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-1">
                                ノルマ
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={wave.quota ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10)
                                  if (value === undefined || !isNaN(value)) {
                                    handleWaveChange(index, 'quota', value)
                                  }
                                }}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
                              />
                            </div>
                          </>
                        )}
                        {wave.cleared !== undefined && (
                          <div className={isExWave ? '' : 'col-span-2'}>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={wave.cleared}
                                onChange={(e) => handleWaveChange(index, 'cleared', e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                              />
                              <span className="text-sm font-medium text-gray-400">クリア</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 保存ボタン */}
            <div className="flex gap-4 pt-4 border-t border-gray-700">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? '保存中...' : '保存する'}
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={isSaving}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                クリア
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}


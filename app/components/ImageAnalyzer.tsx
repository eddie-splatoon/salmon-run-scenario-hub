'use client'

import { useState } from 'react'
import type { AnalyzedScenario, AnalyzeResponse } from '@/app/types/analyze'

export default function ImageAnalyzer() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalyzedScenario | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
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

    setIsAnalyzing(true)
    setError(null)
    setAnalysisResult(null)

    try {
      const formData = new FormData()
      formData.append('image', selectedImage)

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      const data: AnalyzeResponse = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || '解析に失敗しました')
      }

      if (data.data) {
        setAnalysisResult(data.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析中にエラーが発生しました')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleClear = () => {
    setSelectedImage(null)
    setPreviewUrl(null)
    setAnalysisResult(null)
    setError(null)
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

      {/* 解析結果 */}
      {analysisResult && (
        <div className="mt-6 p-6 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-gray-100">解析結果</h3>

          <div className="space-y-4">
            {/* 基本情報 */}
            <div>
              <h4 className="font-semibold mb-2 text-gray-200">基本情報</h4>
              <dl className="grid grid-cols-2 gap-2">
                <div>
                  <dt className="text-gray-400 text-sm">シナリオコード</dt>
                  <dd className="font-mono text-gray-100">{analysisResult.scenario_code}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 text-sm">ステージ</dt>
                  <dd className="text-gray-100">{analysisResult.stage_name}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 text-sm">キケン度</dt>
                  <dd className="text-gray-100">{analysisResult.danger_rate}%</dd>
                </div>
                {analysisResult.score && (
                  <div>
                    <dt className="text-gray-400 text-sm">スコア</dt>
                    <dd className="text-gray-100">{analysisResult.score}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* 武器 */}
            <div>
              <h4 className="font-semibold mb-2 text-gray-200">武器</h4>
              <ul className="list-disc list-inside text-gray-100">
                {analysisResult.weapons.map((weapon, index) => (
                  <li key={index}>{weapon}</li>
                ))}
              </ul>
            </div>

            {/* WAVE情報 */}
            <div>
              <h4 className="font-semibold mb-2 text-gray-200">WAVE情報</h4>
              <div className="space-y-3">
                {analysisResult.waves.map((wave, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-700/50 rounded border border-gray-600"
                  >
                    <div className="font-semibold mb-2 text-gray-100">
                      WAVE {wave.wave_number}
                    </div>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-gray-400">潮位</dt>
                        <dd className="text-gray-100">
                          {wave.tide === 'low'
                            ? '干潮'
                            : wave.tide === 'high'
                              ? '満潮'
                              : '通常'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-400">イベント</dt>
                        <dd className="text-gray-100">{wave.event || 'なし'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-400">納品数</dt>
                        <dd className="text-gray-100">{wave.delivered_count}</dd>
                      </div>
                      {wave.quota && (
                        <div>
                          <dt className="text-gray-400">ノルマ</dt>
                          <dd className="text-gray-100">{wave.quota}</dd>
                        </div>
                      )}
                      {wave.cleared !== undefined && (
                        <div>
                          <dt className="text-gray-400">クリア</dt>
                          <dd className="text-gray-100">{wave.cleared ? '✓' : '✗'}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


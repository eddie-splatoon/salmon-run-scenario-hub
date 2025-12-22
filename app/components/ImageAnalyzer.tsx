'use client'

import React, { useState, useEffect, useRef } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  TextField,
  Autocomplete,
  Button,
  Checkbox,
  FormControlLabel,
  Alert,
  AlertTitle,
  Paper,
  Box,
  Typography,
  CircularProgress,
  Grid,
} from '@mui/material'
import { Upload, Clear, Save } from '@mui/icons-material'
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
  const [duplicateScenarioCode, setDuplicateScenarioCode] = useState<string | null>(null)
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
      // 画像ファイルかどうかをチェック
      if (!file.type.startsWith('image/')) {
        setError('画像ファイルを選択してください')
        return
      }

      // ファイルサイズのチェック（10MB制限）
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        setError('画像ファイルのサイズが大きすぎます（最大10MB）')
        return
      }

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
      setDuplicateWarning(null)

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
    setDuplicateScenarioCode(null)
  }

  const checkDuplicate = async (scenarioCode: string) => {
    try {
      const response = await fetch(`/api/scenarios/check?code=${encodeURIComponent(scenarioCode)}`)
      const data = await response.json()

      if (data.success && data.exists) {
        setDuplicateWarning(`このシナリオコード "${scenarioCode}" は既に投稿されています。`)
        setDuplicateScenarioCode(data.scenario_code || scenarioCode)
      } else {
        setDuplicateWarning(null)
        setDuplicateScenarioCode(null)
      }
    } catch (err) {
      console.error('Failed to check duplicate:', err)
      // 重複チェックのエラーは警告として表示しない（保存時にエラーが表示される）
      setDuplicateWarning(null)
      setDuplicateScenarioCode(null)
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
      setDuplicateScenarioCode(null)
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

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileButtonClick = () => {
    fileInputRef.current?.click()
  }

  const muiTextFieldSx = {
    width: '100%',
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#374151',
      color: '#e5e7eb',
      width: '100%',
      '& fieldset': {
        borderColor: '#4b5563',
      },
      '&:hover fieldset': {
        borderColor: '#f97316',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#f97316',
      },
      '& .MuiOutlinedInput-input': {
        width: '100%',
      },
    },
    '& .MuiInputLabel-root': {
      color: '#9ca3af',
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#f97316',
    },
  }

  const muiAutocompleteSx = {
    width: '100%',
    '& .MuiAutocomplete-popupIndicator': {
      color: '#e5e7eb',
    },
    '& .MuiAutocomplete-clearIndicator': {
      color: '#e5e7eb',
    },
    '& .MuiAutocomplete-inputRoot': {
      width: '100%',
      '& .MuiAutocomplete-input': {
        width: '100% !important',
        minWidth: '0 !important',
      },
    },
  }

  const muiPaperSx = {
    backgroundColor: '#1f2937',
    color: '#e5e7eb',
    '& .MuiAutocomplete-option': {
      '&:hover': {
        backgroundColor: '#374151',
      },
      '&[aria-selected="true"]': {
        backgroundColor: '#f97316',
        '&:hover': {
          backgroundColor: '#ea580c',
        },
      },
    },
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '1400px', mx: 'auto', p: 3 }}>
      <Typography variant="h4" component="h2" sx={{ mb: 3, color: '#e5e7eb', fontWeight: 'bold' }}>
        画像解析
      </Typography>

      {/* 画像アップロード */}
      <Box sx={{ mb: 3 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
          disabled={isAnalyzing}
        />
        <Button
          variant="contained"
          component="label"
          startIcon={<Upload />}
          onClick={handleFileButtonClick}
          disabled={isAnalyzing}
          sx={{
            backgroundColor: '#3b82f6',
            '&:hover': {
              backgroundColor: '#2563eb',
            },
          }}
        >
          サーモンランの結果画像を選択
        </Button>
      </Box>

      {/* プレビュー */}
      {previewUrl && (
        <Box sx={{ mb: 3, position: 'relative', display: 'inline-block' }}>
          <img
            src={previewUrl}
            alt="プレビュー"
            style={{ maxWidth: '100%', height: 'auto', border: '1px solid #374151', borderRadius: '8px' }}
          />
          {isAnalyzing && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(17, 24, 39, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress sx={{ mb: 2, color: '#3b82f6' }} />
                <Typography sx={{ color: '#e5e7eb', fontWeight: 'bold' }}>クマサンが解析中...</Typography>
                <Typography sx={{ color: '#9ca3af', fontSize: '0.875rem', mt: 1 }}>
                  しばらくお待ちください
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* 解析中のスケルトン表示 */}
      {isAnalyzing && !previewUrl && (
        <Box
          sx={{
            mb: 3,
            width: '100%',
            height: '256px',
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2, color: '#3b82f6' }} />
            <Typography sx={{ color: '#e5e7eb', fontWeight: 'bold' }}>クマサンが解析中...</Typography>
            <Typography sx={{ color: '#9ca3af', fontSize: '0.875rem', mt: 1 }}>
              しばらくお待ちください
            </Typography>
          </Box>
        </Box>
      )}

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, backgroundColor: 'rgba(127, 29, 29, 0.3)', color: '#fca5a5' }}>
          <AlertTitle>エラー</AlertTitle>
          {error}
        </Alert>
      )}

      {/* 成功メッセージ */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2, backgroundColor: 'rgba(20, 83, 45, 0.3)', color: '#86efac' }}>
          {successMessage}
        </Alert>
      )}

      {/* 重複警告 */}
      {duplicateWarning && (
        <Alert
          severity="warning"
          sx={{ mb: 2, backgroundColor: 'rgba(113, 63, 18, 0.3)', color: '#fde047' }}
        >
          <AlertTitle>警告</AlertTitle>
          {duplicateWarning}
          {duplicateScenarioCode && (
            <Box sx={{ mt: 1 }}>
              <Link
                href={`/scenarios/${duplicateScenarioCode}`}
                style={{ color: '#60a5fa', textDecoration: 'underline' }}
              >
                既存のシナリオを確認する →
              </Link>
            </Box>
          )}
        </Alert>
      )}

      {/* 解析ボタン */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleAnalyze}
          disabled={!selectedImage || isAnalyzing || isSaving}
          startIcon={isAnalyzing ? <CircularProgress size={16} sx={{ color: '#ffffff' }} /> : null}
          sx={{
            backgroundColor: '#3b82f6',
            '&:hover': {
              backgroundColor: '#2563eb',
            },
          }}
        >
          {isAnalyzing ? '解析中...' : '解析する'}
        </Button>
        {(selectedImage || analysisResult) && (
          <Button
            variant="outlined"
            onClick={handleClear}
            disabled={isAnalyzing}
            startIcon={<Clear />}
            sx={{
              color: '#e5e7eb',
              borderColor: '#4b5563',
              '&:hover': {
                borderColor: '#6b7280',
                backgroundColor: 'rgba(75, 85, 99, 0.1)',
              },
            }}
          >
            クリア
          </Button>
        )}
      </Box>

      {/* 解析結果と編集フォーム */}
      {editableData && (
        <Paper
          component="form"
          onSubmit={handleSave}
          sx={{
            mt: 3,
            p: 3,
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
          }}
        >
          <Typography variant="h5" component="h3" sx={{ mb: 3, color: '#e5e7eb', fontWeight: 'bold' }}>
            解析結果の確認と編集
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* 基本情報 */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: '#e5e7eb', fontWeight: 'semibold' }}>
                基本情報
              </Typography>
              <Grid container spacing={2}>
                {/* 1行目: シナリオコード、ステージ */}
                <Grid {...({ item: true, xs: 12, md: 6 } as any)}>
                  <TextField
                    fullWidth
                    label="シナリオコード"
                    value={editableData.scenario_code}
                    onChange={(e) => handleFieldChange('scenario_code', e.target.value)}
                    required
                    sx={muiTextFieldSx}
                    inputProps={{ style: { fontFamily: 'monospace' } }}
                  />
                </Grid>
                
                <Grid {...({ item: true, xs: 12, md: 6 } as any)}>
                  <Autocomplete
                    fullWidth
                    options={stages}
                    getOptionLabel={(option) => option.name || ''}
                    value={stages.find((s) => s.name === editableData.stage_name) || null}
                    onChange={(_event, newValue) => {
                      handleFieldChange('stage_name', newValue?.name || '')
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="ステージ" required sx={muiTextFieldSx} fullWidth />
                    )}
                    sx={muiAutocompleteSx}
                    PaperComponent={({ children, ...other }) => (
                      <Paper {...other} sx={muiPaperSx}>
                        {children}
                      </Paper>
                    )}
                  />
                </Grid>
                {/* 2行目: キケン度、スコア */}
                
                <Grid {...({ item: true, xs: 12, md: 6 } as any)}>
                  <TextField
                    fullWidth
                    label="キケン度"
                    type="number"
                    inputProps={{ min: 0, max: 333 }}
                    value={editableData.danger_rate ?? ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10)
                      if (!isNaN(value)) {
                        handleFieldChange('danger_rate', value)
                      }
                    }}
                    required
                    sx={muiTextFieldSx}
                  />
                </Grid>
                {editableData.score !== undefined && (
                  <Grid {...({ item: true, xs: 12, md: 6 } as any)}>
                    <TextField
                      fullWidth
                      label="スコア"
                      type="number"
                      value={editableData.score ?? ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10)
                        if (value === undefined || !isNaN(value)) {
                          handleFieldChange('score', value)
                        }
                      }}
                      sx={muiTextFieldSx}
                    />
                  </Grid>
                )}
              </Grid>
            </Box>

            {/* 武器 */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: '#e5e7eb', fontWeight: 'semibold' }}>
                武器
              </Typography>
              <Grid container spacing={2}>
                {editableData.weapons.map((weapon, index) => (
                
                <Grid {...({ item: true, xs: 12, sm: 6 } as any)} key={index}>
                    <Autocomplete
                      fullWidth
                      options={weapons}
                      getOptionLabel={(option) => option.name || ''}
                      value={weapons.find((w) => w.name === weapon) || null}
                      onChange={(_event, newValue) => {
                        handleWeaponChange(index, newValue?.name || '')
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label={`武器 ${index + 1}`} required sx={muiTextFieldSx} fullWidth />
                      )}
                      sx={muiAutocompleteSx}
                      PaperComponent={({ children, ...other }) => (
                        <Paper {...other} sx={muiPaperSx}>
                          {children}
                        </Paper>
                      )}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* WAVE情報 */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: '#e5e7eb', fontWeight: 'semibold' }}>
                WAVE情報
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {editableData.waves.map((wave, index) => {
                  const isExWave = wave.wave_number === 'EX'
                  const tideOptions = [
                    { value: 'low', label: '干潮' },
                    { value: 'normal', label: '通常' },
                    { value: 'high', label: '満潮' },
                  ]
                  return (
                    <Paper
                      key={index}
                      sx={{
                        p: 2,
                        backgroundColor: 'rgba(55, 65, 81, 0.5)',
                        border: '1px solid #4b5563',
                        borderRadius: '8px',
                      }}
                    >
                      <Typography variant="h6" sx={{ mb: 2, color: '#e5e7eb', fontWeight: 'semibold' }}>
                        WAVE {wave.wave_number}
                      </Typography>
                      <Grid container spacing={2}>
                
                <Grid {...({ item: true, xs: 12, md: 6 } as any)}>
                          <Autocomplete
                            fullWidth
                            options={tideOptions}
                            getOptionLabel={(option) => option.label}
                            value={tideOptions.find((t) => t.value === wave.tide) || null}
                            onChange={(_event, newValue) => {
                              handleWaveChange(index, 'tide', (newValue?.value || 'low') as 'low' | 'normal' | 'high')
                            }}
                            renderInput={(params) => (
                              <TextField {...params} label="潮位" required sx={muiTextFieldSx} fullWidth />
                            )}
                            sx={muiAutocompleteSx}
                            PaperComponent={({ children, ...other }) => (
                              <Paper {...other} sx={muiPaperSx}>
                                {children}
                              </Paper>
                            )}
                          />
                        </Grid>
                
                <Grid {...({ item: true, xs: 12, md: 6 } as any)}>
                          {isExWave ? (
                            <Autocomplete
                              fullWidth
                              options={OCCASULAR_OPTIONS}
                              getOptionLabel={(option) => option.label}
                              value={OCCASULAR_OPTIONS.find((o) => o.value === (wave.event || 'ヨコヅナ')) || OCCASULAR_OPTIONS[0]}
                              onChange={(_event, newValue) => {
                                handleWaveChange(index, 'event', newValue?.value || null)
                              }}
                              renderInput={(params) => (
                                <TextField {...params} label="オカシラ" required sx={muiTextFieldSx} fullWidth />
                              )}
                              sx={muiAutocompleteSx}
                              PaperComponent={({ children, ...other }) => (
                                <Paper {...other} sx={muiPaperSx}>
                                  {children}
                                </Paper>
                              )}
                            />
                          ) : (
                            <Autocomplete
                              fullWidth
                              options={EVENT_OPTIONS}
                              getOptionLabel={(option) => option.label}
                              value={EVENT_OPTIONS.find((o) => o.value === (wave.event || '')) || EVENT_OPTIONS[0]}
                              onChange={(_event, newValue) => {
                                handleWaveChange(index, 'event', newValue?.value || null)
                              }}
                              renderInput={(params) => (
                                <TextField {...params} label="イベント" sx={muiTextFieldSx} fullWidth />
                              )}
                              sx={muiAutocompleteSx}
                              PaperComponent={({ children, ...other }) => (
                                <Paper {...other} sx={muiPaperSx}>
                                  {children}
                                </Paper>
                              )}
                            />
                          )}
                        </Grid>
                        {!isExWave && (
                          <>
                
                <Grid {...({ item: true, xs: 12, md: 6 } as any)}>
                              <TextField
                                fullWidth
                                label="納品数"
                                type="number"
                                inputProps={{ min: 0 }}
                                value={wave.delivered_count ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                                  if (!isNaN(value) && value >= 0) {
                                    handleWaveChange(index, 'delivered_count', value)
                                  }
                                }}
                                required
                                sx={muiTextFieldSx}
                                helperText={
                                  wave.quota !== undefined &&
                                  wave.delivered_count !== undefined &&
                                  wave.delivered_count < wave.quota
                                    ? '⚠️ 納品数がノルマ未満です'
                                    : ''
                                }
                                FormHelperTextProps={{
                                  sx: { color: '#fbbf24' },
                                }}
                              />
                            </Grid>
                
                <Grid {...({ item: true, xs: 12, md: 6 } as any)}>
                              <TextField
                                fullWidth
                                label="ノルマ"
                                type="number"
                                inputProps={{ min: 1 }}
                                value={wave.quota ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10)
                                  if (value === undefined || (!isNaN(value) && value >= 1)) {
                                    handleWaveChange(index, 'quota', value)
                                  }
                                }}
                                sx={muiTextFieldSx}
                                helperText={
                                  wave.quota !== undefined &&
                                  wave.delivered_count !== undefined &&
                                  wave.delivered_count < wave.quota
                                    ? '⚠️ 納品数がノルマ未満です'
                                    : ''
                                }
                                FormHelperTextProps={{
                                  sx: { color: '#fbbf24' },
                                }}
                              />
                            </Grid>
                          </>
                        )}
                        {wave.cleared !== undefined && (
                
                <Grid {...({ item: true, xs: 12 } as any)}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={wave.cleared}
                                  onChange={(e) => handleWaveChange(index, 'cleared', e.target.checked)}
                                  sx={{
                                    color: '#f97316',
                                    '&.Mui-checked': {
                                      color: '#f97316',
                                    },
                                  }}
                                />
                              }
                              label="クリア"
                              sx={{ color: '#9ca3af' }}
                            />
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  )
                })}
              </Box>
            </Box>

            {/* 保存ボタン */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                pt: 2,
                borderTop: '1px solid #374151',
              }}
            >
              <Button
                type="submit"
                variant="contained"
                disabled={isSaving || (duplicateWarning !== null && duplicateScenarioCode !== null)}
                startIcon={isSaving ? <CircularProgress size={16} sx={{ color: '#ffffff' }} /> : <Save />}
                sx={{
                  backgroundColor: '#16a34a',
                  '&:hover': {
                    backgroundColor: '#15803d',
                  },
                }}
              >
                {isSaving ? '保存中...' : '保存する'}
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={handleClear}
                disabled={isSaving}
                startIcon={<Clear />}
                sx={{
                  color: '#e5e7eb',
                  borderColor: '#4b5563',
                  '&:hover': {
                    borderColor: '#6b7280',
                    backgroundColor: 'rgba(75, 85, 99, 0.1)',
                  },
                }}
              >
                クリア
              </Button>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  )
}


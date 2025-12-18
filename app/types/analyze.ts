/**
 * 画像解析APIの入力・出力型定義
 */

export interface AnalyzeRequest {
  image: File | Blob
}

export interface WaveInfo {
  wave_number: 1 | 2 | 3 | 'EX'
  tide: 'low' | 'normal' | 'high'
  event: string | null
  delivered_count: number
  quota?: number
  cleared?: boolean
}

export interface AnalyzedScenario {
  scenario_code: string
  stage_name: string
  stage_id?: number // 名寄せ後のマスタID
  danger_rate: number
  score?: number
  weapons: string[] // 武器名の配列（最大4つ）
  weapon_ids?: number[] // 名寄せ後の武器ID配列
  waves: WaveInfo[]
}

export interface AnalyzeResponse {
  success: boolean
  data?: AnalyzedScenario
  error?: string
}


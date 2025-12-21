/**
 * シナリオのハッシュタグを計算するユーティリティ
 */

export interface ScenarioTags {
  tags: string[]
  tagColors: Record<string, string>
}

interface WaveInfo {
  wave_number: number
  event: string | null
  cleared: boolean
}

interface WeaponInfo {
  weapon_id: number
  weapon_name: string
}

interface ScenarioInfo {
  danger_rate: number
  total_golden_eggs: number
  waves: WaveInfo[]
  weapons: WeaponInfo[]
}

/**
 * シナリオ情報からハッシュタグを計算
 */
export function calculateScenarioTags(scenario: ScenarioInfo): ScenarioTags {
  const tags: string[] = []
  const tagColors: Record<string, string> = {}

  // クマフェス: 全てのブキが黄色ランダム
  // オルラン: 全てのブキが緑ランダム
  // 注意: 武器の色情報は武器名から判定する必要があるため、ここでは実装しない
  // 将来的に武器マスタに色情報を追加したら実装する

  // 初心者向け: キケン度160%未満
  if (scenario.danger_rate < 160) {
    tags.push('初心者向け')
    tagColors['初心者向け'] = 'bg-green-500/20 text-green-300 border-green-500/50'
  }

  // 未クリア: 全てのシナリオがクリアされていない
  const normalWaves = scenario.waves.filter((w) => w.wave_number <= 3)
  if (normalWaves.length > 0 && normalWaves.every((w) => !w.cleared)) {
    tags.push('未クリア')
    tagColors['未クリア'] = 'bg-gray-500/20 text-gray-300 border-gray-500/50'
  }

  // 高難易度: キケン度333%かつ途中でfailしてしまい未クリア
  if (scenario.danger_rate === 333) {
    const hasFailedWave = normalWaves.some((w) => !w.cleared)
    if (hasFailedWave) {
      tags.push('高難易度')
      tagColors['高難易度'] = 'bg-red-500/20 text-red-300 border-red-500/50'
    }
  }

  // 乱獲向け: 総納品数が200を超える
  if (scenario.total_golden_eggs > 200) {
    tags.push('乱獲向け')
    tagColors['乱獲向け'] = 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
  }

  // イベント数の計算（オカシラ（EX WAVE）以外）
  const normalWaveEvents = normalWaves
    .map((w) => w.event)
    .filter((e) => e && e !== null && !e.includes('オカシラ'))

  // 昼のみ: オカシラ以外のイベントが1つもない
  if (normalWaveEvents.length === 0) {
    tags.push('昼のみ')
    tagColors['昼のみ'] = 'bg-blue-500/20 text-blue-300 border-blue-500/50'
  }

  // 夜1: オカシラ以外のイベントが1つ
  if (normalWaveEvents.length === 1) {
    tags.push('夜1')
    tagColors['夜1'] = 'bg-purple-500/20 text-purple-300 border-purple-500/50'
  }

  // 夜2: オカシラ以外のイベントが2つ
  if (normalWaveEvents.length === 2) {
    tags.push('夜2')
    tagColors['夜2'] = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
  }

  // 夜のみ: オカシラ以外のイベントが3つ
  if (normalWaveEvents.length === 3) {
    tags.push('夜のみ')
    tagColors['夜のみ'] = 'bg-pink-500/20 text-pink-300 border-pink-500/50'
  }

  // オカシラあり: EX WAVEがある（wave_number === 4）
  const hasExWave = scenario.waves.some((w) => w.wave_number === 4)
  if (hasExWave) {
    tags.push('オカシラあり')
    tagColors['オカシラあり'] = 'bg-orange-500/20 text-orange-300 border-orange-500/50'
  }

  return { tags, tagColors }
}


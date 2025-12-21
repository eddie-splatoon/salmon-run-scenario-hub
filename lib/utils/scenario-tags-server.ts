/**
 * シナリオのハッシュタグを計算するユーティリティ（サーバー側用）
 */

interface WaveInfo {
  wave_number: number
  event: string | null
  cleared: boolean
}

interface WeaponInfo {
  weapon_name: string
}

interface ScenarioInfo {
  danger_rate: number
  total_golden_eggs: number
  waves: WaveInfo[]
  weapons: WeaponInfo[]
}

/**
 * シナリオ情報からハッシュタグを計算（サーバー側用）
 */
export function calculateScenarioTags(scenario: ScenarioInfo): string[] {
  const tags: string[] = []

  // クマフェス: 全てのブキが黄色ランダム（黄ランダム）
  if (scenario.weapons.length > 0) {
    const yellowRandomWeapons = scenario.weapons.filter((w) => w.weapon_name === '黄ランダム')
    if (yellowRandomWeapons.length === scenario.weapons.length) {
      tags.push('クマフェス')
    }
  }

  // オルラン: 全てのブキが緑ランダム（緑ランダム）
  if (scenario.weapons.length > 0) {
    const greenRandomWeapons = scenario.weapons.filter((w) => w.weapon_name === '緑ランダム')
    if (greenRandomWeapons.length === scenario.weapons.length) {
      tags.push('オルラン')
    }
  }

  // 初心者向け: キケン度160%未満
  if (scenario.danger_rate < 160) {
    tags.push('初心者向け')
  }

  // 未クリア: 全てのWAVEがクリアされていない
  const normalWaves = scenario.waves.filter((w) => w.wave_number <= 3)
  if (normalWaves.length > 0 && normalWaves.every((w) => !w.cleared)) {
    tags.push('未クリア')
  }

  // 高難易度: キケン度333%かつ途中でfailしてしまい未クリア
  if (scenario.danger_rate === 333) {
    const hasFailedWave = normalWaves.some((w) => !w.cleared)
    if (hasFailedWave) {
      tags.push('高難易度')
    }
  }

  // 乱獲向け: 総納品数が200を超える
  if (scenario.total_golden_eggs > 200) {
    tags.push('乱獲向け')
  }

  // イベント数の計算（オカシラ（EX WAVE）以外）
  const normalWaveEvents = normalWaves
    .map((w) => w.event)
    .filter((e) => e && e !== null && !e.includes('オカシラ'))

  // 昼のみ: オカシラ以外のイベントが1つもない
  if (normalWaveEvents.length === 0) {
    tags.push('昼のみ')
  }

  // 夜1: オカシラ以外のイベントが1つ
  if (normalWaveEvents.length === 1) {
    tags.push('夜1')
  }

  // 夜2: オカシラ以外のイベントが2つ
  if (normalWaveEvents.length === 2) {
    tags.push('夜2')
  }

  // 夜のみ: オカシラ以外のイベントが3つ
  if (normalWaveEvents.length === 3) {
    tags.push('夜のみ')
  }

  // オカシラあり: EX WAVEがある（wave_number === 4）
  const hasExWave = scenario.waves.some((w) => w.wave_number === 4)
  if (hasExWave) {
    tags.push('オカシラあり')
  }

  return tags
}

/**
 * 指定されたタグがシナリオに含まれるかチェック
 */
export function hasTag(scenario: ScenarioInfo, tag: string): boolean {
  const tags = calculateScenarioTags(scenario)
  return tags.includes(tag)
}


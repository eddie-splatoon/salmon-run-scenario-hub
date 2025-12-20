import { createClient } from '@/lib/supabase/server'

/**
 * Levenshtein距離を計算する
 * @param str1 文字列1
 * @param str2 文字列2
 * @returns 編集距離
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length
  const matrix: number[][] = []

  // 初期化
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  // 動的プログラミングで距離を計算
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // 削除
          matrix[i][j - 1] + 1, // 挿入
          matrix[i - 1][j - 1] + 1 // 置換
        )
      }
    }
  }

  return matrix[len1][len2]
}

/**
 * 文字列の類似度を計算する（0-1の範囲、1が完全一致）
 * @param str1 文字列1
 * @param str2 文字列2
 * @returns 類似度（0-1）
 */
function similarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length)
  if (maxLen === 0) return 1
  const distance = levenshteinDistance(str1, str2)
  return 1 - distance / maxLen
}

/**
 * ステージ名をIDに変換する（名寄せ）
 * @param stageName AIが解析したステージ名
 * @returns マスタID、見つからない場合はnull
 */
export async function lookupStageId(stageName: string): Promise<number | null> {
  const supabase = await createClient()
  const normalizedInput = stageName.trim()

  // 1. マスタテーブルで完全一致で検索
  const { data: exactMatch } = await supabase
    .from('m_stages')
    .select('id')
    .eq('name', normalizedInput)
    .maybeSingle()

  if (exactMatch && typeof exactMatch === 'object' && 'id' in exactMatch) {
    return (exactMatch as { id: number }).id
  }

  // 2. エイリアステーブルで検索
  const { data: aliasMatch } = await supabase
    .from('stage_aliases')
    .select('stage_id')
    .eq('alias', normalizedInput)
    .maybeSingle()

  if (aliasMatch && typeof aliasMatch === 'object' && 'stage_id' in aliasMatch) {
    return (aliasMatch as { stage_id: number }).stage_id
  }

  // 3. 部分一致とLevenshtein距離による柔軟なマッチング
  const { data: allStages } = await supabase
    .from('m_stages')
    .select('id, name')

  if (!allStages || !Array.isArray(allStages)) {
    return null
  }

  // 部分一致を探す（優先度: 高）
  let bestPartialMatch: { id: number; name: string; score: number } | null = null

  for (const stage of allStages) {
    const typedStage = stage as { id: number; name: string } | null
    if (
      typedStage &&
      typeof typedStage.name === 'string' &&
      typeof typedStage.id === 'number'
    ) {
      const stageName = typedStage.name
      // 部分一致チェック
      if (stageName.includes(normalizedInput) || normalizedInput.includes(stageName)) {
        const matchLength = Math.min(stageName.length, normalizedInput.length)
        const score = matchLength / Math.max(stageName.length, normalizedInput.length)
        if (!bestPartialMatch || score > bestPartialMatch.score) {
          bestPartialMatch = { id: typedStage.id, name: stageName, score }
        }
      }
    }
  }

  // 部分一致が見つかった場合はそれを返す
  if (bestPartialMatch && bestPartialMatch.score > 0.5) {
    return bestPartialMatch.id
  }

  // 部分一致が見つからない場合、Levenshtein距離で類似度を計算
  let bestSimilarityMatch: { id: number; name: string; similarity: number } | null = null
  const SIMILARITY_THRESHOLD = 0.7 // 70%以上の類似度が必要

  for (const stage of allStages) {
    const typedStage = stage as { id: number; name: string } | null
    if (
      typedStage &&
      typeof typedStage.name === 'string' &&
      typeof typedStage.id === 'number'
    ) {
      const sim = similarity(normalizedInput.toLowerCase(), typedStage.name.toLowerCase())
      if (sim >= SIMILARITY_THRESHOLD) {
        if (!bestSimilarityMatch || sim > bestSimilarityMatch.similarity) {
          bestSimilarityMatch = { id: typedStage.id, name: typedStage.name, similarity: sim }
        }
      }
    }
  }

  return bestSimilarityMatch ? bestSimilarityMatch.id : null
}

/**
 * 武器名をIDに変換する（名寄せ）
 * @param weaponName AIが解析した武器名
 * @returns マスタID、見つからない場合はnull
 */
export async function lookupWeaponId(weaponName: string): Promise<number | null> {
  const supabase = await createClient()
  const normalizedInput = weaponName.trim()

  // 1. マスタテーブルで完全一致で検索
  const { data: exactMatch } = await supabase
    .from('m_weapons')
    .select('id')
    .eq('name', normalizedInput)
    .maybeSingle()

  if (exactMatch && typeof exactMatch === 'object' && 'id' in exactMatch) {
    return (exactMatch as { id: number }).id
  }

  // 2. エイリアステーブルで検索
  const { data: aliasMatch } = await supabase
    .from('weapon_aliases')
    .select('weapon_id')
    .eq('alias', normalizedInput)
    .maybeSingle()

  if (aliasMatch && typeof aliasMatch === 'object' && 'weapon_id' in aliasMatch) {
    return (aliasMatch as { weapon_id: number }).weapon_id
  }

  // 3. 部分一致とLevenshtein距離による柔軟なマッチング
  const { data: allWeapons } = await supabase
    .from('m_weapons')
    .select('id, name')

  if (!allWeapons || !Array.isArray(allWeapons)) {
    return null
  }

  // 部分一致を探す（優先度: 高）
  let bestPartialMatch: { id: number; name: string; score: number } | null = null

  for (const weapon of allWeapons) {
    const typedWeapon = weapon as { id: number; name: string } | null
    if (
      typedWeapon &&
      typeof typedWeapon.name === 'string' &&
      typeof typedWeapon.id === 'number'
    ) {
      const weaponName = typedWeapon.name
      // 部分一致チェック
      if (weaponName.includes(normalizedInput) || normalizedInput.includes(weaponName)) {
        const matchLength = Math.min(weaponName.length, normalizedInput.length)
        const score = matchLength / Math.max(weaponName.length, normalizedInput.length)
        if (!bestPartialMatch || score > bestPartialMatch.score) {
          bestPartialMatch = { id: typedWeapon.id, name: weaponName, score }
        }
      }
    }
  }

  // 部分一致が見つかった場合はそれを返す
  if (bestPartialMatch && bestPartialMatch.score > 0.5) {
    return bestPartialMatch.id
  }

  // 部分一致が見つからない場合、Levenshtein距離で類似度を計算
  let bestSimilarityMatch: { id: number; name: string; similarity: number } | null = null
  const SIMILARITY_THRESHOLD = 0.7 // 70%以上の類似度が必要

  for (const weapon of allWeapons) {
    const typedWeapon = weapon as { id: number; name: string } | null
    if (
      typedWeapon &&
      typeof typedWeapon.name === 'string' &&
      typeof typedWeapon.id === 'number'
    ) {
      const sim = similarity(normalizedInput.toLowerCase(), typedWeapon.name.toLowerCase())
      if (sim >= SIMILARITY_THRESHOLD) {
        if (!bestSimilarityMatch || sim > bestSimilarityMatch.similarity) {
          bestSimilarityMatch = { id: typedWeapon.id, name: typedWeapon.name, similarity: sim }
        }
      }
    }
  }

  return bestSimilarityMatch ? bestSimilarityMatch.id : null
}

/**
 * 武器名の配列をIDの配列に変換する（名寄せ）
 * @param weaponNames AIが解析した武器名の配列（最大4つ）
 * @returns マスタIDの配列、見つからない場合はnullを含む
 */
export async function lookupWeaponIds(
  weaponNames: string[]
): Promise<(number | null)[]> {
  const results = await Promise.all(
    weaponNames.map((name) => lookupWeaponId(name))
  )
  return results
}


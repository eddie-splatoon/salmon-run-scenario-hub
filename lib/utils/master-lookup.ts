import { createClient } from '@/lib/supabase/server'

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

  // 3. 部分一致で検索（名寄せのため）
  const { data: partialMatches } = await supabase
    .from('m_stages')
    .select('id, name')

  if (!partialMatches || !Array.isArray(partialMatches)) {
    return null
  }

  // 最も長い部分一致を探す
  let bestMatch: { id: number; name: string } | null = null
  let bestMatchLength = 0

  for (const stage of partialMatches) {
    const typedStage = stage as { id: number; name: string } | null
    if (
      typedStage &&
      typeof typedStage.name === 'string' &&
      typeof typedStage.id === 'number' &&
      (typedStage.name.includes(normalizedInput) || normalizedInput.includes(typedStage.name))
    ) {
      // 一致部分の長さを計算（より長い一致を優先）
      const matchLength = Math.min(typedStage.name.length, normalizedInput.length)
      if (matchLength > bestMatchLength) {
        bestMatch = typedStage
        bestMatchLength = matchLength
      }
    }
  }

  return bestMatch ? bestMatch.id : null
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

  // 3. 部分一致で検索（名寄せのため）
  const { data: partialMatches } = await supabase
    .from('m_weapons')
    .select('id, name')

  if (!partialMatches || !Array.isArray(partialMatches)) {
    return null
  }

  // 最も長い部分一致を探す
  let bestMatch: { id: number; name: string } | null = null
  let bestMatchLength = 0

  for (const weapon of partialMatches) {
    const typedWeapon = weapon as { id: number; name: string } | null
    if (
      typedWeapon &&
      typeof typedWeapon.name === 'string' &&
      typeof typedWeapon.id === 'number' &&
      (typedWeapon.name.includes(normalizedInput) || normalizedInput.includes(typedWeapon.name))
    ) {
      // 一致部分の長さを計算（より長い一致を優先）
      const matchLength = Math.min(typedWeapon.name.length, normalizedInput.length)
      if (matchLength > bestMatchLength) {
        bestMatch = typedWeapon
        bestMatchLength = matchLength
      }
    }
  }

  return bestMatch ? bestMatch.id : null
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


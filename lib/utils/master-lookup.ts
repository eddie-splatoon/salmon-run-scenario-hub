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
    return exactMatch.id as number
  }

  // 2. エイリアステーブルで検索
  const { data: aliasMatch } = await supabase
    .from('stage_aliases')
    .select('stage_id')
    .eq('alias', normalizedInput)
    .maybeSingle()

  if (aliasMatch && 'stage_id' in aliasMatch) {
    return aliasMatch.stage_id as number
  }

  // 3. 部分一致で検索（名寄せのため）
  const { data: partialMatches } = await supabase
    .from('m_stages')
    .select('id, name')

  if (!partialMatches) {
    return null
  }

  // 最も長い部分一致を探す
  for (const stage of partialMatches) {
    if (
      'name' in stage &&
      'id' in stage &&
      typeof stage.name === 'string' &&
      typeof stage.id === 'number' &&
      (stage.name.includes(normalizedInput) || normalizedInput.includes(stage.name))
    ) {
      return stage.id
    }
  }

  return null
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
    return exactMatch.id as number
  }

  // 2. エイリアステーブルで検索
  const { data: aliasMatch } = await supabase
    .from('weapon_aliases')
    .select('weapon_id')
    .eq('alias', normalizedInput)
    .maybeSingle()

  if (aliasMatch && 'weapon_id' in aliasMatch) {
    return aliasMatch.weapon_id as number
  }

  // 3. 部分一致で検索（名寄せのため）
  const { data: partialMatches } = await supabase
    .from('m_weapons')
    .select('id, name')

  if (!partialMatches) {
    return null
  }

  // 最も長い部分一致を探す
  for (const weapon of partialMatches) {
    if (
      'name' in weapon &&
      'id' in weapon &&
      typeof weapon.name === 'string' &&
      typeof weapon.id === 'number' &&
      (weapon.name.includes(normalizedInput) || normalizedInput.includes(weapon.name))
    ) {
      return weapon.id
    }
  }

  return null
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


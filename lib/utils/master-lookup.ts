import { createClient } from '@/lib/supabase/server'

/**
 * ステージ名をIDに変換する（名寄せ）
 * @param stageName AIが解析したステージ名
 * @returns マスタID、見つからない場合はnull
 */
export async function lookupStageId(stageName: string): Promise<number | null> {
  const supabase = await createClient()

  // 完全一致で検索
  const { data: exactMatch } = await supabase
    .from('m_stages')
    .select('id')
    .eq('name', stageName)
    .single()

  if (exactMatch) {
    return exactMatch.id
  }

  // 部分一致で検索（名寄せのため）
  const { data: partialMatches } = await supabase
    .from('m_stages')
    .select('id, name')

  if (!partialMatches) {
    return null
  }

  // 最も長い部分一致を探す
  const normalizedInput = stageName.trim()
  for (const stage of partialMatches) {
    if (stage.name.includes(normalizedInput) || normalizedInput.includes(stage.name)) {
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

  // 完全一致で検索
  const { data: exactMatch } = await supabase
    .from('m_weapons')
    .select('id')
    .eq('name', weaponName)
    .single()

  if (exactMatch) {
    return exactMatch.id
  }

  // 部分一致で検索（名寄せのため）
  const { data: partialMatches } = await supabase
    .from('m_weapons')
    .select('id, name')

  if (!partialMatches) {
    return null
  }

  // 最も長い部分一致を探す
  const normalizedInput = weaponName.trim()
  for (const weapon of partialMatches) {
    if (weapon.name.includes(normalizedInput) || normalizedInput.includes(weapon.name)) {
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


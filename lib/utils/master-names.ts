import { createClient } from '@/lib/supabase/server'

/**
 * Gemini の responseSchema で enum に注入するため、
 * m_stages / m_weapons の name 一覧を取得する。
 *
 * 解析が失敗した場合は空配列を返す（enum が空の場合は呼び出し側で未指定にフォールバック）。
 */
export async function fetchMasterNames(): Promise<{
  stages: string[]
  weapons: string[]
}> {
  const supabase = await createClient()

  const [stagesResult, weaponsResult] = await Promise.all([
    supabase.from('m_stages').select('name').order('id'),
    supabase.from('m_weapons').select('name').order('id'),
  ])

  const stages = Array.isArray(stagesResult.data)
    ? stagesResult.data
        .map((row) => (row as { name: unknown }).name)
        .filter((n): n is string => typeof n === 'string' && n.length > 0)
    : []

  const weapons = Array.isArray(weaponsResult.data)
    ? weaponsResult.data
        .map((row) => (row as { name: unknown }).name)
        .filter((n): n is string => typeof n === 'string' && n.length > 0)
    : []

  return { stages, weapons }
}

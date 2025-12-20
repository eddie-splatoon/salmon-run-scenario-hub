import { createClient } from '@/lib/supabase/server'
import ScenariosListClient from './ScenariosListClient'

interface Stage {
  id: number
  name: string
}

interface WeaponOption {
  id: number
  name: string
  icon_url: string | null
}

async function getStages(): Promise<Stage[]> {
  try {
    const supabase = await createClient()
    const { data: stages, error } = await supabase
      .from('m_stages')
      .select('id, name')
      .order('name')

    if (error || !stages) {
      console.error('ステージ取得エラー:', error)
      return []
    }

    return stages
  } catch (error) {
    console.error('ステージ取得エラー:', error)
    return []
  }
}

async function getWeapons(): Promise<WeaponOption[]> {
  try {
    const supabase = await createClient()
    const { data: weapons, error } = await supabase
      .from('m_weapons')
      .select('id, name, icon_url')
      .order('name')

    if (error || !weapons) {
      console.error('武器取得エラー:', error)
      return []
    }

    return weapons
  } catch (error) {
    console.error('武器取得エラー:', error)
    return []
  }
}

export default async function ScenariosPage() {
  const stages = await getStages()
  const weapons = await getWeapons()

  return <ScenariosListClient stages={stages} weapons={weapons} />
}


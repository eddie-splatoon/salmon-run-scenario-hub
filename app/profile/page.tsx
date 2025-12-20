import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileClient from './ProfileClient'

interface WeaponDetail {
  weapon_id: number
  weapon_name: string
  icon_url: string | null
  display_order: number
}

interface UserScenario {
  code: string
  stage_id: number
  stage_name: string
  danger_rate: number
  total_golden_eggs: number
  created_at: string
  weapons: WeaponDetail[]
}

async function getUserScenarios(userId: string): Promise<UserScenario[]> {
  try {
    const supabase = await createClient()

    // ユーザーの投稿を取得
    const { data: scenarios, error: scenariosError } = await supabase
      .from('scenarios')
      .select(`
        code,
        stage_id,
        danger_rate,
        total_golden_eggs,
        created_at,
        m_stages!inner(name)
      `)
      .eq('author_id', userId)
      .order('created_at', { ascending: false })

    if (scenariosError) {
      console.error('ユーザー投稿取得エラー:', scenariosError)
      return []
    }

    if (!scenarios || scenarios.length === 0) {
      return []
    }

    // 型アサーション
    type ScenarioWithStage = {
      code: string
      stage_id: number
      danger_rate: number
      total_golden_eggs: number
      created_at: string
      m_stages: { name: string }
    }

    const typedScenarios = scenarios as ScenarioWithStage[]

    // シナリオコードのリストを取得
    const scenarioCodes = typedScenarios.map((s) => s.code)

    // 武器情報を取得
    const { data: scenarioWeapons, error: weaponsError } = await supabase
      .from('scenario_weapons')
      .select(`
        scenario_code,
        weapon_id,
        display_order,
        m_weapons!inner(id, name, icon_url)
      `)
      .in('scenario_code', scenarioCodes)
      .order('scenario_code')
      .order('display_order')

    if (weaponsError) {
      console.error('武器情報取得エラー:', weaponsError)
      // 武器情報が取得できなくてもシナリオは返す
    }

    // 型アサーション: 武器情報
    type ScenarioWeaponWithWeapon = {
      scenario_code: string
      weapon_id: number
      display_order: number
      m_weapons: { id: number; name: string; icon_url: string | null }
    }

    const typedScenarioWeapons = (scenarioWeapons || []) as ScenarioWeaponWithWeapon[]

    // 結果を整形
    const result: UserScenario[] = typedScenarios.map((scenario) => {
      const weapons = typedScenarioWeapons
        .filter((sw) => sw.scenario_code === scenario.code)
        .map((sw) => ({
          weapon_id: sw.weapon_id,
          weapon_name: sw.m_weapons.name,
          icon_url: sw.m_weapons.icon_url,
          display_order: sw.display_order,
        }))
        .sort((a, b) => a.display_order - b.display_order)

      return {
        code: scenario.code,
        stage_id: scenario.stage_id,
        stage_name: scenario.m_stages.name,
        danger_rate: scenario.danger_rate,
        total_golden_eggs: scenario.total_golden_eggs,
        created_at: scenario.created_at,
        weapons,
      }
    })

    return result
  } catch (error) {
    console.error('ユーザー投稿取得エラー:', error)
    return []
  }
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // 非ログイン時はログインページにリダイレクト
  if (authError || !user) {
    redirect('/auth/login')
  }

  const scenarios = await getUserScenarios(user.id)

  return (
    <ProfileClient
      user={{
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'ユーザー',
      }}
      initialScenarios={scenarios}
    />
  )
}


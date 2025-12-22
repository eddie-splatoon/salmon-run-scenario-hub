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

interface StageStats {
  stage_id: number
  stage_name: string
  count: number
}

interface LikedScenario {
  code: string
  stage_id: number
  stage_name: string
  danger_rate: number
  total_golden_eggs: number
  created_at: string
  weapons: WeaponDetail[]
}

interface StatisticsData {
  average_golden_eggs: number
  max_golden_eggs: number
  total_scenarios: number
  stage_stats: StageStats[]
  liked_scenarios: LikedScenario[]
}

async function getUserScenarios(userId: string): Promise<UserScenario[]> {
  try {
    const supabase = await createClient()

    // ユーザーの投稿を取得
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: scenarios, error: scenariosError } = await (supabase as any)
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

async function getStatisticsData(userId: string): Promise<StatisticsData | null> {
  try {
    const supabase = await createClient()

    // ユーザーの投稿データを取得（集計用）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userScenariosRaw, error: scenariosError } = await (supabase as any)
      .from('scenarios')
      .select('total_golden_eggs, stage_id')
      .eq('author_id', userId)

    if (scenariosError) {
      console.error('統計データ取得エラー:', scenariosError)
      return null
    }

    // 型を明示的に指定
    type UserScenario = { total_golden_eggs?: number | null; stage_id: number }
    const userScenarios = (userScenariosRaw || []) as UserScenario[]

    // 集計計算
    const totalScenarios = userScenarios.length
    let averageGoldenEggs = 0
    let maxGoldenEggs = 0

    if (totalScenarios > 0) {
      const sum = userScenarios.reduce((acc: number, s) => acc + (s.total_golden_eggs || 0), 0)
      averageGoldenEggs = Math.round((sum / totalScenarios) * 10) / 10 // 小数点第1位まで
      maxGoldenEggs = Math.max(...userScenarios.map((s) => s.total_golden_eggs || 0))
    }

    // ステージ別投稿数を取得
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: stageStatsRaw, error: stageStatsError } = await (supabase as any)
      .from('scenarios')
      .select('stage_id, m_stages!inner(name)')
      .eq('author_id', userId)

    if (stageStatsError) {
      console.error('ステージ統計取得エラー:', stageStatsError)
    }

    // ステージ別集計
    const stageCountMap = new Map<number, { name: string; count: number }>()
    if (stageStatsRaw) {
      type ScenarioWithStage = {
        stage_id: number
        m_stages: { name: string }
      }
      const typedStageStats = stageStatsRaw as ScenarioWithStage[]

      typedStageStats.forEach((s) => {
        const current = stageCountMap.get(s.stage_id) || { name: s.m_stages.name, count: 0 }
        stageCountMap.set(s.stage_id, { name: current.name, count: current.count + 1 })
      })
    }

    const stageStats: StageStats[] = Array.from(stageCountMap.entries()).map(([stage_id, data]) => ({
      stage_id,
      stage_name: data.name,
      count: data.count,
    }))

    // お気に入り（いいねした）シナリオを取得
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: likes, error: likesError } = await (supabase as any)
      .from('likes')
      .select('scenario_code')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (likesError) {
      console.error('いいね取得エラー:', likesError)
    }

    const likedScenarioCodes = ((likes || []) as Array<{ scenario_code: string }>).map((l) => l.scenario_code)

    let likedScenarios: LikedScenario[] = []
    if (likedScenarioCodes.length > 0) {
      // いいねしたシナリオの詳細を取得
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: likedScenariosData, error: likedScenariosError } = await (supabase as any)
        .from('scenarios')
        .select(`
          code,
          stage_id,
          danger_rate,
          total_golden_eggs,
          created_at,
          m_stages!inner(name)
        `)
        .in('code', likedScenarioCodes)
        .order('created_at', { ascending: false })

      if (likedScenariosError) {
        console.error('いいねシナリオ詳細取得エラー:', likedScenariosError)
      } else if (likedScenariosData) {
        type LikedScenarioWithStage = {
          code: string
          stage_id: number
          danger_rate: number
          total_golden_eggs: number
          created_at: string
          m_stages: { name: string }
        }
        const typedLikedScenarios = likedScenariosData as LikedScenarioWithStage[]

        // 武器情報を取得
        const { data: scenarioWeapons, error: weaponsError } = await supabase
          .from('scenario_weapons')
          .select(`
            scenario_code,
            weapon_id,
            display_order,
            m_weapons!inner(id, name, icon_url)
          `)
          .in('scenario_code', likedScenarioCodes)
          .order('scenario_code')
          .order('display_order')

        if (weaponsError) {
          console.error('武器情報取得エラー:', weaponsError)
        }

        type ScenarioWeaponWithWeapon = {
          scenario_code: string
          weapon_id: number
          display_order: number
          m_weapons: { id: number; name: string; icon_url: string | null }
        }
        const typedScenarioWeapons = (scenarioWeapons || []) as ScenarioWeaponWithWeapon[]

        // 結果を整形
        likedScenarios = typedLikedScenarios.map((scenario) => {
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
      }
    }

    return {
      average_golden_eggs: averageGoldenEggs,
      max_golden_eggs: maxGoldenEggs,
      total_scenarios: totalScenarios,
      stage_stats: stageStats,
      liked_scenarios: likedScenarios,
    }
  } catch (error) {
    console.error('統計データ取得エラー:', error)
    return null
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
  const statisticsData = await getStatisticsData(user.id)

  // プロフィール情報を取得（profilesテーブルから）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileRaw } = await (supabase as any)
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('user_id', user.id)
    .maybeSingle()

  // 型を明示的に指定
  type Profile = { display_name: string | null; avatar_url: string | null } | null
  const profile = profileRaw as Profile

  return (
    <ProfileClient
      user={{
        id: user.id,
        email: user.email || '',
        name: profile?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'ユーザー',
        avatar_url: profile?.avatar_url || user.user_metadata?.picture || null,
      }}
      initialScenarios={scenarios}
      initialStatisticsData={statisticsData}
    />
  )
}


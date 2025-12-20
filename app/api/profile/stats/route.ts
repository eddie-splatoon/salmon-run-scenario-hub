import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
  weapons: Array<{
    weapon_id: number
    weapon_name: string
    icon_url: string | null
    display_order: number
  }>
}

interface StatsResponse {
  success: boolean
  data?: {
    average_golden_eggs: number
    max_golden_eggs: number
    total_scenarios: number
    stage_stats: StageStats[]
    liked_scenarios: LikedScenario[]
  }
  error?: string
}

/**
 * ユーザーの統計データを取得するAPIエンドポイント
 */
export async function GET(): Promise<NextResponse<StatsResponse>> {
  try {
    const supabase = await createClient()

    // 認証チェック
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      )
    }

    // ユーザーの投稿データを取得（集計用）
    const { data: userScenarios, error: scenariosError } = await supabase
      .from('scenarios')
      .select('total_golden_eggs, stage_id')
      .eq('author_id', user.id)

    if (scenariosError) {
      console.error('[GET /api/profile/stats] 投稿データ取得エラー:', scenariosError)
      return NextResponse.json(
        {
          success: false,
          error: `統計データの取得に失敗しました: ${scenariosError.message}`,
        },
        { status: 500 }
      )
    }

    // 集計計算
    const totalScenarios = userScenarios?.length || 0
    let averageGoldenEggs = 0
    let maxGoldenEggs = 0

    if (totalScenarios > 0 && userScenarios) {
      const sum = userScenarios.reduce((acc, s) => acc + (s.total_golden_eggs || 0), 0)
      averageGoldenEggs = Math.round((sum / totalScenarios) * 10) / 10 // 小数点第1位まで
      maxGoldenEggs = Math.max(...userScenarios.map((s) => s.total_golden_eggs || 0))
    }

    // ステージ別投稿数を取得
    const { data: stageStatsRaw, error: stageStatsError } = await supabase
      .from('scenarios')
      .select('stage_id, m_stages!inner(name)')
      .eq('author_id', user.id)

    if (stageStatsError) {
      console.error('[GET /api/profile/stats] ステージ統計取得エラー:', stageStatsError)
      // エラーでも続行（空配列を返す）
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
    const { data: likes, error: likesError } = await supabase
      .from('likes')
      .select('scenario_code')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (likesError) {
      console.error('[GET /api/profile/stats] いいね取得エラー:', likesError)
      // エラーでも続行（空配列を返す）
    }

    const likedScenarioCodes = (likes || []).map((l) => l.scenario_code)

    let likedScenarios: LikedScenario[] = []
    if (likedScenarioCodes.length > 0) {
      // いいねしたシナリオの詳細を取得
      const { data: likedScenariosData, error: likedScenariosError } = await supabase
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
        console.error('[GET /api/profile/stats] いいねシナリオ詳細取得エラー:', likedScenariosError)
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
          console.error('[GET /api/profile/stats] 武器情報取得エラー:', weaponsError)
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

    return NextResponse.json({
      success: true,
      data: {
        average_golden_eggs: averageGoldenEggs,
        max_golden_eggs: maxGoldenEggs,
        total_scenarios: totalScenarios,
        stage_stats: stageStats,
        liked_scenarios: likedScenarios,
      },
    })
  } catch (error) {
    console.error('[GET /api/profile/stats] 予期しないエラー:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? `予期しないエラーが発生しました: ${error.message}`
            : '統計データの取得中にエラーが発生しました',
      },
      { status: 500 }
    )
  }
}


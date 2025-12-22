import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface WaveDetail {
  wave_number: number
  tide: 'low' | 'normal' | 'high'
  event: string | null
  delivered_count: number
  quota: number
  cleared: boolean
}

interface WeaponDetail {
  weapon_id: number
  weapon_name: string
  icon_url: string | null
  display_order: number
}

interface ScenarioDetail {
  code: string
  stage_id: number
  stage_name: string
  danger_rate: number
  total_golden_eggs: number
  total_power_eggs: number
  created_at: string
  author_id: string
  waves: WaveDetail[]
  weapons: WeaponDetail[]
  like_count: number
  comment_count: number
  is_liked: boolean
}

interface GetScenarioDetailResponse {
  success: boolean
  data?: ScenarioDetail
  error?: string
}

/**
 * シナリオ詳細を取得するAPIエンドポイント
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<GetScenarioDetailResponse>> {
  try {
    const { id: scenarioCode } = await params
    const supabase = await createClient()

    // 認証情報を取得（いいね状態を確認するため）
    const {
      data: { user },
    } = await (supabase as any).auth.getUser()

    // シナリオ基本情報を取得
    const { data: scenario, error: scenarioError } = await (supabase as any)
      .from('scenarios')
      .select(`
        code,
        author_id,
        stage_id,
        danger_rate,
        total_golden_eggs,
        total_power_eggs,
        created_at,
        m_stages!inner(name)
      `)
      .eq('code', scenarioCode)
      .single()

    if (scenarioError || !scenario) {
      console.error('[GET /api/scenarios/[id]] シナリオ取得エラー:', scenarioError)
      return NextResponse.json(
        {
          success: false,
          error: 'シナリオが見つかりません',
        },
        { status: 404 }
      )
    }

    // 型アサーション
    type ScenarioWithStage = {
      code: string
      author_id: string
      stage_id: number
      danger_rate: number
      total_golden_eggs: number
      total_power_eggs: number
      created_at: string
      m_stages: { name: string }
    }

    const typedScenario = scenario as ScenarioWithStage

    // WAVE情報を取得
    const { data: waves, error: wavesError } = await (supabase as any)
      .from('scenario_waves')
      .select('*')
      .eq('scenario_code', scenarioCode)
      .order('wave_number')

    if (wavesError) {
      console.error('[GET /api/scenarios/[id]] WAVE情報取得エラー:', wavesError)
      return NextResponse.json(
        {
          success: false,
          error: `WAVE情報の取得に失敗しました: ${wavesError.message}`,
        },
        { status: 500 }
      )
    }

    // 武器情報を取得
    const { data: scenarioWeapons, error: weaponsError } = await (supabase as any)
      .from('scenario_weapons')
      .select(`
        weapon_id,
        display_order,
        m_weapons!inner(id, name, icon_url)
      `)
      .eq('scenario_code', scenarioCode)
      .order('display_order')

    if (weaponsError) {
      console.error('[GET /api/scenarios/[id]] 武器情報取得エラー:', weaponsError)
      return NextResponse.json(
        {
          success: false,
          error: `武器情報の取得に失敗しました: ${weaponsError.message}`,
        },
        { status: 500 }
      )
    }

    // 型アサーション: 武器情報
    type ScenarioWeaponWithWeapon = {
      weapon_id: number
      display_order: number
      m_weapons: { id: number; name: string; icon_url: string | null }
    }

    const typedScenarioWeapons = (scenarioWeapons || []) as ScenarioWeaponWithWeapon[]

    // いいね数を取得
    const { count: likeCount, error: likeCountError } = await (supabase as any)
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('scenario_code', scenarioCode)

    if (likeCountError) {
      console.error('[GET /api/scenarios/[id]] いいね数取得エラー:', likeCountError)
      // いいね数取得エラーは致命的ではないので、0として扱う
    }

    // コメント数を取得
    const { count: commentCount, error: commentCountError } = await (supabase as any)
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('scenario_code', scenarioCode)

    if (commentCountError) {
      console.error('[GET /api/scenarios/[id]] コメント数取得エラー:', commentCountError)
      // コメント数取得エラーは致命的ではないので、0として扱う
    }

    // 現在のユーザーがいいねしているか確認
    let isLiked = false
    if (user) {
      const { data: like, error: likeError } = await (supabase as any)
        .from('likes')
        .select('id')
        .eq('scenario_code', scenarioCode)
        .eq('user_id', user.id)
        .single()

      if (!likeError && like) {
        isLiked = true
      }
    }

    // 結果を整形
    const result: ScenarioDetail = {
      code: typedScenario.code,
      stage_id: typedScenario.stage_id,
      stage_name: typedScenario.m_stages.name,
      danger_rate: typedScenario.danger_rate,
      total_golden_eggs: typedScenario.total_golden_eggs,
      total_power_eggs: typedScenario.total_power_eggs,
      created_at: typedScenario.created_at,
      author_id: typedScenario.author_id,
      waves: ((waves || []) as Array<{ wave_number: number; tide: 'low' | 'normal' | 'high'; event: string | null; delivered_count: number; quota: number; cleared: boolean }>).map((wave) => ({
        wave_number: wave.wave_number,
        tide: wave.tide as 'low' | 'normal' | 'high',
        event: wave.event,
        delivered_count: wave.delivered_count,
        quota: wave.quota,
        cleared: wave.cleared,
      })),
      weapons: typedScenarioWeapons.map((sw) => ({
        weapon_id: sw.weapon_id,
        weapon_name: sw.m_weapons.name,
        icon_url: sw.m_weapons.icon_url,
        display_order: sw.display_order,
      })),
      like_count: likeCount || 0,
      comment_count: commentCount || 0,
      is_liked: isLiked,
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('[GET /api/scenarios/[id]] 予期しないエラー:', {
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
            : 'シナリオ詳細の取得中にエラーが発生しました',
      },
      { status: 500 }
    )
  }
}

interface DeleteScenarioResponse {
  success: boolean
  error?: string
}

/**
 * シナリオを削除するAPIエンドポイント
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<DeleteScenarioResponse>> {
  try {
    const { id: scenarioCode } = await params
    const supabase = await createClient()

    // 認証チェック
    const {
      data: { user },
      error: authError,
    } = await (supabase as any).auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      )
    }

    // シナリオの存在確認と所有者確認
    const { data: scenario, error: scenarioError } = await (supabase as any)
      .from('scenarios')
      .select('code, author_id')
      .eq('code', scenarioCode)
      .single()

    if (scenarioError || !scenario) {
      return NextResponse.json(
        {
          success: false,
          error: 'シナリオが見つかりません',
        },
        { status: 404 }
      )
    }

    // 型アサーション
    type ScenarioWithAuthorId = {
      code: string
      author_id: string
    }

    const typedScenario = scenario as ScenarioWithAuthorId

    // 所有者確認（RLSでも保護されているが、明示的にチェック）
    if (typedScenario.author_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'このシナリオを削除する権限がありません',
        },
        { status: 403 }
      )
    }

    // シナリオを削除（CASCADEにより関連データも自動削除される）
    const { error: deleteError } = await (supabase as any)
      .from('scenarios')
      .delete()
      .eq('code', scenarioCode)

    if (deleteError) {
      console.error('[DELETE /api/scenarios/[id]] 削除エラー:', deleteError)
      return NextResponse.json(
        {
          success: false,
          error: `シナリオの削除に失敗しました: ${deleteError.message}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('[DELETE /api/scenarios/[id]] 予期しないエラー:', {
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
            : 'シナリオの削除中にエラーが発生しました',
      },
      { status: 500 }
    )
  }
}


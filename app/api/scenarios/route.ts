import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { lookupStageId, lookupWeaponIds } from '@/lib/utils/master-lookup'
import type { AnalyzedScenario } from '@/app/types/analyze'

interface SaveScenarioRequest {
  scenario_code: string
  stage_name: string
  stage_id?: number
  danger_rate: number
  score?: number
  weapons: string[]
  weapon_ids?: number[]
  waves: Array<{
    wave_number: 1 | 2 | 3 | 'EX'
    tide: 'low' | 'normal' | 'high'
    event: string | null
    delivered_count: number
    quota?: number
    cleared?: boolean
  }>
}

interface SaveScenarioResponse {
  success: boolean
  data?: {
    scenario_code: string
  }
  error?: string
}

/**
 * シナリオをデータベースに保存するAPIエンドポイント
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<SaveScenarioResponse>> {
  try {
    // 認証チェック
    const supabase = await createClient()
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

    // リクエストボディを取得
    const body: SaveScenarioRequest = await request.json()

    // バリデーション
    if (!body.scenario_code || !body.stage_name || !body.weapons || !body.waves) {
      return NextResponse.json(
        { success: false, error: '必須フィールドが不足しています' },
        { status: 400 }
      )
    }

    // 重複チェック
    const { data: existingScenarios, error: checkError } = await supabase
      .from('scenarios')
      .select('code')
      .eq('code', body.scenario_code)
      .limit(1)

    if (checkError) {
      console.error('Error checking duplicate scenario:', checkError)
      return NextResponse.json(
        { success: false, error: '重複チェック中にエラーが発生しました' },
        { status: 500 }
      )
    }

    if (existingScenarios && existingScenarios.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `シナリオコード "${body.scenario_code}" は既に存在します`,
        },
        { status: 409 }
      )
    }

    // ステージIDの取得（名寄せ）
    let stageId = body.stage_id
    if (!stageId) {
      stageId = await lookupStageId(body.stage_name)
      if (!stageId) {
        return NextResponse.json(
          { success: false, error: `ステージ "${body.stage_name}" が見つかりません` },
          { status: 400 }
        )
      }
    }

    // 武器IDの取得（名寄せ）
    let weaponIds = body.weapon_ids
    if (!weaponIds || weaponIds.length === 0) {
      weaponIds = await lookupWeaponIds(body.weapons)
      const validWeaponIds = weaponIds.filter((id): id is number => id !== null)
      if (validWeaponIds.length !== body.weapons.length) {
        return NextResponse.json(
          { success: false, error: '一部の武器が見つかりません' },
          { status: 400 }
        )
      }
      weaponIds = validWeaponIds
    }

    // トータルゴールデンエッグ数を計算（wavesのdelivered_countの合計）
    const totalGoldenEggs = body.waves.reduce(
      (sum, wave) => sum + (wave.delivered_count || 0),
      0
    )

    // トランザクション処理: まずscenariosテーブルに保存
    const { error: scenarioError } = await supabase.from('scenarios').insert({
      code: body.scenario_code,
      author_id: user.id,
      stage_id: stageId,
      danger_rate: body.danger_rate,
      total_golden_eggs: totalGoldenEggs,
      total_power_eggs: 0, // 解析結果に含まれていないためデフォルト値
    })

    if (scenarioError) {
      console.error('Error inserting scenario:', scenarioError)
      return NextResponse.json(
        { success: false, error: 'シナリオの保存に失敗しました' },
        { status: 500 }
      )
    }

    // scenario_wavesテーブルに保存
    const waveInserts = body.waves.map((wave) => {
      // wave_numberが'EX'の場合は3として扱う（データベースの制約に合わせる）
      const waveNumber = wave.wave_number === 'EX' ? 3 : wave.wave_number
      const isExWave = wave.wave_number === 'EX'

      return {
        scenario_code: body.scenario_code,
        wave_number: waveNumber,
        tide: wave.tide,
        event: isExWave ? 'オカシラ' : (wave.event || null), // WAVE EXの場合は常に「オカシラ」
        delivered_count: isExWave ? 0 : (wave.delivered_count || 0), // WAVE EXの場合は0
        quota: isExWave ? 1 : (wave.quota || wave.delivered_count || 1), // WAVE EXの場合は1（制約を満たすため）
        cleared: wave.cleared ?? false,
      }
    })

    const { error: wavesError } = await supabase
      .from('scenario_waves')
      .insert(waveInserts)

    if (wavesError) {
      // ロールバック: scenariosテーブルから削除
      await supabase.from('scenarios').delete().eq('code', body.scenario_code)
      console.error('Error inserting waves:', wavesError)
      return NextResponse.json(
        { success: false, error: 'WAVE情報の保存に失敗しました' },
        { status: 500 }
      )
    }

    // scenario_weaponsテーブルに保存
    const weaponInserts = weaponIds.map((weaponId, index) => ({
      scenario_code: body.scenario_code,
      weapon_id: weaponId,
      display_order: index + 1,
    }))

    const { error: weaponsError } = await supabase
      .from('scenario_weapons')
      .insert(weaponInserts)

    if (weaponsError) {
      // ロールバック: scenariosとscenario_wavesテーブルから削除
      await supabase.from('scenario_waves').delete().eq('scenario_code', body.scenario_code)
      await supabase.from('scenarios').delete().eq('code', body.scenario_code)
      console.error('Error inserting weapons:', weaponsError)
      return NextResponse.json(
        { success: false, error: '武器情報の保存に失敗しました' },
        { status: 500 }
      )
    }

    // 成功レスポンス
    return NextResponse.json({
      success: true,
      data: {
        scenario_code: body.scenario_code,
      },
    })
  } catch (error) {
    console.error('Error saving scenario:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'シナリオの保存中にエラーが発生しました',
      },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { lookupStageId, lookupWeaponIds } from '@/lib/utils/master-lookup'

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
    console.warn('[POST /api/scenarios] リクエスト受信')

    // 認証チェック
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[POST /api/scenarios] 認証エラー:', authError)
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      )
    }

    console.warn('[POST /api/scenarios] 認証成功:', { userId: user.id })

    // リクエストボディを取得
    let body: SaveScenarioRequest
    try {
      body = await request.json()
      console.warn('[POST /api/scenarios] リクエストボディ取得:', {
        scenario_code: body.scenario_code,
        stage_name: body.stage_name,
        weapons_count: body.weapons?.length,
        waves_count: body.waves?.length,
      })
    } catch (parseError) {
      console.error('[POST /api/scenarios] JSONパースエラー:', parseError)
      return NextResponse.json(
        { success: false, error: 'リクエストボディの解析に失敗しました' },
        { status: 400 }
      )
    }

    // バリデーション
    if (!body.scenario_code || !body.stage_name || !body.weapons || !body.waves) {
      console.error('[POST /api/scenarios] バリデーションエラー:', {
        scenario_code: body.scenario_code,
        stage_name: body.stage_name,
        weapons: body.weapons,
        waves: body.waves,
      })
      return NextResponse.json(
        { success: false, error: '必須フィールドが不足しています' },
        { status: 400 }
      )
    }

    // 重複チェック
    console.warn('[POST /api/scenarios] 重複チェック開始:', body.scenario_code)
    const { data: existingScenarios, error: checkError } = await supabase
      .from('scenarios')
      .select('code')
      .eq('code', body.scenario_code)
      .limit(1)

    if (checkError) {
      console.error('[POST /api/scenarios] 重複チェックエラー:', {
        error: checkError,
        code: checkError.code,
        message: checkError.message,
        details: checkError.details,
        hint: checkError.hint,
      })
      return NextResponse.json(
        {
          success: false,
          error: `重複チェック中にエラーが発生しました: ${checkError.message}`,
        },
        { status: 500 }
      )
    }

    if (existingScenarios && existingScenarios.length > 0) {
      console.warn('[POST /api/scenarios] 重複検出:', body.scenario_code)
      return NextResponse.json(
        {
          success: false,
          error: `シナリオコード "${body.scenario_code}" は既に存在します`,
        },
        { status: 409 }
      )
    }
    console.warn('[POST /api/scenarios] 重複なし')

    // ステージIDの取得（名寄せ）
    console.warn('[POST /api/scenarios] ステージID取得開始:', body.stage_name)
    let stageId = body.stage_id
    if (!stageId) {
      stageId = await lookupStageId(body.stage_name)
      if (!stageId) {
        console.error('[POST /api/scenarios] ステージが見つかりません:', body.stage_name)
        return NextResponse.json(
          { success: false, error: `ステージ "${body.stage_name}" が見つかりません` },
          { status: 400 }
        )
      }
    }
    console.warn('[POST /api/scenarios] ステージID取得成功:', stageId)

    // 武器IDの取得（名寄せ）
    console.warn('[POST /api/scenarios] 武器ID取得開始:', body.weapons)
    let weaponIds = body.weapon_ids
    if (!weaponIds || weaponIds.length === 0) {
      weaponIds = await lookupWeaponIds(body.weapons)
      const validWeaponIds = weaponIds.filter((id): id is number => id !== null)
      if (validWeaponIds.length !== body.weapons.length) {
        console.error('[POST /api/scenarios] 武器が見つかりません:', {
          requested: body.weapons,
          found: validWeaponIds,
          missing: body.weapons.filter((_, i) => weaponIds[i] === null),
        })
        return NextResponse.json(
          {
            success: false,
            error: `一部の武器が見つかりません: ${body.weapons.filter((_, i) => weaponIds[i] === null).join(', ')}`,
          },
          { status: 400 }
        )
      }
      weaponIds = validWeaponIds
    } else {
      // weapon_idsが提供されている場合、長さの検証
      if (weaponIds.length !== body.weapons.length) {
        console.error('[POST /api/scenarios] 武器IDと武器名の数が一致しません:', {
          weapons_count: body.weapons.length,
          weapon_ids_count: weaponIds.length,
        })
        return NextResponse.json(
          {
            success: false,
            error: `武器IDの数（${weaponIds.length}）と武器名の数（${body.weapons.length}）が一致しません`,
          },
          { status: 400 }
        )
      }
      // weapon_idsがnullや無効な値を含んでいないか検証
      const invalidIds = weaponIds.filter((id) => id === null || id === undefined || typeof id !== 'number')
      if (invalidIds.length > 0) {
        console.error('[POST /api/scenarios] 無効な武器IDが含まれています:', invalidIds)
        return NextResponse.json(
          {
            success: false,
            error: '無効な武器IDが含まれています',
          },
          { status: 400 }
        )
      }
    }
    console.warn('[POST /api/scenarios] 武器ID取得成功:', weaponIds)

    // scenario_wavesテーブル用のデータを準備（WAVE EXの処理を含む）
    // WAVE EXはwave_number: 4として保存する（WAVE 1, 2, 3, EXの4つを全て保存）
    const waveInserts = body.waves.map((wave) => {
      // wave_numberが'EX'の場合は4として扱う
      const waveNumber = wave.wave_number === 'EX' ? 4 : wave.wave_number
      const isExWave = wave.wave_number === 'EX'

      return {
        scenario_code: body.scenario_code,
        wave_number: waveNumber,
        tide: wave.tide,
        event: wave.event || null, // WAVE EXの場合は選択されたオカシラの種類（ヨコヅナ、タツ、ジョー、オカシラ連合）
        delivered_count: isExWave ? 0 : (wave.delivered_count || 0), // WAVE EXの場合は0
        quota: isExWave ? 1 : (wave.quota || wave.delivered_count || 1), // WAVE EXの場合は1（制約を満たすため）
        cleared: wave.cleared ?? false,
      }
    })
    
    console.warn('[POST /api/scenarios] waveInserts:', waveInserts)

    // トータルゴールデンエッグ数を計算（WAVE EXの処理後のdelivered_countの合計）
    // これにより、scenariosテーブルとscenario_wavesテーブルのデータ整合性を保証
    const totalGoldenEggs = waveInserts.reduce(
      (sum, wave) => sum + (wave.delivered_count || 0),
      0
    )

    // トランザクション処理: まずscenariosテーブルに保存
    console.warn('[POST /api/scenarios] scenariosテーブルに保存開始')
    const scenarioInsert = {
      code: body.scenario_code,
      author_id: user.id,
      stage_id: stageId,
      danger_rate: body.danger_rate,
      total_golden_eggs: totalGoldenEggs,
      total_power_eggs: 0, // 解析結果に含まれていないためデフォルト値
    }
    console.warn('[POST /api/scenarios] scenarios挿入データ:', scenarioInsert)

    const { error: scenarioError } = await supabase.from('scenarios').insert(scenarioInsert)

    if (scenarioError) {
      console.error('[POST /api/scenarios] scenarios保存エラー:', {
        error: scenarioError,
        code: scenarioError.code,
        message: scenarioError.message,
        details: scenarioError.details,
        hint: scenarioError.hint,
      })

      // 重複キーエラー（PostgreSQLの23505エラーコード）の場合は409を返す
      if (scenarioError.code === '23505' || scenarioError.message?.includes('duplicate key')) {
        console.warn('[POST /api/scenarios] 重複キーエラー検出（データベース制約）')
        return NextResponse.json(
          {
            success: false,
            error: `シナリオコード "${body.scenario_code}" は既に存在します`,
          },
          { status: 409 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: `シナリオの保存に失敗しました: ${scenarioError.message}`,
        },
        { status: 500 }
      )
    }
    console.warn('[POST /api/scenarios] scenarios保存成功')

    console.warn('[POST /api/scenarios] scenario_wavesテーブルに保存開始:', waveInserts)
    const { error: wavesError } = await supabase
      .from('scenario_waves')
      .insert(waveInserts)

    if (wavesError) {
      // ロールバック: scenariosテーブルから削除
      console.error('[POST /api/scenarios] scenario_waves保存エラー:', {
        error: wavesError,
        code: wavesError.code,
        message: wavesError.message,
        details: wavesError.details,
        hint: wavesError.hint,
      })
      const { error: deleteError } = await supabase
        .from('scenarios')
        .delete()
        .eq('code', body.scenario_code)
      if (deleteError) {
        console.error('[POST /api/scenarios] ロールバック失敗（scenarios削除エラー）:', deleteError)
        // ロールバック失敗はログに記録するが、元のエラーを返す
      } else {
        console.warn('[POST /api/scenarios] ロールバック: scenarios削除完了')
      }
      return NextResponse.json(
        {
          success: false,
          error: `WAVE情報の保存に失敗しました: ${wavesError.message}`,
        },
        { status: 500 }
      )
    }
    console.warn('[POST /api/scenarios] scenario_waves保存成功')

    // scenario_weaponsテーブルに保存
    const weaponInserts = weaponIds.map((weaponId, index) => ({
      scenario_code: body.scenario_code,
      weapon_id: weaponId,
      display_order: index + 1,
    }))
    console.warn('[POST /api/scenarios] scenario_weaponsテーブルに保存開始:', weaponInserts)

    const { error: weaponsError } = await supabase
      .from('scenario_weapons')
      .insert(weaponInserts)

    if (weaponsError) {
      // ロールバック: scenariosとscenario_wavesテーブルから削除
      console.error('[POST /api/scenarios] scenario_weapons保存エラー:', {
        error: weaponsError,
        code: weaponsError.code,
        message: weaponsError.message,
        details: weaponsError.details,
        hint: weaponsError.hint,
      })
      
      // scenario_wavesを削除
      const { error: deleteWavesError } = await supabase
        .from('scenario_waves')
        .delete()
        .eq('scenario_code', body.scenario_code)
      if (deleteWavesError) {
        console.error('[POST /api/scenarios] ロールバック失敗（scenario_waves削除エラー）:', deleteWavesError)
      }
      
      // scenariosを削除
      const { error: deleteScenariosError } = await supabase
        .from('scenarios')
        .delete()
        .eq('code', body.scenario_code)
      if (deleteScenariosError) {
        console.error('[POST /api/scenarios] ロールバック失敗（scenarios削除エラー）:', deleteScenariosError)
      }
      
      if (!deleteWavesError && !deleteScenariosError) {
        console.warn('[POST /api/scenarios] ロールバック: scenario_wavesとscenarios削除完了')
      }
      
      return NextResponse.json(
        {
          success: false,
          error: `武器情報の保存に失敗しました: ${weaponsError.message}`,
        },
        { status: 500 }
      )
    }
    console.warn('[POST /api/scenarios] scenario_weapons保存成功')

    // 成功レスポンス
    console.warn('[POST /api/scenarios] 保存成功:', body.scenario_code)
    return NextResponse.json({
      success: true,
      data: {
        scenario_code: body.scenario_code,
      },
    })
  } catch (error) {
    console.error('[POST /api/scenarios] 予期しないエラー:', {
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
            : 'シナリオの保存中にエラーが発生しました',
      },
      { status: 500 }
    )
  }
}


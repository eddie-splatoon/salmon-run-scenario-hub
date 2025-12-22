import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { lookupStageId, lookupWeaponIds } from '@/lib/utils/master-lookup'
import { hasTag } from '@/lib/utils/scenario-tags-server'

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingScenarios, error: checkError } = await (supabase as any)
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
    let stageId: number | undefined = body.stage_id
    if (!stageId) {
      const lookedUpStageId = await lookupStageId(body.stage_name)
      stageId = lookedUpStageId ?? undefined
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
    let weaponIds: number[] | (number | null)[] = body.weapon_ids || []
    if (!weaponIds || weaponIds.length === 0) {
      const lookedUpWeaponIds = await lookupWeaponIds(body.weapons)
      weaponIds = lookedUpWeaponIds
      const validWeaponIds = lookedUpWeaponIds.filter((id): id is number => id !== null)
      if (validWeaponIds.length !== body.weapons.length) {
        console.error('[POST /api/scenarios] 武器が見つかりません:', {
          requested: body.weapons,
          found: validWeaponIds,
          missing: body.weapons.filter((_, i) => lookedUpWeaponIds[i] === null),
        })
        return NextResponse.json(
          {
            success: false,
            error: `一部の武器が見つかりません: ${body.weapons.filter((_, i) => weaponIds[i] === null).join(', ')}`,
          },
          { status: 400 }
        )
      }
      weaponIds = validWeaponIds as number[]
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: scenarioError } = await (supabase as any).from('scenarios').insert(scenarioInsert)

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: wavesError } = await (supabase as any)
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deleteError } = await (supabase as any)
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
    // 同じ武器IDが複数ある場合、重複を排除して最初の出現位置のみを保存
    // (scenario_code, weapon_id)が主キーのため、同じ武器IDを複数回挿入できない
    const seenWeaponIds = new Map<number, number>() // weapon_id -> display_order
    const weaponInserts: Array<{
      scenario_code: string
      weapon_id: number
      display_order: number
    }> = [] as Array<{
      scenario_code: string
      weapon_id: number
      display_order: number
    }>

    (weaponIds as number[]).forEach((weaponId: number, index: number) => {
      // まだ見ていない武器IDの場合のみ追加
      if (!seenWeaponIds.has(weaponId)) {
        seenWeaponIds.set(weaponId, index + 1)
        weaponInserts.push({
          scenario_code: body.scenario_code,
          weapon_id: weaponId,
          display_order: index + 1,
        })
      }
    })

    console.warn('[POST /api/scenarios] scenario_weaponsテーブルに保存開始:', weaponInserts)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: weaponsError } = await (supabase as any)
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deleteWavesError } = await (supabase as any)
        .from('scenario_waves')
        .delete()
        .eq('scenario_code', body.scenario_code)
      if (deleteWavesError) {
        console.error('[POST /api/scenarios] ロールバック失敗（scenario_waves削除エラー）:', deleteWavesError)
      }
      
      // scenariosを削除
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deleteScenariosError } = await (supabase as any)
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

interface ScenarioListItem {
  code: string
  stage_id: number
  stage_name: string
  danger_rate: number
  total_golden_eggs: number
  created_at: string
  author_id: string
  weapons: Array<{
    weapon_id: number
    weapon_name: string
    icon_url: string | null
    display_order: number
  }>
}

interface GetScenariosResponse {
  success: boolean
  data?: ScenarioListItem[]
  error?: string
}

/**
 * シナリオ一覧を取得するAPIエンドポイント（フィルター対応）
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<GetScenariosResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const stageId = searchParams.get('stage_id')
    const weaponIds = searchParams.get('weapon_ids')?.split(',').map(Number).filter(Boolean)
    const minDangerRate = searchParams.get('min_danger_rate')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [] // ハッシュタグフィルタ（複数選択可能、OR条件）

    const supabase = await createClient()

    // 基本クエリ: scenariosテーブルとm_stagesテーブルをJOIN
    let query = supabase
      .from('scenarios')
      .select(`
        code,
        author_id,
        stage_id,
        danger_rate,
        total_golden_eggs,
        created_at,
        m_stages!inner(name)
      `)
      .order('created_at', { ascending: false })

    // ステージフィルター
    if (stageId) {
      query = query.eq('stage_id', parseInt(stageId, 10))
    }

    // キケン度フィルター
    if (minDangerRate) {
      query = query.gte('danger_rate', parseInt(minDangerRate, 10))
    }

    const { data: scenarios, error: scenariosError } = await query

    if (scenariosError) {
      console.error('[GET /api/scenarios] シナリオ取得エラー:', scenariosError)
      return NextResponse.json(
        {
          success: false,
          error: `シナリオ一覧の取得に失敗しました: ${scenariosError.message}`,
        },
        { status: 500 }
      )
    }

    if (!scenarios || scenarios.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    // 型アサーション: Supabaseのクエリ結果の型を明示
    type ScenarioWithStage = {
      code: string
      author_id: string
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: scenarioWeapons, error: weaponsError } = await (supabase as any)
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
      console.error('[GET /api/scenarios] 武器情報取得エラー:', weaponsError)
      return NextResponse.json(
        {
          success: false,
          error: `武器情報の取得に失敗しました: ${weaponsError.message}`,
        },
        { status: 500 }
      )
    }

    // 型アサーション: 武器情報の型を明示
    type ScenarioWeaponWithWeapon = {
      scenario_code: string
      weapon_id: number
      display_order: number
      m_weapons: { id: number; name: string; icon_url: string | null }
    }

    const typedScenarioWeapons = (scenarioWeapons || []) as ScenarioWeaponWithWeapon[]

    // WAVE情報を取得（ハッシュタグ判定に必要）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: scenarioWaves, error: wavesError } = await (supabase as any)
      .from('scenario_waves')
      .select('scenario_code, wave_number, event, cleared')
      .in('scenario_code', scenarioCodes)
      .order('scenario_code')
      .order('wave_number')

    if (wavesError) {
      console.error('[GET /api/scenarios] WAVE情報取得エラー:', wavesError)
    }

    type ScenarioWaveInfo = {
      scenario_code: string
      wave_number: number
      event: string | null
      cleared: boolean
    }

    const typedScenarioWaves = (scenarioWaves || []) as ScenarioWaveInfo[]

    // 武器フィルター適用（武器IDが指定されている場合）
    // 指定された武器IDをすべて含むシナリオのみを抽出
    let filteredScenarioCodes = scenarioCodes
    
    if (weaponIds && weaponIds.length > 0) {
      // 各シナリオコードに対して、指定された武器IDをすべて含むかチェック
      filteredScenarioCodes = scenarioCodes.filter((code) => {
        const scenarioWeaponIds = typedScenarioWeapons
          .filter((sw) => sw.scenario_code === code)
          .map((sw) => sw.weapon_id)
        // 指定された武器IDをすべて含むかチェック
        return weaponIds.every((weaponId) => scenarioWeaponIds.includes(weaponId))
      })
    }

    // ハッシュタグフィルター適用（OR条件：いずれかのタグが含まれていればOK）
    if (tags.length > 0) {
      filteredScenarioCodes = filteredScenarioCodes.filter((code) => {
        const scenario = typedScenarios.find((s) => s.code === code)
        if (!scenario) return false

        const waves = typedScenarioWaves
          .filter((w) => w.scenario_code === code)
          .map((w) => ({
            wave_number: w.wave_number,
            event: w.event,
            cleared: w.cleared,
          }))

        const weapons = typedScenarioWeapons
          .filter((sw) => sw.scenario_code === code)
          .map((sw) => ({
            weapon_name: sw.m_weapons.name,
          }))

        const scenarioInfo = {
          danger_rate: scenario.danger_rate,
          total_golden_eggs: scenario.total_golden_eggs,
          waves,
          weapons,
        }

        // OR条件：いずれかのタグが含まれていればOK
        return tags.some((tag) => hasTag(scenarioInfo, tag))
      })
    }

    // 結果を整形
    const result: ScenarioListItem[] = typedScenarios
      .filter((s) => filteredScenarioCodes.includes(s.code))
      .map((scenario) => {
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
          author_id: scenario.author_id,
          weapons,
        }
      })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('[GET /api/scenarios] 予期しないエラー:', {
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
            : 'シナリオ一覧の取得中にエラーが発生しました',
      },
      { status: 500 }
    )
  }
}


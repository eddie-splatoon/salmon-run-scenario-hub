import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface CheckScenarioResponse {
  success: boolean
  exists?: boolean
  scenario_code?: string
  error?: string
}

/**
 * シナリオコードの重複チェックAPIエンドポイント
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<CheckScenarioResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const scenarioCode = searchParams.get('code')

    if (!scenarioCode) {
      return NextResponse.json(
        { success: false, error: 'シナリオコードが指定されていません' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: existingScenarios, error: checkError } = await supabase
      .from('scenarios')
      .select('code')
      .eq('code', scenarioCode)
      .limit(1)

    if (checkError) {
      console.error('[GET /api/scenarios/check] 重複チェックエラー:', checkError)
      return NextResponse.json(
        {
          success: false,
          error: `重複チェック中にエラーが発生しました: ${checkError.message}`,
        },
        { status: 500 }
      )
    }

    const exists = existingScenarios && existingScenarios.length > 0

    return NextResponse.json({
      success: true,
      exists,
      scenario_code: exists ? scenarioCode : undefined,
    })
  } catch (error) {
    console.error('[GET /api/scenarios/check] 予期しないエラー:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? `予期しないエラーが発生しました: ${error.message}`
            : '重複チェック中にエラーが発生しました',
      },
      { status: 500 }
    )
  }
}


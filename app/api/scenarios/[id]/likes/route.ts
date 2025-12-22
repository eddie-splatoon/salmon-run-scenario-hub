import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface LikeResponse {
  success: boolean
  data?: {
    is_liked: boolean
    like_count: number
  }
  error?: string
}

/**
 * いいねを追加/削除するAPIエンドポイント
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<LikeResponse>> {
  try {
    const { id: scenarioCode } = await params
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

    // シナリオの存在確認
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: scenario, error: scenarioError } = await (supabase as any)
      .from('scenarios')
      .select('code')
      .eq('code', scenarioCode)
      .single()

    if (scenarioError || !scenario) {
      return NextResponse.json(
        { success: false, error: 'シナリオが見つかりません' },
        { status: 404 }
      )
    }

    // 既存のいいねを確認
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingLike, error: checkError } = await (supabase as any)
      .from('likes')
      .select('id')
      .eq('scenario_code', scenarioCode)
      .eq('user_id', user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116は「行が見つからない」エラーなので無視
      console.error('[POST /api/scenarios/[id]/likes] いいね確認エラー:', checkError)
      return NextResponse.json(
        {
          success: false,
          error: `いいねの確認に失敗しました: ${checkError.message}`,
        },
        { status: 500 }
      )
    }

    if (existingLike) {
      // いいねを削除
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deleteError } = await (supabase as any)
        .from('likes')
        .delete()
        .eq('scenario_code', scenarioCode)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('[POST /api/scenarios/[id]/likes] いいね削除エラー:', deleteError)
        return NextResponse.json(
          {
            success: false,
            error: `いいねの削除に失敗しました: ${deleteError.message}`,
          },
          { status: 500 }
        )
      }
    } else {
      // いいねを追加
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any).from('likes').insert({
        scenario_code: scenarioCode,
        user_id: user.id,
      })

      if (insertError) {
        console.error('[POST /api/scenarios/[id]/likes] いいね追加エラー:', insertError)
        return NextResponse.json(
          {
            success: false,
            error: `いいねの追加に失敗しました: ${insertError.message}`,
          },
          { status: 500 }
        )
      }
    }

    // いいね数を取得
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: likeCount, error: countError } = await (supabase as any)
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('scenario_code', scenarioCode)

    if (countError) {
      console.error('[POST /api/scenarios/[id]/likes] いいね数取得エラー:', countError)
      // いいね数取得エラーは致命的ではないので、0として扱う
    }

    return NextResponse.json({
      success: true,
      data: {
        is_liked: !existingLike,
        like_count: likeCount || 0,
      },
    })
  } catch (error) {
    console.error('[POST /api/scenarios/[id]/likes] 予期しないエラー:', {
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
            : 'いいねの処理中にエラーが発生しました',
      },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/app/types/database.types'

interface UpdateProfileRequest {
  name?: string
  avatar_url?: string
}

interface UpdateProfileResponse {
  success: boolean
  error?: string
}

/**
 * プロフィールを更新するAPIエンドポイント
 */
export async function PUT(
  request: NextRequest
): Promise<NextResponse<UpdateProfileResponse>> {
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

    // リクエストボディを取得
    let body: UpdateProfileRequest
    try {
      body = await request.json()
    } catch (_parseError) {
      return NextResponse.json(
        { success: false, error: 'リクエストボディの解析に失敗しました' },
        { status: 400 }
      )
    }

    // バリデーション
    if (body.name === undefined) {
      return NextResponse.json(
        { success: false, error: 'ユーザー名を指定してください' },
        { status: 400 }
      )
    }

    if (typeof body.name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'ユーザー名は文字列である必要があります' },
        { status: 400 }
      )
    }

    const trimmedName = body.name.trim()
    if (trimmedName.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ユーザー名を入力してください' },
        { status: 400 }
      )
    }

    if (trimmedName.length > 50) {
      return NextResponse.json(
        { success: false, error: 'ユーザー名は50文字以内で入力してください' },
        { status: 400 }
      )
    }

    // auth.usersのuser_metadataを更新（nameのみ、avatar_urlは保存しない）
    if (body.name !== undefined) {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: trimmedName,
        },
      })

      if (updateError) {
        console.error('[PUT /api/profile] プロフィール更新エラー:', updateError)
        return NextResponse.json(
          {
            success: false,
            error: `プロフィールの更新に失敗しました: ${updateError.message}`,
          },
          { status: 500 }
        )
      }
    }

    // profilesテーブルも更新（nameのみ、avatar_urlは別APIで管理）
    if (body.name !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: profileUpdateError } = await (supabase as any)
        .from('profiles')
        .update({ display_name: trimmedName })
        .eq('user_id', user.id)

      if (profileUpdateError) {
        console.error('[PUT /api/profile] profilesテーブル更新エラー:', profileUpdateError)
        // profilesテーブルの更新エラーは無視（auth.usersの更新は成功しているため）
      }
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('[PUT /api/profile] 予期しないエラー:', {
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
            : 'プロフィールの更新中にエラーが発生しました',
      },
      { status: 500 }
    )
  }
}


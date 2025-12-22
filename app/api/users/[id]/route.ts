import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface UserInfo {
  id: string
  email: string | null
  name: string | null
  avatar_url: string | null
}

interface GetUserInfoResponse {
  success: boolean
  data?: UserInfo
  error?: string
}

/**
 * ユーザー情報を取得するAPIエンドポイント
 * プロフィールテーブルから情報を取得します
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<GetUserInfoResponse>> {
  try {
    const { id: userId } = await params
    const supabase = await createClient()

    // プロフィールテーブルから情報を取得
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile, error: profileError } = await (supabase as any)
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .eq('user_id', userId)
      .maybeSingle()

    if (profileError) {
      console.error('[GET /api/users/[id]] プロフィール取得エラー:', profileError)
    }

    // 認証情報を取得（現在のユーザーが自分の情報を取得する場合のみ）
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // プロフィール情報が存在する場合は、それを返す
    if (profile) {
      return NextResponse.json({
        success: true,
        data: {
          id: profile.user_id,
          email: user?.id === userId ? (user.email || null) : null, // 自分の情報の場合のみemailを返す
          name: profile.display_name || null,
          avatar_url: profile.avatar_url || null,
        },
      })
    }

    // プロフィール情報が存在しない場合、現在のユーザーの情報を返す（自分の情報の場合のみ）
    if (user && user.id === userId) {
      return NextResponse.json({
        success: true,
        data: {
          id: user.id,
          email: user.email || null,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || null,
          avatar_url: user.user_metadata?.picture || null, // user_metadata.avatar_urlは使用しない（Cookieサイズ削減のため）
        },
      })
    }

    // プロフィール情報が存在せず、現在のユーザーでない場合
    return NextResponse.json({
      success: true,
      data: {
        id: userId,
        email: null,
        name: null,
        avatar_url: null,
      },
    })
  } catch (error) {
    console.error('[GET /api/users/[id]] 予期しないエラー:', {
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
            : 'ユーザー情報の取得中にエラーが発生しました',
      },
      { status: 500 }
    )
  }
}


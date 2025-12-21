import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface UploadAvatarResponse {
  success: boolean
  data?: {
    avatar_url: string
  }
  error?: string
}

/**
 * プロフィール画像をアップロードするAPIエンドポイント
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<UploadAvatarResponse>> {
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

    // リクエストから画像を取得
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: '画像ファイルが必要です' },
        { status: 400 }
      )
    }

    // ファイルサイズチェック（5MB以下）
    if (imageFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: '画像サイズは5MB以下である必要があります' },
        { status: 400 }
      )
    }

    // ファイルタイプチェック
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: '画像ファイルである必要があります' },
        { status: 400 }
      )
    }

    // 画像をBase64に変換
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Image = buffer.toString('base64')
    const dataUrl = `data:${imageFile.type};base64,${base64Image}`

    // profilesテーブルのみを更新（user_metadataには保存しない - Cookieサイズ制限を回避）
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ avatar_url: dataUrl })
      .eq('user_id', user.id)

    if (profileUpdateError) {
      console.error('[POST /api/profile/avatar] profilesテーブル更新エラー:', profileUpdateError)
      return NextResponse.json(
        {
          success: false,
          error: `プロフィール画像の更新に失敗しました: ${profileUpdateError.message}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        avatar_url: dataUrl,
      },
    })
  } catch (error) {
    console.error('[POST /api/profile/avatar] 予期しないエラー:', {
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
            : 'プロフィール画像のアップロード中にエラーが発生しました',
      },
      { status: 500 }
    )
  }
}


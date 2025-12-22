import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Comment {
  id: number
  user_id: string
  content: string
  created_at: string
  updated_at: string
}

interface CreateCommentRequest {
  content: string
}

interface CreateCommentResponse {
  success: boolean
  data?: Comment
  error?: string
}

interface GetCommentsResponse {
  success: boolean
  data?: Comment[]
  error?: string
}

/**
 * コメント一覧を取得するAPIエンドポイント
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<GetCommentsResponse>> {
  try {
    const { id: scenarioCode } = await params
    const supabase = await createClient()

    // シナリオの存在確認
    const { data: scenario, error: scenarioError } = await supabase
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

    // コメントを取得
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: comments, error: commentsError } = await (supabase as any)
      .from('comments')
      .select('id, user_id, content, created_at, updated_at')
      .eq('scenario_code', scenarioCode)
      .order('created_at', { ascending: false })

    if (commentsError) {
      console.error('[GET /api/scenarios/[id]/comments] コメント取得エラー:', commentsError)
      return NextResponse.json(
        {
          success: false,
          error: `コメントの取得に失敗しました: ${commentsError.message}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: (comments || []) as Comment[],
    })
  } catch (error) {
    console.error('[GET /api/scenarios/[id]/comments] 予期しないエラー:', {
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
            : 'コメントの取得中にエラーが発生しました',
      },
      { status: 500 }
    )
  }
}

/**
 * コメントを追加するAPIエンドポイント
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<CreateCommentResponse>> {
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

    // リクエストボディを取得
    let body: CreateCommentRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'リクエストボディの解析に失敗しました' },
        { status: 400 }
      )
    }

    // バリデーション
    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json(
        { success: false, error: 'コメント内容が必須です' },
        { status: 400 }
      )
    }

    const trimmedContent = body.content.trim()
    if (trimmedContent.length === 0 || trimmedContent.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'コメントは1文字以上1000文字以下である必要があります' },
        { status: 400 }
      )
    }

    // シナリオの存在確認
    const { data: scenario, error: scenarioError } = await supabase
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

    // コメントを追加
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: comment, error: insertError } = await (supabase as any)
      .from('comments')
      .insert({
        scenario_code: scenarioCode,
        user_id: user.id,
        content: trimmedContent,
      })
      .select('id, user_id, content, created_at, updated_at')
      .single()

    if (insertError) {
      console.error('[POST /api/scenarios/[id]/comments] コメント追加エラー:', insertError)
      return NextResponse.json(
        {
          success: false,
          error: `コメントの追加に失敗しました: ${insertError.message}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: comment as Comment,
    })
  } catch (error) {
    console.error('[POST /api/scenarios/[id]/comments] 予期しないエラー:', {
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
            : 'コメントの追加中にエラーが発生しました',
      },
      { status: 500 }
    )
  }
}


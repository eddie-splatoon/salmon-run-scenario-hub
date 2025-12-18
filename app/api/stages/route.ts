import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Stage {
  id: number
  name: string
}

interface StagesResponse {
  success: boolean
  data?: Stage[]
  error?: string
}

/**
 * ステージマスタ一覧を取得するAPIエンドポイント
 */
export async function GET(): Promise<NextResponse<StagesResponse>> {
  try {
    const supabase = await createClient()

    const { data: stages, error } = await supabase
      .from('m_stages')
      .select('id, name')
      .order('name')

    if (error) {
      console.error('Error fetching stages:', error)
      return NextResponse.json(
        { success: false, error: 'ステージ一覧の取得に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: stages || [],
    })
  } catch (error) {
    console.error('Error fetching stages:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'ステージ一覧の取得中にエラーが発生しました',
      },
      { status: 500 }
    )
  }
}


import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Weapon {
  id: number
  name: string
  icon_url: string | null
}

interface WeaponsResponse {
  success: boolean
  data?: Weapon[]
  error?: string
}

/**
 * 武器マスタ一覧を取得するAPIエンドポイント
 */
export async function GET(): Promise<NextResponse<WeaponsResponse>> {
  try {
    const supabase = await createClient()

    const { data: weapons, error } = await supabase
      .from('m_weapons')
      .select('id, name, icon_url')
      .order('name')

    if (error) {
      console.error('Error fetching weapons:', error)
      return NextResponse.json(
        { success: false, error: '武器一覧の取得に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: weapons || [],
    })
  } catch (error) {
    console.error('Error fetching weapons:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '武器一覧の取得中にエラーが発生しました',
      },
      { status: 500 }
    )
  }
}


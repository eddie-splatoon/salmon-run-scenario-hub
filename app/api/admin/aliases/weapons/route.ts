import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin'

/**
 * 武器エイリアスの一覧を取得
 */
export async function GET() {
  try {
    await requireAdmin()
    
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('weapon_aliases')
      .select(`
        *,
        m_weapons!inner(name)
      `)
      .order('alias')

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * 武器エイリアスを追加
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    
    const body = await request.json()
    const { weapon_id, alias } = body

    if (!weapon_id || !alias) {
      return NextResponse.json(
        { success: false, error: 'weapon_id and alias are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('weapon_aliases')
      .insert({
        weapon_id,
        alias,
      } as never)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Unknown error' },
      { status: 500 }
    )
  }
}


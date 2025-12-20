import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin'

/**
 * 武器マスタの一覧を取得
 */
export async function GET() {
  try {
    await requireAdmin()
    
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('m_weapons')
      .select('*')
      .order('name')

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
 * 武器マスタを追加
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    
    const body = await request.json()
    const { name, icon_url, is_grizzco_weapon } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'name is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('m_weapons')
      .insert({
        name,
        icon_url: icon_url || null,
        is_grizzco_weapon: is_grizzco_weapon || false,
      } as any)
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


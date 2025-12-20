import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin'

/**
 * 未知データの一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'stages' or 'weapons'

    const supabase = await createClient()

    if (type === 'stages') {
      const { data, error } = await supabase
        .from('unknown_stages')
        .select('*')
        .is('resolved_at', null)
        .order('detected_at', { ascending: false })

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data })
    } else if (type === 'weapons') {
      const { data, error } = await supabase
        .from('unknown_weapons')
        .select('*')
        .is('resolved_at', null)
        .order('detected_at', { ascending: false })

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data })
    } else {
      return NextResponse.json(
        { success: false, error: 'type parameter is required (stages or weapons)' },
        { status: 400 }
      )
    }
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


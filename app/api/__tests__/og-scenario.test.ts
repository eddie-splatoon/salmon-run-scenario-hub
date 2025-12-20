import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../og/scenario/[id]/route'
import { createClient } from '@/lib/supabase/server'

// Supabaseサーバークライアントをモック
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// @vercel/ogをモック
vi.mock('@vercel/og', () => ({
  ImageResponse: vi.fn((_element, _options) => {
    return new Response('Mock Image', {
      headers: {
        'Content-Type': 'image/png',
      },
    })
  }),
}))

describe('OGP画像生成API', () => {
  const mockSupabase = {
    from: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase)
  })

  it('シナリオが見つからない場合は404を返す', async () => {
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { message: 'Not found' },
    })

    const request = new NextRequest('http://localhost:3000/api/og/scenario/INVALID')
    const params = Promise.resolve({ id: 'INVALID' })

    const response = await GET(request, { params })
    expect(response.status).toBe(404)
  })

  it('正常なシナリオでOGP画像を生成する', async () => {
    const mockScenario = {
      code: 'TEST123',
      stage_id: 1,
      danger_rate: 200,
      total_golden_eggs: 100,
      total_power_eggs: 5000,
      m_stages: { name: 'テストステージ' },
    }

    const mockWeapons = [
      {
        display_order: 1,
        m_weapons: { name: 'テスト武器1' },
      },
      {
        display_order: 2,
        m_weapons: { name: 'テスト武器2' },
      },
    ]

    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.single.mockResolvedValue({
      data: mockScenario,
      error: null,
    })

    // 武器情報の取得（2回目のfrom呼び出し）
    const mockWeaponQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: mockWeapons,
        error: null,
      }),
    }
    // 最初のfromはシナリオ取得、2回目は武器取得
    mockSupabase.from
      .mockReturnValueOnce(mockSupabase) // シナリオ取得用
      .mockReturnValueOnce(mockWeaponQuery) // 武器取得用

    const request = new NextRequest('http://localhost:3000/api/og/scenario/TEST123')
    const params = Promise.resolve({ id: 'TEST123' })

    const response = await GET(request, { params })
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/png')
  })

  it('エラーが発生した場合は500を返す', async () => {
    ;(createClient as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Database error')
    )

    const request = new NextRequest('http://localhost:3000/api/og/scenario/TEST123')
    const params = Promise.resolve({ id: 'TEST123' })

    const response = await GET(request, { params })
    expect(response.status).toBe(500)
  })
})


import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../weapons/route'
import { createClient } from '@/lib/supabase/server'

// モック設定
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}))

describe('GET /api/weapons', () => {
  const createMockQueryBuilder = () => {
    const builder = {
      from: vi.fn(() => builder),
      select: vi.fn(() => builder),
      order: vi.fn(() => builder),
    }
    return builder
  }

  const mockQueryBuilder = createMockQueryBuilder()

  const mockSupabase = {
    from: vi.fn(() => mockQueryBuilder),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryBuilder.from = vi.fn(() => mockQueryBuilder)
    mockQueryBuilder.select = vi.fn(() => mockQueryBuilder)
    mockQueryBuilder.order = vi.fn(() => Promise.resolve({
      data: [],
      error: null,
    }))

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  it('returns weapons list successfully', async () => {
    const mockWeapons = [
      { id: 1, name: 'スプラシューター', icon_url: 'https://example.com/weapon1.png' },
      { id: 2, name: 'スプラチャージャー', icon_url: 'https://example.com/weapon2.png' },
      { id: 3, name: 'スプラローラー', icon_url: null },
    ]

    mockQueryBuilder.order = vi.fn().mockResolvedValue({
      data: mockWeapons,
      error: null,
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockWeapons)
    expect(mockSupabase.from).toHaveBeenCalledWith('m_weapons')
    expect(mockQueryBuilder.select).toHaveBeenCalledWith('id, name, icon_url')
    expect(mockQueryBuilder.order).toHaveBeenCalledWith('name')
  })

  it('returns empty array when no weapons exist', async () => {
    mockQueryBuilder.order = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
  })

  it('returns 500 when database error occurs', async () => {
    mockQueryBuilder.order = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('武器一覧の取得に失敗しました')
  })

  it('handles unexpected errors', async () => {
    vi.mocked(createClient).mockRejectedValue(new Error('Unexpected error'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Unexpected error')
  })
})


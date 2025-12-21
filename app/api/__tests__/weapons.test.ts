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
  const mockSupabase = {
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  it('returns weapons list successfully', async () => {
    const mockWeapons = [
      { id: 1, name: 'スプラシューター', icon_url: 'https://example.com/weapon1.png' },
      { id: 2, name: 'スプラチャージャー', icon_url: 'https://example.com/weapon2.png' },
      { id: 3, name: 'スプラローラー', icon_url: null },
    ]

    const createQueryResult = (result: any) => {
      return {
        then: (resolve: (_value: any) => any) => resolve(result),
        catch: (_reject: (_error: any) => any) => _reject,
      }
    }

    const weaponsQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue(
        createQueryResult({
          data: mockWeapons,
          error: null,
        })
      ),
    }

    mockSupabase.from.mockReturnValue(weaponsQuery)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockWeapons)
    expect(mockSupabase.from).toHaveBeenCalledWith('m_weapons')
    expect(weaponsQuery.select).toHaveBeenCalledWith('id, name, icon_url')
    expect(weaponsQuery.order).toHaveBeenCalledWith('name')
  })

  it('returns empty array when no weapons exist', async () => {
    const createQueryResult = (result: any) => {
      return {
        then: (resolve: (_value: any) => any) => resolve(result),
        catch: (_reject: (_error: any) => any) => _reject,
      }
    }

    const weaponsQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue(
        createQueryResult({
          data: [],
          error: null,
        })
      ),
    }

    mockSupabase.from.mockReturnValue(weaponsQuery)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
  })

  it('returns 500 when database error occurs', async () => {
    const createQueryResult = (result: any) => {
      return {
        then: (resolve: (_value: any) => any) => resolve(result),
        catch: (_reject: (_error: any) => any) => _reject,
      }
    }

    const weaponsQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue(
        createQueryResult({
          data: null,
          error: { message: 'Database error' },
        })
      ),
    }

    mockSupabase.from.mockReturnValue(weaponsQuery)

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


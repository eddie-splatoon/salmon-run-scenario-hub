import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../stages/route'
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

describe('GET /api/stages', () => {
  const mockSupabase = {
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  it('returns stages list successfully', async () => {
    const mockStages = [
      { id: 1, name: 'アラマキ砦' },
      { id: 2, name: '難破船ドン・ブラコ' },
      { id: 3, name: '海上集落シャケト場' },
    ]

    const createQueryResult = (result: any) => {
      return {
        then: (resolve: (_value: any) => any) => resolve(result),
        catch: (_reject: (_error: any) => any) => _reject,
      }
    }

    const stagesQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue(
        createQueryResult({
          data: mockStages,
          error: null,
        })
      ),
    }

    mockSupabase.from.mockReturnValue(stagesQuery)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockStages)
    expect(mockSupabase.from).toHaveBeenCalledWith('m_stages')
    expect(stagesQuery.select).toHaveBeenCalledWith('id, name')
    expect(stagesQuery.order).toHaveBeenCalledWith('name')
  })

  it('returns empty array when no stages exist', async () => {
    const createQueryResult = (result: any) => {
      return {
        then: (resolve: (_value: any) => any) => resolve(result),
        catch: (_reject: (_error: any) => any) => _reject,
      }
    }

    const stagesQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue(
        createQueryResult({
          data: [],
          error: null,
        })
      ),
    }

    mockSupabase.from.mockReturnValue(stagesQuery)

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

    const stagesQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue(
        createQueryResult({
          data: null,
          error: { message: 'Database error' },
        })
      ),
    }

    mockSupabase.from.mockReturnValue(stagesQuery)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('ステージ一覧の取得に失敗しました')
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


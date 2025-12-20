import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../profile/stats/route'
import { createClient } from '@/lib/supabase/server'

// Supabaseクライアントをモック
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('GET /api/profile/stats', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  it('should return statistics data successfully', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    // ユーザーの投稿データ
    const mockScenarios = [
      { total_golden_eggs: 100, stage_id: 1 },
      { total_golden_eggs: 150, stage_id: 1 },
      { total_golden_eggs: 120, stage_id: 2 },
    ]

    // ステージ統計データ
    const mockStageStats = [
      { stage_id: 1, m_stages: { name: 'ステージ1' } },
      { stage_id: 1, m_stages: { name: 'ステージ1' } },
      { stage_id: 2, m_stages: { name: 'ステージ2' } },
    ]

    // いいねデータ
    const mockLikes = [{ scenario_code: 'CODE1' }, { scenario_code: 'CODE2' }]

    // いいねしたシナリオの詳細
    const mockLikedScenarios = [
      {
        code: 'CODE1',
        stage_id: 1,
        danger_rate: 100,
        total_golden_eggs: 150,
        created_at: '2024-01-01T00:00:00Z',
        m_stages: { name: 'ステージ1' },
      },
    ]

    // 武器情報
    const mockWeapons = [
      {
        scenario_code: 'CODE1',
        weapon_id: 1,
        display_order: 1,
        m_weapons: { id: 1, name: '武器1', icon_url: null },
      },
    ]

    // from()のチェーンをモック
    const mockSelect = vi.fn().mockReturnThis()
    const mockEq = vi.fn().mockReturnThis()
    const mockIn = vi.fn().mockReturnThis()
    const mockOrder = vi.fn().mockReturnThis()

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'scenarios') {
        const selectMock = vi.fn().mockImplementation((query?: string) => {
          if (!query) {
            // total_golden_eggs, stage_idのクエリ
            return {
              data: mockScenarios,
              error: null,
            }
          }
          if (query.includes('m_stages!inner')) {
            // ステージ統計のクエリ
            return {
              data: mockStageStats,
              error: null,
            }
          }
          if (query.includes('m_stages!inner') && query.includes('code')) {
            // いいねしたシナリオの詳細のクエリ
            return {
              data: mockLikedScenarios,
              error: null,
            }
          }
          return { data: null, error: null }
        })
        return {
          select: selectMock,
          eq: mockEq,
          in: mockIn,
          order: mockOrder,
        }
      }
      if (table === 'likes') {
        const selectMock = vi.fn().mockReturnValue({
          eq: mockEq.mockReturnValue({
            order: mockOrder.mockResolvedValue({
              data: mockLikes,
              error: null,
            }),
          }),
        })
        return {
          select: selectMock,
        }
      }
      if (table === 'scenario_weapons') {
        const selectMock = vi.fn().mockResolvedValue({
          data: mockWeapons,
          error: null,
        })
        return {
          select: selectMock,
          in: mockIn,
          order: mockOrder,
        }
      }
      return {
        select: mockSelect,
        eq: mockEq,
        in: mockIn,
        order: mockOrder,
      }
    })

    // eq()の戻り値を適切に設定
    mockEq.mockImplementation(() => {
      return {
        data: mockScenarios,
        error: null,
      }
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
    expect(data.data?.total_scenarios).toBe(3)
    expect(data.data?.average_golden_eggs).toBeCloseTo(123.3, 1)
    expect(data.data?.max_golden_eggs).toBe(150)
  })

  it('should return 401 when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('認証が必要です')
  })

  it('should handle empty scenarios', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const mockSelect = vi.fn().mockReturnThis()
    const mockEq = vi.fn().mockImplementation(() => ({
      data: [],
      error: null,
    }))

    mockSupabase.from.mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq,
      }),
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data?.total_scenarios).toBe(0)
    expect(data.data?.average_golden_eggs).toBe(0)
    expect(data.data?.max_golden_eggs).toBe(0)
    expect(data.data?.stage_stats).toEqual([])
    expect(data.data?.liked_scenarios).toEqual([])
  })
})


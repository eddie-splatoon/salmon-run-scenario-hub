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

  // Promiseを返すオブジェクトを作成（thenable）
  const createQueryResult = (result: any) => {
    return {
      then: (resolve: (_value: any) => any) => resolve(result),
      catch: (_reject: (_error: any) => any) => _reject,
    }
  }

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

    // 1回目: scenarios - 投稿データ取得（total_golden_eggs, stage_id）
    const scenariosQuery1 = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue(
        createQueryResult({
          data: mockScenarios,
          error: null,
        })
      ),
    }

    // 2回目: scenarios - ステージ統計取得（stage_id, m_stages!inner(name)）
    const scenariosQuery2 = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue(
        createQueryResult({
          data: mockStageStats,
          error: null,
        })
      ),
    }

    // 3回目: scenarios - いいねしたシナリオ詳細取得
    const scenariosQuery3 = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue(
        createQueryResult({
          data: mockLikedScenarios,
          error: null,
        })
      ),
    }

    // likes - いいねデータ取得
    const likesQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue(
        createQueryResult({
          data: mockLikes,
          error: null,
        })
      ),
    }

    // scenario_weapons - 武器情報取得（orderが2回呼ばれる）
    const weaponsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    }

    // order()は2回呼ばれる（scenario_code, display_order）
    weaponsQuery.order
      .mockReturnValueOnce(weaponsQuery) // 1回目はthisを返す
      .mockReturnValue(
        createQueryResult({
          data: mockWeapons,
          error: null,
        })
      ) // 2回目は結果を返す

    // カウンターを各テストケースでリセット
    let scenariosCallCount = 0
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'scenarios') {
        scenariosCallCount++
        if (scenariosCallCount === 1) {
          return scenariosQuery1
        }
        if (scenariosCallCount === 2) {
          return scenariosQuery2
        }
        // 3回目以降はscenariosQuery3を返す
        return scenariosQuery3
      }
      if (table === 'likes') {
        return likesQuery
      }
      if (table === 'scenario_weapons') {
        return weaponsQuery
      }
      return scenariosQuery1
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
    expect(data.data?.total_scenarios).toBe(3)
    expect(data.data?.average_golden_eggs).toBeCloseTo(123.3, 1)
    expect(data.data?.max_golden_eggs).toBe(150)
    expect(data.data?.stage_stats).toHaveLength(2)
    expect(data.data?.liked_scenarios).toHaveLength(1)
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

    // 1回目: scenarios - 投稿データ取得
    const scenariosQuery1 = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue(
        createQueryResult({
          data: [],
          error: null,
        })
      ),
    }

    // 2回目: scenarios - ステージ統計取得
    const scenariosQuery2 = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue(
        createQueryResult({
          data: [],
          error: null,
        })
      ),
    }

    // likes - いいねデータ取得（空配列）
    const likesQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue(
        createQueryResult({
          data: [],
          error: null,
        })
      ),
    }

    // カウンターを各テストケースでリセット（いいねがないので3回目は呼ばれない）
    let scenariosCallCount = 0
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'scenarios') {
        scenariosCallCount++
        if (scenariosCallCount === 1) {
          return scenariosQuery1
        }
        // 2回目以降はscenariosQuery2を返す（3回目は呼ばれない）
        return scenariosQuery2
      }
      if (table === 'likes') {
        return likesQuery
      }
      return scenariosQuery1
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

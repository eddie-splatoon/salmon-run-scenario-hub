import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../scenarios/route'
import { createClient } from '@/lib/supabase/server'

// Supabaseクライアントをモック
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('GET /api/scenarios', () => {
  const mockSupabase = {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  it('should return empty array when no scenarios exist', async () => {
    // Promiseを返すオブジェクトを作成（thenable）
    const createQueryResult = (result: any) => {
      return {
        then: (resolve: (_value: any) => any) => resolve(result),
        catch: (_reject: (_error: any) => any) => _reject,
      }
    }

    const scenariosQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
    }

    // order()の後にawaitされるので、thenableオブジェクトを返す
    scenariosQuery.order.mockReturnValue(
      createQueryResult({
        data: [],
        error: null,
      })
    )

    const weaponsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue(
        createQueryResult({
          data: [],
          error: null,
        })
      ),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'scenarios') {
        return scenariosQuery
      }
      if (table === 'scenario_weapons') {
        return weaponsQuery
      }
      return scenariosQuery
    })

    const request = new NextRequest('http://localhost:3000/api/scenarios')
    const response = await GET(request)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
  })

  it('should filter by stage_id', async () => {
    // Promiseを返すオブジェクトを作成（thenable）
    const createQueryResult = (result: any) => {
      return {
        then: (resolve: (_value: any) => any) => resolve(result),
        catch: (_reject: (_error: any) => any) => _reject,
      }
    }

    const queryResult = createQueryResult({
      data: [
        {
          code: 'ABC123',
          stage_id: 1,
          danger_rate: 100,
          total_golden_eggs: 150,
          created_at: '2024-01-01T00:00:00Z',
          m_stages: { name: 'アラマキ砦' },
        },
      ],
      error: null,
    })

    const scenariosQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn(),
      gte: vi.fn().mockReturnThis(),
    }

    // eq()が呼ばれた後、awaitされるので、thenableオブジェクトを返す
    scenariosQuery.eq.mockReturnValue(queryResult)

    const weaponsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn(),
    }

    // order()は1回目はthisを返し、2回目はthenableを返す
    weaponsQuery.order
      .mockReturnValueOnce(weaponsQuery)
      .mockReturnValue(
        createQueryResult({
          data: [],
          error: null,
        })
      )

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'scenarios') {
        return scenariosQuery
      }
      if (table === 'scenario_weapons') {
        return weaponsQuery
      }
      return scenariosQuery
    })

    const request = new NextRequest('http://localhost:3000/api/scenarios?stage_id=1')
    const response = await GET(request)
    const data = await response.json()

    expect(scenariosQuery.eq).toHaveBeenCalledWith('stage_id', 1)
    expect(data.success).toBe(true)
  })

  it('should filter by min_danger_rate', async () => {
    // Promiseを返すオブジェクトを作成（thenable）
    const createQueryResult = (result: any) => {
      return {
        then: (resolve: (_value: any) => any) => resolve(result),
        catch: (_reject: (_error: any) => any) => _reject,
      }
    }

    const scenariosQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
    }

    // gte()が呼ばれた後、awaitされるので、thenableオブジェクトを返す
    scenariosQuery.gte.mockReturnValue(
      createQueryResult({
        data: [],
        error: null,
      })
    )

    const weaponsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue(
        createQueryResult({
          data: [],
          error: null,
        })
      ),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'scenarios') {
        return scenariosQuery
      }
      if (table === 'scenario_weapons') {
        return weaponsQuery
      }
      return scenariosQuery
    })

    const request = new NextRequest('http://localhost:3000/api/scenarios?min_danger_rate=200')
    const response = await GET(request)
    const data = await response.json()

    expect(scenariosQuery.gte).toHaveBeenCalledWith('danger_rate', 200)
    expect(data.success).toBe(true)
  })

  it('should filter by weapon_ids (all weapons must be included)', async () => {
    // Promiseを返すオブジェクトを作成（thenable）
    const createQueryResult = (result: any) => {
      return {
        then: (resolve: (_value: any) => any) => resolve(result),
        catch: (_reject: (_error: any) => any) => _reject,
      }
    }

    const scenariosQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
    }

    // order()の後にawaitされるので、thenableオブジェクトを返す
    scenariosQuery.order.mockReturnValue(
      createQueryResult({
        data: [
          {
            code: 'ABC123',
            stage_id: 1,
            danger_rate: 100,
            total_golden_eggs: 150,
            created_at: '2024-01-01T00:00:00Z',
            m_stages: { name: 'アラマキ砦' },
          },
          {
            code: 'DEF456',
            stage_id: 1,
            danger_rate: 200,
            total_golden_eggs: 200,
            created_at: '2024-01-02T00:00:00Z',
            m_stages: { name: 'アラマキ砦' },
          },
        ],
        error: null,
      })
    )

    const weaponsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    }

    const wavesQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'scenarios') {
        return scenariosQuery
      }
      if (table === 'scenario_weapons') {
        return weaponsQuery
      }
      if (table === 'scenario_waves') {
        return wavesQuery
      }
      return scenariosQuery
    })

    // ABC123には武器1と2の両方がある
    // DEF456には武器1のみがある
    weaponsQuery.in.mockReturnThis()
    // orderが2回呼ばれる（scenario_codeとdisplay_order）
    // 1回目はthisを返し、2回目は結果を返す
    weaponsQuery.order
      .mockReturnValueOnce(weaponsQuery)
      .mockReturnValue(
        createQueryResult({
          data: [
            {
              scenario_code: 'ABC123',
              weapon_id: 1,
              display_order: 1,
              m_weapons: { id: 1, name: 'スプラシューター', icon_url: null },
            },
            {
              scenario_code: 'ABC123',
              weapon_id: 2,
              display_order: 2,
              m_weapons: { id: 2, name: 'スプラローラー', icon_url: null },
            },
            {
              scenario_code: 'DEF456',
              weapon_id: 1,
              display_order: 1,
              m_weapons: { id: 1, name: 'スプラシューター', icon_url: null },
            },
          ],
          error: null,
        })
      )

    // 武器1と2の両方を指定した場合、ABC123のみが返されるべき
    const request = new NextRequest('http://localhost:3000/api/scenarios?weapon_ids=1,2')
    const response = await GET(request)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
    expect(data.data).toHaveLength(1)
    // ABC123のみが返される（武器1と2の両方を含む）
    expect(data.data[0].code).toBe('ABC123')
    // DEF456は返されない（武器1のみで、武器2を含まない）
    expect(data.data.find((s: { code: string }) => s.code === 'DEF456')).toBeUndefined()
  })

  it('should return error when database query fails', async () => {
    // Promiseを返すオブジェクトを作成（thenable）
    const createQueryResult = (result: any) => {
      return {
        then: (resolve: (_value: any) => any) => resolve(result),
        catch: (_reject: (_error: any) => any) => _reject,
      }
    }

    const scenariosQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue(
        createQueryResult({
          data: null,
          error: { message: 'Database error' },
        })
      ),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
    }

    const weaponsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue(
        createQueryResult({
          data: [],
          error: null,
        })
      ),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'scenarios') {
        return scenariosQuery
      }
      if (table === 'scenario_weapons') {
        return weaponsQuery
      }
      return scenariosQuery
    })

    const request = new NextRequest('http://localhost:3000/api/scenarios')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toContain('シナリオ一覧の取得に失敗しました')
  })

  it.skip('should filter by max_danger (danger_rate = 333)', async () => {
    // Promiseを返すオブジェクトを作成（thenable）
    const createQueryResult = (result: any) => {
      return {
        then: (resolve: (_value: any) => any) => resolve(result),
        catch: (_reject: (_error: any) => any) => _reject,
      }
    }

    const queryResult = createQueryResult({
      data: [
        {
          code: 'ABC123',
          stage_id: 1,
          danger_rate: 333,
          total_golden_eggs: 200,
          created_at: '2024-01-01T00:00:00Z',
          m_stages: { name: 'アラマキ砦' },
        },
      ],
      error: null,
    })

    const scenariosQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn(),
      gte: vi.fn().mockReturnThis(),
    }

    // eq()が呼ばれた後、awaitされるので、thenableオブジェクトを返す
    scenariosQuery.eq.mockReturnValue(queryResult)

    const weaponsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn(),
    }

    // order()は1回目はthisを返し、2回目はthenableを返す
    weaponsQuery.order
      .mockReturnValueOnce(weaponsQuery)
      .mockReturnValue(
        createQueryResult({
          data: [],
          error: null,
        })
      )

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'scenarios') {
        return scenariosQuery
      }
      if (table === 'scenario_weapons') {
        return weaponsQuery
      }
      return scenariosQuery
    })

    const request = new NextRequest('http://localhost:3000/api/scenarios?filter=max_danger')
    const response = await GET(request)
    const data = await response.json()

    expect(scenariosQuery.eq).toHaveBeenCalledWith('danger_rate', 333)
    expect(data.success).toBe(true)
  })

  it.skip('should filter by grizzco weapons', async () => {
    // Promiseを返すオブジェクトを作成（thenable）
    const createQueryResult = (result: any) => {
      return {
        then: (resolve: (_value: any) => any) => resolve(result),
        catch: (_reject: (_error: any) => any) => _reject,
      }
    }

    const scenariosQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
    }

    // order()の後にawaitされるので、thenableオブジェクトを返す
    scenariosQuery.order.mockReturnValue(
      createQueryResult({
        data: [
          {
            code: 'ABC123',
            stage_id: 1,
            danger_rate: 100,
            total_golden_eggs: 150,
            created_at: '2024-01-01T00:00:00Z',
            m_stages: { name: 'アラマキ砦' },
          },
          {
            code: 'DEF456',
            stage_id: 1,
            danger_rate: 200,
            total_golden_eggs: 200,
            created_at: '2024-01-02T00:00:00Z',
            m_stages: { name: 'アラマキ砦' },
          },
        ],
        error: null,
      })
    )

    const weaponsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn(),
    }

    // ABC123にはクマサン武器（ID: 10）がある
    // DEF456にはクマサン武器がない
    weaponsQuery.in.mockReturnThis()
    weaponsQuery.order
      .mockReturnValueOnce(weaponsQuery)
      .mockReturnValue(
        createQueryResult({
          data: [
            {
              scenario_code: 'ABC123',
              weapon_id: 10, // クマサン武器
              display_order: 1,
              m_weapons: { id: 10, name: 'クマサン印の武器', icon_url: null },
            },
            {
              scenario_code: 'DEF456',
              weapon_id: 1, // 通常武器
              display_order: 1,
              m_weapons: { id: 1, name: 'スプラシューター', icon_url: null },
            },
          ],
          error: null,
        })
      )

    // クマサン武器を取得するクエリをモック
    const grizzcoWeaponsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn(),
    }

    grizzcoWeaponsQuery.eq.mockReturnValue(
      createQueryResult({
        data: [{ id: 10 }],
        error: null,
      })
    )

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'scenarios') {
        return scenariosQuery
      }
      if (table === 'scenario_weapons') {
        return weaponsQuery
      }
      if (table === 'm_weapons') {
        return grizzcoWeaponsQuery
      }
      return scenariosQuery
    })

    const request = new NextRequest('http://localhost:3000/api/scenarios?filter=grizzco')
    const response = await GET(request)
    const data = await response.json()

    expect(grizzcoWeaponsQuery.eq).toHaveBeenCalledWith('is_grizzco_weapon', true)
    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
    // ABC123のみが返される（クマサン武器を含む）
    expect(data.data).toHaveLength(1)
    expect(data.data[0].code).toBe('ABC123')
  })
})


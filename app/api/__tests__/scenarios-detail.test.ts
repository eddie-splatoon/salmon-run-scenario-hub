import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../scenarios/[id]/route'
import { POST as POST_LIKE } from '../scenarios/[id]/likes/route'
import { GET as GET_COMMENTS, POST as POST_COMMENT } from '../scenarios/[id]/comments/route'
import { createClient } from '@/lib/supabase/server'

// Supabaseクライアントをモック
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('GET /api/scenarios/[id]', () => {
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

  it('should return scenario detail', async () => {
    const createQueryResult = (result: any) => {
      return {
        then: (resolve: (_value: any) => any) => resolve(result),
        catch: (_reject: (_error: any) => any) => _reject,
      }
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const scenarioQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnValue(
        createQueryResult({
          data: {
            code: 'ABC123',
            stage_id: 1,
            danger_rate: 100,
            total_golden_eggs: 150,
            total_power_eggs: 200,
            created_at: '2024-01-01T00:00:00Z',
            m_stages: { name: 'アラマキ砦' },
          },
          error: null,
        })
      ),
    }

    const wavesQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue(
        createQueryResult({
          data: [
            {
              wave_number: 1,
              tide: 'normal',
              event: null,
              delivered_count: 50,
              quota: 50,
              cleared: true,
            },
          ],
          error: null,
        })
      ),
    }

    const weaponsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue(
        createQueryResult({
          data: [
            {
              weapon_id: 1,
              display_order: 1,
              m_weapons: { id: 1, name: 'スプラシューター', icon_url: null },
            },
          ],
          error: null,
        })
      ),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'scenarios') return scenarioQuery
      if (table === 'scenario_waves') return wavesQuery
      if (table === 'scenario_weapons') return weaponsQuery
      if (table === 'likes') {
        // count用とselect用で異なるオブジェクトを返す
        const query = {
          select: vi.fn(),
          eq: vi.fn(),
          single: vi.fn(),
        }
        // count用のメソッドチェーン（select('*', { count: 'exact', head: true }).eq()でcountを返す）
        const countEq = {
          then: (resolve: (value: any) => any) => resolve({ count: 5, error: null }),
          catch: () => {},
        }
        // select().eq().eq().single()用のチェーン
        const secondEq = {
          single: vi.fn().mockReturnValue(
            createQueryResult({
              data: null,
              error: { code: 'PGRST116' },
            })
          ),
        }
        const firstEq = {
          eq: vi.fn().mockReturnValue(secondEq),
        }
        const selectResult = {
          eq: vi.fn().mockReturnValue(firstEq),
        }
        // select()が呼ばれたときに、引数に応じて適切な値を返す
        query.select.mockImplementation((columns?: string, options?: any) => {
          // count用（select('*', { count: 'exact', head: true })）
          if (options && options.count === 'exact') {
            return {
              eq: vi.fn().mockReturnValue(countEq),
            }
          }
          // select().eq().eq().single()用
          return selectResult
        })
        return query
      }
      if (table === 'comments') {
        const countEq = {
          then: (resolve: (value: any) => any) => resolve({ count: 3, error: null }),
          catch: () => {},
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue(countEq),
          }),
        }
      }
      return scenarioQuery
    })

    const request = new NextRequest('http://localhost:3000/api/scenarios/ABC123')
    const response = await GET(request, { params: Promise.resolve({ id: 'ABC123' }) })
    const data = await response.json()

    if (!data.success) {
      console.error('API Error:', data.error)
    }
    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
    expect(data.data.code).toBe('ABC123')
    expect(data.data.stage_name).toBe('アラマキ砦')
    expect(data.data.waves).toHaveLength(1)
    expect(data.data.weapons).toHaveLength(1)
  })

  it('should return 404 when scenario not found', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const scenarioQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnValue(
        Promise.resolve({
          data: null,
          error: { message: 'Not found' },
        })
      ),
    }

    mockSupabase.from.mockReturnValue(scenarioQuery)

    const request = new NextRequest('http://localhost:3000/api/scenarios/INVALID')
    const response = await GET(request, { params: Promise.resolve({ id: 'INVALID' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toBe('シナリオが見つかりません')
  })
})

describe('POST /api/scenarios/[id]/likes', () => {
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

  it('should add like when not liked', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const scenarioQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnValue(
        Promise.resolve({
          data: { code: 'ABC123' },
          error: null,
        })
      ),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'scenarios') return scenarioQuery
      if (table === 'likes') {
        const query = {
          select: vi.fn(),
          eq: vi.fn(),
          single: vi.fn(),
          insert: vi.fn().mockReturnValue(Promise.resolve({ error: null })),
          delete: vi.fn().mockReturnThis(),
        }
        // count用のメソッドチェーン（select('*', { count: 'exact', head: true }).eq()でcountを返す）
        const countEq = {
          then: (resolve: (value: any) => any) => resolve({ count: 1, error: null }),
          catch: () => {},
        }
        // select().eq().eq().single()用のチェーン
        const secondEq = {
          single: vi.fn().mockReturnValue(
            Promise.resolve({
              data: null,
              error: { code: 'PGRST116' },
            })
          ),
        }
        const firstEq = {
          eq: vi.fn().mockReturnValue(secondEq),
        }
        const selectResult = {
          eq: vi.fn().mockReturnValue(firstEq),
        }
        // select()が呼ばれたときに、引数に応じて適切な値を返す
        query.select.mockImplementation((columns?: string, options?: any) => {
          // count用（select('*', { count: 'exact', head: true })）
          if (options && options.count === 'exact') {
            return {
              eq: vi.fn().mockReturnValue(countEq),
            }
          }
          // select().eq().eq().single()用
          return selectResult
        })
        return query
      }
      return scenarioQuery
    })

    const request = new NextRequest('http://localhost:3000/api/scenarios/ABC123/likes', {
      method: 'POST',
    })
    const response = await POST_LIKE(request, { params: Promise.resolve({ id: 'ABC123' }) })
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data.is_liked).toBe(true)
    expect(data.data.like_count).toBe(1)
  })

  it('should return 401 when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const request = new NextRequest('http://localhost:3000/api/scenarios/ABC123/likes', {
      method: 'POST',
    })
    const response = await POST_LIKE(request, { params: Promise.resolve({ id: 'ABC123' }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('認証が必要です')
  })
})

describe('GET /api/scenarios/[id]/comments', () => {
  const mockSupabase = {
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  it('should return comments', async () => {
    const createQueryResult = (result: any) => {
      return {
        then: (resolve: (_value: any) => any) => resolve(result),
        catch: (_reject: (_error: any) => any) => _reject,
      }
    }

    const scenarioQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnValue(
        createQueryResult({
          data: { code: 'ABC123' },
          error: null,
        })
      ),
    }

    const commentsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue(
        createQueryResult({
          data: [
            {
              id: 1,
              user_id: 'user-123',
              content: 'テストコメント',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
          ],
          error: null,
        })
      ),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'scenarios') return scenarioQuery
      if (table === 'comments') return commentsQuery
      return scenarioQuery
    })

    const request = new NextRequest('http://localhost:3000/api/scenarios/ABC123/comments')
    const response = await GET_COMMENTS(request, { params: Promise.resolve({ id: 'ABC123' }) })
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
    expect(data.data).toHaveLength(1)
    expect(data.data[0].content).toBe('テストコメント')
  })
})

describe('POST /api/scenarios/[id]/comments', () => {
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

  it('should create comment', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const scenarioQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnValue(
        Promise.resolve({
          data: { code: 'ABC123' },
          error: null,
        })
      ),
    }

    const commentsQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnValue(
        Promise.resolve({
          data: {
            id: 1,
            user_id: 'user-123',
            content: 'テストコメント',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        })
      ),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'scenarios') return scenarioQuery
      if (table === 'comments') return commentsQuery
      return scenarioQuery
    })

    const request = new NextRequest('http://localhost:3000/api/scenarios/ABC123/comments', {
      method: 'POST',
      body: JSON.stringify({ content: 'テストコメント' }),
    })
    const response = await POST_COMMENT(request, { params: Promise.resolve({ id: 'ABC123' }) })
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
    expect(data.data.content).toBe('テストコメント')
  })

  it('should return 400 when content is empty', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/scenarios/ABC123/comments', {
      method: 'POST',
      body: JSON.stringify({ content: '' }),
    })
    const response = await POST_COMMENT(request, { params: Promise.resolve({ id: 'ABC123' }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })
})


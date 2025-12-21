import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('/api/scenarios/[id]/likes', () => {
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

  describe('POST', () => {
    it('adds a like for authenticated user', async () => {
      const scenarioCode = 'ABC123'
      const mockUser = { id: 'user1' }

      const mockAuth = {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      }

      const mockScenarioQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { code: scenarioCode },
          error: null,
        }),
      }

      const mockLikesQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // Not found
        }),
        insert: vi.fn().mockResolvedValue({
          error: null,
        }),
      }

      const mockCountQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          count: 1,
          error: null,
        }),
      }

      mockSupabase.auth = mockAuth
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'scenarios') return mockScenarioQuery
        if (table === 'likes') {
          // 最初の呼び出しは既存のいいねを確認、2回目はカウント
          let callCount = 0
          return {
            from: vi.fn().mockReturnThis(),
            select: vi.fn(() => {
              callCount++
              if (callCount === 1) {
                return mockLikesQuery
              }
              return mockCountQuery
            }),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return { from: vi.fn() }
      })

      const request = new NextRequest(`http://localhost/api/scenarios/${scenarioCode}/likes`, {
        method: 'POST',
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: scenarioCode }),
      })

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data?.is_liked).toBe(true)
    })

    it('removes a like if already liked', async () => {
      const scenarioCode = 'ABC123'
      const mockUser = { id: 'user1' }

      const mockAuth = {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      }

      const mockScenarioQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { code: scenarioCode },
          error: null,
        }),
      }

      const mockLikesQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 1 },
          error: null,
        }),
        delete: vi.fn().mockReturnThis(),
      }

      const mockCountQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          count: 0,
          error: null,
        }),
      }

      mockSupabase.auth = mockAuth
      let likesCallCount = 0
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'scenarios') return mockScenarioQuery
        if (table === 'likes') {
          return {
            from: vi.fn().mockReturnThis(),
            select: vi.fn(() => {
              likesCallCount++
              if (likesCallCount === 1) {
                return mockLikesQuery
              }
              return mockCountQuery
            }),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 1 },
              error: null,
            }),
            delete: vi.fn().mockReturnThis(),
          }
        }
        return { from: vi.fn() }
      })

      const request = new NextRequest(`http://localhost/api/scenarios/${scenarioCode}/likes`, {
        method: 'POST',
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: scenarioCode }),
      })

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data?.is_liked).toBe(false)
    })

    it('returns 401 for unauthenticated user', async () => {
      const scenarioCode = 'ABC123'

      const mockAuth = {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' },
        }),
      }

      mockSupabase.auth = mockAuth

      const request = new NextRequest(`http://localhost/api/scenarios/${scenarioCode}/likes`, {
        method: 'POST',
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: scenarioCode }),
      })

      const data = await response.json()
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('認証が必要です')
    })

    it('returns 404 for non-existent scenario', async () => {
      const scenarioCode = 'INVALID'
      const mockUser = { id: 'user1' }

      const mockAuth = {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      }

      const mockScenarioQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      }

      mockSupabase.auth = mockAuth
      mockSupabase.from = vi.fn(() => mockScenarioQuery)

      const request = new NextRequest(`http://localhost/api/scenarios/${scenarioCode}/likes`, {
        method: 'POST',
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: scenarioCode }),
      })

      const data = await response.json()
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toContain('シナリオが見つかりません')
    })
  })
})


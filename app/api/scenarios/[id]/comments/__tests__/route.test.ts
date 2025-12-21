import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('/api/scenarios/[id]/comments', () => {
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

  describe('GET', () => {
    it('returns comments for a valid scenario', async () => {
      const scenarioCode = 'ABC123'
      const mockComments = [
        {
          id: 1,
          user_id: 'user1',
          content: 'Test comment',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ]

      const mockScenarioQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { code: scenarioCode },
          error: null,
        }),
      }

      const mockCommentsQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockComments,
          error: null,
        }),
      }

      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'scenarios') return mockScenarioQuery
        if (table === 'comments') return mockCommentsQuery
        return { from: vi.fn() }
      })

      const request = new NextRequest(`http://localhost/api/scenarios/${scenarioCode}/comments`)
      const response = await GET(request, {
        params: Promise.resolve({ id: scenarioCode }),
      })

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockComments)
    })

    it('returns 404 for non-existent scenario', async () => {
      const scenarioCode = 'INVALID'

      const mockScenarioQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      }

      mockSupabase.from = vi.fn(() => mockScenarioQuery)

      const request = new NextRequest(`http://localhost/api/scenarios/${scenarioCode}/comments`)
      const response = await GET(request, {
        params: Promise.resolve({ id: scenarioCode }),
      })

      const data = await response.json()
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toContain('シナリオが見つかりません')
    })
  })

  describe('POST', () => {
    it('creates a comment for authenticated user', async () => {
      const scenarioCode = 'ABC123'
      const mockUser = { id: 'user1' }
      const commentContent = 'Test comment'

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

      const mockCommentsQuery = {
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 1,
            user_id: mockUser.id,
            content: commentContent,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        }),
      }

      mockSupabase.auth = mockAuth
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'scenarios') return mockScenarioQuery
        if (table === 'comments') return mockCommentsQuery
        return { from: vi.fn() }
      })

      const request = new NextRequest(`http://localhost/api/scenarios/${scenarioCode}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: commentContent }),
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: scenarioCode }),
      })

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data?.content).toBe(commentContent)
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

      const request = new NextRequest(`http://localhost/api/scenarios/${scenarioCode}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: 'Test' }),
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: scenarioCode }),
      })

      const data = await response.json()
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('認証が必要です')
    })

    it('returns 400 for invalid content', async () => {
      const scenarioCode = 'ABC123'
      const mockUser = { id: 'user1' }

      const mockAuth = {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      }

      mockSupabase.auth = mockAuth

      const request = new NextRequest(`http://localhost/api/scenarios/${scenarioCode}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: '' }),
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: scenarioCode }),
      })

      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })
})


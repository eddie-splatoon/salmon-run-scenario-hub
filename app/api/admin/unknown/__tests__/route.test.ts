import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../route'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/utils/admin', () => ({
  requireAdmin: vi.fn(),
}))

describe('/api/admin/unknown', () => {
  const mockSupabase = {
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(requireAdmin).mockResolvedValue(undefined)
  })

  describe('GET', () => {
    it('returns unknown stages when type is stages', async () => {
      const mockStages = [
        {
          id: 1,
          name: 'Unknown Stage',
          detected_at: '2024-01-01T00:00:00Z',
          resolved_at: null,
        },
      ]

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockStages,
          error: null,
        }),
      }

      mockSupabase.from = vi.fn(() => mockQuery)

      const request = new NextRequest('http://localhost/api/admin/unknown?type=stages')
      const response = await GET(request)

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockStages)
      expect(mockSupabase.from).toHaveBeenCalledWith('unknown_stages')
    })

    it('returns unknown weapons when type is weapons', async () => {
      const mockWeapons = [
        {
          id: 1,
          name: 'Unknown Weapon',
          detected_at: '2024-01-01T00:00:00Z',
          resolved_at: null,
        },
      ]

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockWeapons,
          error: null,
        }),
      }

      mockSupabase.from = vi.fn(() => mockQuery)

      const request = new NextRequest('http://localhost/api/admin/unknown?type=weapons')
      const response = await GET(request)

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockWeapons)
      expect(mockSupabase.from).toHaveBeenCalledWith('unknown_weapons')
    })

    it('returns 400 when type parameter is missing', async () => {
      const request = new NextRequest('http://localhost/api/admin/unknown')
      const response = await GET(request)

      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('type parameter is required')
    })

    it('returns 403 when user is not admin', async () => {
      vi.mocked(requireAdmin).mockRejectedValue(new Error('Not admin'))

      const request = new NextRequest('http://localhost/api/admin/unknown?type=stages')
      const response = await GET(request)

      const data = await response.json()
      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
    })

    it('handles database errors', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }

      mockSupabase.from = vi.fn(() => mockQuery)

      const request = new NextRequest('http://localhost/api/admin/unknown?type=stages')
      const response = await GET(request)

      const data = await response.json()
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })
})


import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isAdmin, requireAdmin } from '../admin'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('admin utils', () => {
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

  describe('isAdmin', () => {
    it('should return true when user is admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'admin@example.com',
          },
        },
        error: null,
      })

      const adminsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { user_id: 'user-123' },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(adminsQuery)

      const result = await isAdmin()

      expect(result).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('admins')
      expect(adminsQuery.eq).toHaveBeenCalledWith('user_id', 'user-123')
    })

    it('should return false when user is not admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'user@example.com',
          },
        },
        error: null,
      })

      const adminsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(adminsQuery)

      const result = await isAdmin()

      expect(result).toBe(false)
    })

    it('should return false when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: null,
        },
        error: { message: 'Not authenticated' },
      })

      const result = await isAdmin()

      expect(result).toBe(false)
    })
  })

  describe('requireAdmin', () => {
    it('should not throw when user is admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'admin@example.com',
          },
        },
        error: null,
      })

      const adminsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { user_id: 'user-123' },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(adminsQuery)

      await expect(requireAdmin()).resolves.not.toThrow()
    })

    it('should throw when user is not admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'user@example.com',
          },
        },
        error: null,
      })

      const adminsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(adminsQuery)

      await expect(requireAdmin()).rejects.toThrow('管理者権限が必要です')
    })
  })
})


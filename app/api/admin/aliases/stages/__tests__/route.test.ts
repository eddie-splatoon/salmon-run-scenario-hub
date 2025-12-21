import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { DELETE } from '../[id]/route'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/utils/admin', () => ({
  requireAdmin: vi.fn(),
}))

describe('DELETE /api/admin/aliases/stages/[id]', () => {
  const mockSupabase = {
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(requireAdmin).mockResolvedValue(undefined)
  })

  it('should delete a stage alias', async () => {
    const aliasesQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    }

    mockSupabase.from.mockReturnValue(aliasesQuery)

    const request = new NextRequest('http://localhost:3000/api/admin/aliases/stages/1', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(aliasesQuery.delete).toHaveBeenCalled()
    expect(aliasesQuery.eq).toHaveBeenCalledWith('id', '1')
  })

  it('should return error when not admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('管理者権限が必要です'))

    const request = new NextRequest('http://localhost:3000/api/admin/aliases/stages/1', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error).toBe('管理者権限が必要です')
  })

  it('should return error when database delete fails', async () => {
    const aliasesQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Delete failed' },
      }),
    }

    mockSupabase.from.mockReturnValue(aliasesQuery)

    const request = new NextRequest('http://localhost:3000/api/admin/aliases/stages/1', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Delete failed')
  })
})


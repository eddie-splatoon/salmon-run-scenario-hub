import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '../[id]/route'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/utils/admin', () => ({
  requireAdmin: vi.fn(),
}))

describe('GET /api/admin/masters/weapons/[id]', () => {
  const mockSupabase = {
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(requireAdmin).mockResolvedValue(undefined)
  })

  it('should return weapon by id', async () => {
    const weaponsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 1, name: 'スプラシューター', icon_url: null, is_grizzco_weapon: false },
        error: null,
      }),
    }

    mockSupabase.from.mockReturnValue(weaponsQuery)

    const request = new NextRequest('http://localhost:3000/api/admin/masters/weapons/1')
    const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data.id).toBe(1)
    expect(data.data.name).toBe('スプラシューター')
  })

  it('should return error when not admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('管理者権限が必要です'))

    const request = new NextRequest('http://localhost:3000/api/admin/masters/weapons/1')
    const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error).toBe('管理者権限が必要です')
  })

  it('should return error when weapon not found', async () => {
    const weaponsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      }),
    }

    mockSupabase.from.mockReturnValue(weaponsQuery)

    const request = new NextRequest('http://localhost:3000/api/admin/masters/weapons/999')
    const response = await GET(request, { params: Promise.resolve({ id: '999' }) })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Not found')
  })
})

describe('PUT /api/admin/masters/weapons/[id]', () => {
  const mockSupabase = {
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(requireAdmin).mockResolvedValue(undefined)
  })

  it('should update a weapon', async () => {
    const weaponsQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 1,
          name: '更新された武器',
          icon_url: 'https://example.com/icon.png',
          is_grizzco_weapon: true,
        },
        error: null,
      }),
    }

    mockSupabase.from.mockReturnValue(weaponsQuery)

    const request = new NextRequest('http://localhost:3000/api/admin/masters/weapons/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '更新された武器',
        icon_url: 'https://example.com/icon.png',
        is_grizzco_weapon: true,
      }),
    })

    const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data.name).toBe('更新された武器')
    expect(data.data.icon_url).toBe('https://example.com/icon.png')
    expect(data.data.is_grizzco_weapon).toBe(true)
  })

  it('should return error when name is empty string', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/masters/weapons/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    })

    const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('name cannot be empty')
  })

  it('should return error when not admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('管理者権限が必要です'))

    const request = new NextRequest('http://localhost:3000/api/admin/masters/weapons/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '更新された武器' }),
    })

    const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error).toBe('管理者権限が必要です')
  })

  it('should return error when database update fails', async () => {
    const weaponsQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      }),
    }

    mockSupabase.from.mockReturnValue(weaponsQuery)

    const request = new NextRequest('http://localhost:3000/api/admin/masters/weapons/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '更新された武器' }),
    })

    const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Update failed')
  })
})

describe('DELETE /api/admin/masters/weapons/[id]', () => {
  const mockSupabase = {
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(requireAdmin).mockResolvedValue(undefined)
  })

  it('should delete a weapon', async () => {
    const weaponsQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    }

    mockSupabase.from.mockReturnValue(weaponsQuery)

    const request = new NextRequest('http://localhost:3000/api/admin/masters/weapons/1', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(weaponsQuery.delete).toHaveBeenCalled()
    expect(weaponsQuery.eq).toHaveBeenCalledWith('id', '1')
  })

  it('should return error when not admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('管理者権限が必要です'))

    const request = new NextRequest('http://localhost:3000/api/admin/masters/weapons/1', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error).toBe('管理者権限が必要です')
  })

  it('should return error when database delete fails', async () => {
    const weaponsQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Delete failed' },
      }),
    }

    mockSupabase.from.mockReturnValue(weaponsQuery)

    const request = new NextRequest('http://localhost:3000/api/admin/masters/weapons/1', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Delete failed')
  })
})


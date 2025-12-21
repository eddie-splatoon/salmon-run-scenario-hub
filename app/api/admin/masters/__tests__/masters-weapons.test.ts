import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '../weapons/route'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/utils/admin', () => ({
  requireAdmin: vi.fn(),
}))

describe('GET /api/admin/masters/weapons', () => {
  const mockSupabase = {
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(requireAdmin).mockResolvedValue(undefined)
  })

  it('should return weapons list', async () => {
    const weaponsQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          { id: 1, name: 'スプラシューター', icon_url: null, is_grizzco_weapon: false },
          { id: 2, name: 'スプラローラー', icon_url: null, is_grizzco_weapon: false },
        ],
        error: null,
      }),
    }

    mockSupabase.from.mockReturnValue(weaponsQuery)

    const response = await GET()
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(2)
    expect(requireAdmin).toHaveBeenCalled()
  })

  it('should return error when not admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('管理者権限が必要です'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error).toBe('管理者権限が必要です')
  })

  it('should return error when database query fails', async () => {
    const weaponsQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    }

    mockSupabase.from.mockReturnValue(weaponsQuery)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Database error')
  })
})

describe('POST /api/admin/masters/weapons', () => {
  const mockSupabase = {
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(requireAdmin).mockResolvedValue(undefined)
  })

  it('should create a new weapon', async () => {
    const weaponsQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 1, name: '新武器', icon_url: null, is_grizzco_weapon: false },
        error: null,
      }),
    }

    mockSupabase.from.mockReturnValue(weaponsQuery)

    const request = new NextRequest('http://localhost:3000/api/admin/masters/weapons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '新武器' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.name).toBe('新武器')
  })

  it('should create a weapon with all fields', async () => {
    const weaponsQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 1,
          name: '新武器',
          icon_url: 'https://example.com/icon.png',
          is_grizzco_weapon: true,
        },
        error: null,
      }),
    }

    mockSupabase.from.mockReturnValue(weaponsQuery)

    const request = new NextRequest('http://localhost:3000/api/admin/masters/weapons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '新武器',
        icon_url: 'https://example.com/icon.png',
        is_grizzco_weapon: true,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.name).toBe('新武器')
    expect(data.data.icon_url).toBe('https://example.com/icon.png')
    expect(data.data.is_grizzco_weapon).toBe(true)
  })

  it('should return error when name is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/masters/weapons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('name is required')
  })

  it('should return error when not admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('管理者権限が必要です'))

    const request = new NextRequest('http://localhost:3000/api/admin/masters/weapons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '新武器' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error).toBe('管理者権限が必要です')
  })

  it('should return error when database insert fails', async () => {
    const weaponsQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      }),
    }

    mockSupabase.from.mockReturnValue(weaponsQuery)

    const request = new NextRequest('http://localhost:3000/api/admin/masters/weapons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '新武器' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Insert failed')
  })
})


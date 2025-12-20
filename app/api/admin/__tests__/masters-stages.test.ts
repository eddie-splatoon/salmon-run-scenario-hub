import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '../masters/stages/route'
import { PUT, DELETE } from '../masters/stages/[id]/route'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/utils/admin', () => ({
  requireAdmin: vi.fn(),
}))

describe('GET /api/admin/masters/stages', () => {
  const mockSupabase = {
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(requireAdmin).mockResolvedValue(undefined)
  })

  it('should return stages list', async () => {
    const stagesQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          { id: 1, name: 'アラマキ砦', image_url: null },
          { id: 2, name: 'シェケナダム', image_url: null },
        ],
        error: null,
      }),
    }

    mockSupabase.from.mockReturnValue(stagesQuery)

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
})

describe('POST /api/admin/masters/stages', () => {
  const mockSupabase = {
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(requireAdmin).mockResolvedValue(undefined)
  })

  it('should create a new stage', async () => {
    const stagesQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 1, name: '新ステージ', image_url: null },
        error: null,
      }),
    }

    mockSupabase.from.mockReturnValue(stagesQuery)

    const request = new NextRequest('http://localhost:3000/api/admin/masters/stages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '新ステージ' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.name).toBe('新ステージ')
  })

  it('should return error when name is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/masters/stages', {
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
})

describe('PUT /api/admin/masters/stages/[id]', () => {
  const mockSupabase = {
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(requireAdmin).mockResolvedValue(undefined)
  })

  it('should update a stage', async () => {
    const stagesQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 1, name: '更新されたステージ', image_url: 'https://example.com/image.jpg' },
        error: null,
      }),
    }

    mockSupabase.from.mockReturnValue(stagesQuery)

    const request = new NextRequest('http://localhost:3000/api/admin/masters/stages/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '更新されたステージ', image_url: 'https://example.com/image.jpg' }),
    })

    const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data.name).toBe('更新されたステージ')
  })
})

describe('DELETE /api/admin/masters/stages/[id]', () => {
  const mockSupabase = {
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(requireAdmin).mockResolvedValue(undefined)
  })

  it('should delete a stage', async () => {
    const stagesQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    }

    mockSupabase.from.mockReturnValue(stagesQuery)

    const request = new NextRequest('http://localhost:3000/api/admin/masters/stages/1', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(stagesQuery.eq).toHaveBeenCalledWith('id', '1')
  })
})


import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '../stages/route'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/utils/admin', () => ({
  requireAdmin: vi.fn(),
}))

describe('GET /api/admin/aliases/stages', () => {
  const mockSupabase = {
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(requireAdmin).mockResolvedValue(undefined)
  })

  it('should return stage aliases list', async () => {
    const aliasesQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            stage_id: 1,
            alias: 'アラマキ',
            m_stages: { name: 'アラマキ砦' },
          },
          {
            id: 2,
            stage_id: 2,
            alias: 'シェケナ',
            m_stages: { name: 'シェケナダム' },
          },
        ],
        error: null,
      }),
    }

    mockSupabase.from.mockReturnValue(aliasesQuery)

    const response = await GET()
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(2)
    expect(data.data[0].alias).toBe('アラマキ')
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
    const aliasesQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    }

    mockSupabase.from.mockReturnValue(aliasesQuery)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Database error')
  })
})

describe('POST /api/admin/aliases/stages', () => {
  const mockSupabase = {
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(requireAdmin).mockResolvedValue(undefined)
  })

  it('should create a new stage alias', async () => {
    const aliasesQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 1, stage_id: 1, alias: 'アラマキ' },
        error: null,
      }),
    }

    mockSupabase.from.mockReturnValue(aliasesQuery)

    const request = new NextRequest('http://localhost:3000/api/admin/aliases/stages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: 1, alias: 'アラマキ' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.stage_id).toBe(1)
    expect(data.data.alias).toBe('アラマキ')
  })

  it('should return error when stage_id is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/aliases/stages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias: 'アラマキ' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('stage_id and alias are required')
  })

  it('should return error when alias is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/aliases/stages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: 1 }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('stage_id and alias are required')
  })

  it('should return error when not admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('管理者権限が必要です'))

    const request = new NextRequest('http://localhost:3000/api/admin/aliases/stages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: 1, alias: 'アラマキ' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error).toBe('管理者権限が必要です')
  })

  it('should return error when database insert fails', async () => {
    const aliasesQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      }),
    }

    mockSupabase.from.mockReturnValue(aliasesQuery)

    const request = new NextRequest('http://localhost:3000/api/admin/aliases/stages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: 1, alias: 'アラマキ' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Insert failed')
  })
})


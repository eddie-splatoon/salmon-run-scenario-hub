import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../scenarios/check/route'
import { createClient } from '@/lib/supabase/server'

// Supabaseサーバークライアントをモック
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('GET /api/scenarios/check', () => {
  const mockSupabase = {
    from: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    limit: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase)
  })

  it('シナリオコードが存在する場合はexists=trueを返す', async () => {
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.limit.mockResolvedValue({
      data: [{ code: 'TEST123' }],
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/scenarios/check?code=TEST123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.exists).toBe(true)
    expect(data.scenario_code).toBe('TEST123')
  })

  it('シナリオコードが存在しない場合はexists=falseを返す', async () => {
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.limit.mockResolvedValue({
      data: [],
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/scenarios/check?code=NOTEXIST')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.exists).toBe(false)
  })

  it('シナリオコードが指定されていない場合は400を返す', async () => {
    const request = new NextRequest('http://localhost:3000/api/scenarios/check')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('シナリオコードが指定されていません')
  })
})


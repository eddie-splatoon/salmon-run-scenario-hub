import { describe, it, expect, vi, beforeEach } from 'vitest'
import sitemap from '../sitemap'
import { createClient } from '@/lib/supabase/server'

// Supabaseサーバークライアントをモック
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('Sitemap', () => {
  const mockSupabase = {
    from: vi.fn(),
    select: vi.fn(),
    order: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase)
  })

  it('基本的なページを含むsitemapを生成する', async () => {
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.order.mockResolvedValue({
      data: [],
      error: null,
    })

    const result = await sitemap()

    expect(result).toHaveLength(3)
    expect(result[0].url).toContain('http')
    expect(result[0].priority).toBe(1)
    expect(result[1].url).toContain('/analyze')
    expect(result[2].url).toContain('/guide')
  })

  it('シナリオを含むsitemapを生成する', async () => {
    const mockScenarios = [
      { code: 'TEST001', updated_at: '2024-01-01T00:00:00Z' },
      { code: 'TEST002', updated_at: '2024-01-02T00:00:00Z' },
    ]

    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.order.mockResolvedValue({
      data: mockScenarios,
      error: null,
    })

    const result = await sitemap()

    expect(result.length).toBeGreaterThan(3)
    const scenarioUrls = result.filter((item) => item.url.includes('/scenarios/'))
    expect(scenarioUrls.length).toBe(2)
    expect(scenarioUrls[0].url).toContain('TEST001')
    expect(scenarioUrls[1].url).toContain('TEST002')
  })

  it('エラーが発生した場合でも基本ページを返す', async () => {
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.order.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    })

    const result = await sitemap()

    expect(result).toHaveLength(3)
    expect(result[0].url).toContain('http')
  })
})


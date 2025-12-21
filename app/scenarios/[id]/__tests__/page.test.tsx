import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import ScenarioDetailPage, { generateMetadata } from '../page'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}))

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}))

vi.mock('../ScenarioDetailClient', () => ({
  default: ({ scenario }: { scenario: any }) => (
    <div data-testid="scenario-detail-client">
      <div data-testid="scenario-code">{scenario.code}</div>
      <div data-testid="scenario-stage">{scenario.stage_name}</div>
    </div>
  ),
}))

describe('ScenarioDetailPage', () => {
  const mockScenario = {
    code: 'ABC123',
    stage_id: 1,
    stage_name: 'アラマキ砦',
    danger_rate: 200,
    total_golden_eggs: 100,
    total_power_eggs: 500,
    created_at: '2024-01-01T00:00:00Z',
    author_id: 'user1',
    waves: [
      {
        wave_number: 1,
        tide: 'normal' as const,
        event: 'ラッシュ',
        delivered_count: 30,
        quota: 25,
        cleared: true,
      },
    ],
    weapons: [
      {
        weapon_id: 1,
        weapon_name: 'スプラシューター',
        icon_url: 'https://example.com/weapon1.png',
        display_order: 1,
      },
    ],
    like_count: 5,
    comment_count: 2,
    is_liked: false,
  }

  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'user1' } },
      error: null,
    })
  })

  it('renders scenario detail when scenario exists', async () => {
    const mockScenarioQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          code: 'ABC123',
          author_id: 'user1',
          stage_id: 1,
          danger_rate: 200,
          total_golden_eggs: 100,
          total_power_eggs: 500,
          created_at: '2024-01-01T00:00:00Z',
          m_stages: { name: 'アラマキ砦' },
        },
        error: null,
      }),
    }

    const mockWavesQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockScenario.waves,
        error: null,
      }),
    }

    const mockWeaponsQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            weapon_id: 1,
            display_order: 1,
            m_weapons: {
              id: 1,
              name: 'スプラシューター',
              icon_url: 'https://example.com/weapon1.png',
            },
          },
        ],
        error: null,
      }),
    }

    const mockLikesQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      }),
    }

    mockSupabase.from = vi.fn((table: string) => {
      if (table === 'scenarios') return mockScenarioQuery
      if (table === 'scenario_waves') return mockWavesQuery
      if (table === 'scenario_weapons') return mockWeaponsQuery
      if (table === 'likes') {
        if (mockSupabase.from.mock.calls.filter((c) => c[0] === 'likes').length === 1) {
          return {
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              count: 5,
              error: null,
            }),
          }
        }
        return mockLikesQuery
      }
      if (table === 'comments') {
        return {
          from: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            count: 2,
            error: null,
          }),
        }
      }
      return { from: vi.fn() }
    })

    const params = Promise.resolve({ id: 'ABC123' })
    const page = await ScenarioDetailPage({ params })

    render(page)

    expect(screen.getByTestId('scenario-detail-client')).toBeInTheDocument()
    expect(screen.getByTestId('scenario-code')).toHaveTextContent('ABC123')
    expect(screen.getByTestId('scenario-stage')).toHaveTextContent('アラマキ砦')
  })

  it('calls notFound when scenario does not exist', async () => {
    const mockScenarioQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      }),
    }

    mockSupabase.from = vi.fn((table: string) => {
      if (table === 'scenarios') return mockScenarioQuery
      return { from: vi.fn() }
    })

    const params = Promise.resolve({ id: 'INVALID' })
    await ScenarioDetailPage({ params })

    expect(notFound).toHaveBeenCalled()
  })

  it('generates metadata correctly', async () => {
    const mockScenarioQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          code: 'ABC123',
          author_id: 'user1',
          stage_id: 1,
          danger_rate: 200,
          total_golden_eggs: 100,
          total_power_eggs: 500,
          created_at: '2024-01-01T00:00:00Z',
          m_stages: { name: 'アラマキ砦' },
        },
        error: null,
      }),
    }

    const mockWavesQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockScenario.waves,
        error: null,
      }),
    }

    const mockWeaponsQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            weapon_id: 1,
            display_order: 1,
            m_weapons: {
              id: 1,
              name: 'スプラシューター',
              icon_url: 'https://example.com/weapon1.png',
            },
          },
        ],
        error: null,
      }),
    }

    mockSupabase.from = vi.fn((table: string) => {
      if (table === 'scenarios') return mockScenarioQuery
      if (table === 'scenario_waves') return mockWavesQuery
      if (table === 'scenario_weapons') return mockWeaponsQuery
      if (table === 'likes') {
        return {
          from: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            count: 5,
            error: null,
          }),
        }
      }
      if (table === 'comments') {
        return {
          from: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            count: 2,
            error: null,
          }),
        }
      }
      return { from: vi.fn() }
    })

    const params = Promise.resolve({ id: 'ABC123' })
    const metadata = await generateMetadata({ params })

    expect(metadata.title).toContain('アラマキ砦')
    expect(metadata.title).toContain('100金イクラ')
    expect(metadata.description).toContain('アラマキ砦')
    expect(metadata.openGraph).toBeDefined()
  })

  it('generates metadata with not found when scenario does not exist', async () => {
    const mockScenarioQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      }),
    }

    mockSupabase.from = vi.fn((table: string) => {
      if (table === 'scenarios') return mockScenarioQuery
      return { from: vi.fn() }
    })

    const params = Promise.resolve({ id: 'INVALID' })
    const metadata = await generateMetadata({ params })

    expect(metadata.title).toBe('シナリオが見つかりません')
  })
})


import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import ProfilePage from '../page'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/utils/admin'
import { redirect } from 'next/navigation'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/utils/admin', () => ({
  isAdmin: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  }),
}))

vi.mock('../ProfileClient', () => ({
  default: ({ user, initialScenarios, initialStatisticsData }: any) => (
    <div data-testid="profile-client">
      <div data-testid="user-name">{user.name}</div>
      <div data-testid="scenarios-count">{initialScenarios.length}</div>
      <div data-testid="has-statistics">
        {initialStatisticsData ? 'true' : 'false'}
      </div>
    </div>
  ),
}))

describe('ProfilePage', () => {
  const mockUser = {
    id: 'user1',
    email: 'test@example.com',
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
    vi.mocked(isAdmin).mockResolvedValue(false)
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
  })

  it('renders profile page when user is authenticated', async () => {
    const mockScenariosQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            code: 'ABC123',
            stage_id: 1,
            danger_rate: 200,
            total_golden_eggs: 100,
            created_at: '2024-01-01T00:00:00Z',
            m_stages: { name: 'アラマキ砦' },
          },
        ],
        error: null,
      }),
    }

    const mockWeaponsQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            scenario_code: 'ABC123',
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

    const mockStatsQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [
          {
            total_golden_eggs: 100,
            stage_id: 1,
          },
        ],
        error: null,
      }),
    }

    const mockStageStatsQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [
          {
            stage_id: 1,
            m_stages: { name: 'アラマキ砦' },
          },
        ],
        error: null,
      }),
    }

    const mockLikesQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    }

    const mockProfileQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          display_name: 'テストユーザー',
          avatar_url: 'https://example.com/avatar.png',
        },
        error: null,
      }),
    }

    // getStatisticsData内でscenariosテーブルに複数回アクセスするため、呼び出し回数で分岐
    let scenariosCallCount = 0
    mockSupabase.from = vi.fn((table: string) => {
      if (table === 'scenarios') {
        scenariosCallCount++
        // 1回目: getUserScenarios
        if (scenariosCallCount === 1) {
          return mockScenariosQuery
        }
        // 2回目: getStatisticsData - total_golden_eggs, stage_id取得
        if (scenariosCallCount === 2) {
          return mockStatsQuery
        }
        // 3回目: getStatisticsData - stage_id, m_stages取得（ステージ統計用）
        if (scenariosCallCount === 3) {
          return mockStageStatsQuery
        }
        // 4回目以降: getStatisticsData - いいねしたシナリオの詳細（likedScenarioCodes.length > 0の場合のみ）
        // このテストではlikesが空なので、この呼び出しは発生しない
        return {
          from: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }
      }
      if (table === 'scenario_weapons') return mockWeaponsQuery
      if (table === 'likes') return mockLikesQuery
      if (table === 'profiles') return mockProfileQuery
      return { from: vi.fn() }
    })

    const page = await ProfilePage()
    render(page)

    expect(screen.getByTestId('profile-client')).toBeInTheDocument()
    expect(screen.getByTestId('user-name')).toHaveTextContent('テストユーザー')
    expect(screen.getByTestId('scenarios-count')).toHaveTextContent('1')
  })

  it('redirects to login when user is not authenticated', async () => {
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    // redirectは例外を投げるため、try-catchで処理
    try {
      await ProfilePage()
    } catch (error: any) {
      // NEXT_REDIRECTエラーが投げられることを確認
      expect(error.message).toBe('NEXT_REDIRECT')
    }

    expect(redirect).toHaveBeenCalledWith('/auth/login')
  })

  it('handles empty scenarios list', async () => {
    const mockScenariosQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    }

    const mockStatsQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    }

    const mockLikesQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    }

    const mockProfileQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    }

    mockSupabase.from = vi.fn((table: string) => {
      if (table === 'scenarios') {
        const callCount = mockSupabase.from.mock.calls.filter((c) => c[0] === 'scenarios').length
        if (callCount === 1) {
          return mockScenariosQuery
        }
        return mockStatsQuery
      }
      if (table === 'likes') return mockLikesQuery
      if (table === 'profiles') return mockProfileQuery
      return { from: vi.fn() }
    })

    const page = await ProfilePage()
    render(page)

    expect(screen.getByTestId('scenarios-count')).toHaveTextContent('0')
  })

  it('uses user metadata when profile is not found', async () => {
    const mockScenariosQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    }

    const mockStatsQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    }

    const mockLikesQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    }

    const mockProfileQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    }

    mockSupabase.from = vi.fn((table: string) => {
      if (table === 'scenarios') {
        const callCount = mockSupabase.from.mock.calls.filter((c) => c[0] === 'scenarios').length
        if (callCount === 1) {
          return mockScenariosQuery
        }
        return mockStatsQuery
      }
      if (table === 'likes') return mockLikesQuery
      if (table === 'profiles') return mockProfileQuery
      return { from: vi.fn() }
    })

    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: {
        user: {
          ...mockUser,
          user_metadata: {
            full_name: 'メタデータユーザー',
            picture: 'https://example.com/picture.png',
          },
        },
      },
      error: null,
    })

    const page = await ProfilePage()
    render(page)

    expect(screen.getByTestId('user-name')).toHaveTextContent('メタデータユーザー')
  })
})


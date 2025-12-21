import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import Home from '../page'
import { createClient } from '@/lib/supabase/server'

// Supabaseサーバークライアントをモック
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Next.jsのcookiesをモック
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}))

// Next.jsのLinkコンポーネントをモック
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Next.jsのnavigationをモック
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(() => null),
    toString: vi.fn(() => ''),
  }),
  usePathname: () => '/',
}))

// lucide-reactのアイコンをモック
vi.mock('lucide-react', () => ({
  Upload: () => <span data-testid="upload-icon">Upload</span>,
  Search: () => <span data-testid="search-icon">Search</span>,
  ArrowRight: () => <span data-testid="arrow-right-icon">ArrowRight</span>,
  TrendingUp: () => <span data-testid="trending-up-icon">TrendingUp</span>,
  Filter: () => <span data-testid="filter-icon">Filter</span>,
}))

describe('Home Page (Landing Page)', () => {
  const createMockQueryBuilder = () => {
    const builder = {
      from: vi.fn(() => builder),
      select: vi.fn(() => builder),
      order: vi.fn(() => builder),
      limit: vi.fn(() => builder),
      in: vi.fn(() => builder),
      gte: vi.fn(() => builder),
      eq: vi.fn(() => builder),
    }
    return builder
  }

  const mockQueryBuilder = createMockQueryBuilder()
  const mockWeaponQueryBuilder = createMockQueryBuilder()
  const mockLikesQueryBuilder = createMockQueryBuilder()

  const mockSupabase = {
    from: vi.fn((table: string) => {
      if (table === 'scenarios') {
        return mockQueryBuilder
      } else if (table === 'scenario_weapons') {
        return mockWeaponQueryBuilder
      } else if (table === 'likes') {
        return mockLikesQueryBuilder
      }
      return createMockQueryBuilder()
    }),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // デフォルトのモック設定 - シナリオ取得
    mockQueryBuilder.from = vi.fn(() => mockQueryBuilder)
    mockQueryBuilder.select = vi.fn(() => mockQueryBuilder)
    mockQueryBuilder.order = vi.fn(() => mockQueryBuilder)
    mockQueryBuilder.limit = vi.fn(() => Promise.resolve({
      data: [],
      error: null,
    }))
    mockQueryBuilder.gte = vi.fn(() => Promise.resolve({
      data: [],
      error: null,
    }))

    // デフォルトのモック設定 - 武器取得
    mockWeaponQueryBuilder.from = vi.fn(() => mockWeaponQueryBuilder)
    mockWeaponQueryBuilder.select = vi.fn(() => mockWeaponQueryBuilder)
    mockWeaponQueryBuilder.in = vi.fn(() => mockWeaponQueryBuilder)
    mockWeaponQueryBuilder.order = vi.fn(() => mockWeaponQueryBuilder)
    mockWeaponQueryBuilder.limit = vi.fn(() => Promise.resolve({
      data: [],
      error: null,
    }))

    // デフォルトのモック設定 - いいね取得（トレンド用）
    mockLikesQueryBuilder.from = vi.fn(() => mockLikesQueryBuilder)
    mockLikesQueryBuilder.select = vi.fn(() => Promise.resolve({
      data: [],
      error: null,
    }))
    mockLikesQueryBuilder.gte = vi.fn(() => mockLikesQueryBuilder)

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  it('renders hero section with main heading', async () => {
    const HomeComponent = await Home()
    render(HomeComponent)
    
    // ヒーローセクションのメイン見出しを確認
    const mainHeading = screen.getByText(/リザルト画像をアップするだけ/)
    expect(mainHeading).toBeInTheDocument()
    
    // サブ見出しは複数ある可能性があるので、最初のものを取得
    const subHeadings = screen.getAllByText(/シナリオコードを共有/)
    expect(subHeadings.length).toBeGreaterThan(0)
  })

  it('renders CTA buttons in hero section', async () => {
    const HomeComponent = await Home()
    render(HomeComponent)
    
    // 「AI解析を試す」ボタンを確認（複数ある可能性があるので最初のものを取得）
    const analyzeButtons = screen.getAllByRole('link', { name: /AI解析を試す/i })
    expect(analyzeButtons.length).toBeGreaterThan(0)
    expect(analyzeButtons[0]).toHaveAttribute('href', '/analyze')
    
    // 「最新シナリオを見る」ボタンを確認
    const latestButton = screen.getByRole('link', { name: /最新シナリオを見る/i })
    expect(latestButton).toBeInTheDocument()
  })

  it('renders 3-step guide section', async () => {
    const HomeComponent = await Home()
    render(HomeComponent)
    
    // 3ステップガイドの見出しを確認
    const guideHeading = screen.getByText(/使い方は簡単、たった3ステップ/)
    expect(guideHeading).toBeInTheDocument()
    
    // 各ステップのタイトルを確認
    expect(screen.getByText(/スクリーンショットを撮る/)).toBeInTheDocument()
    expect(screen.getByText(/AIが自動解析/)).toBeInTheDocument()
    // 「みんなで共有」は複数箇所に表示される可能性があるので、getAllByTextを使用
    const shareTexts = screen.getAllByText(/みんなで共有/)
    expect(shareTexts.length).toBeGreaterThan(0)
  })

  it('renders latest scenarios section', async () => {
    const HomeComponent = await Home()
    render(HomeComponent)
    
    // 最新シナリオセクションの見出しを確認
    const latestHeading = screen.getByText(/最新のシナリオ/)
    expect(latestHeading).toBeInTheDocument()
  })

  it('displays empty state when no scenarios exist', async () => {
    const HomeComponent = await Home()
    render(HomeComponent)
    
    // 空状態のメッセージを確認
    const emptyMessage = screen.getByText(/まだシナリオがありません/)
    expect(emptyMessage).toBeInTheDocument()
    
    // 空状態のCTAボタンを確認（複数あるので最初のものを取得）
    const emptyCTAs = screen.getAllByRole('link', { name: /AI解析を試す/i })
    expect(emptyCTAs.length).toBeGreaterThan(0)
  })

  it('fetches latest scenarios from database', async () => {
    const mockScenarios = [
      {
        code: 'ABC123',
        stage_id: 1,
        danger_rate: 200,
        total_golden_eggs: 100,
        created_at: '2024-01-01T00:00:00Z',
        m_stages: { name: 'アラマキ砦' },
      },
    ]

    const mockWeapons = [
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
    ]

    // シナリオ取得のモック
    mockQueryBuilder.limit = vi.fn().mockResolvedValue({
      data: mockScenarios,
      error: null,
    })

    // 武器取得のモック
    mockWeaponQueryBuilder.limit = vi.fn().mockResolvedValue({
      data: mockWeapons,
      error: null,
    })

    const HomeComponent = await Home()
    render(HomeComponent)
    
    // Supabaseクライアントが呼ばれたことを確認
    expect(createClient).toHaveBeenCalled()
    expect(mockSupabase.from).toHaveBeenCalledWith('scenarios')
    expect(mockQueryBuilder.limit).toHaveBeenCalledWith(60) // limit * 10 = 6 * 10 = 60
    expect(mockSupabase.from).toHaveBeenCalledWith('scenario_weapons')
    expect(mockWeaponQueryBuilder.limit).toHaveBeenCalledWith(24) // 6シナリオ × 4武器 = 24
  })
})

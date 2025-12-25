import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import ScenarioDetailClient from '../ScenarioDetailClient'

// Next.jsのLinkをモック
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// sonnerのtoastをモック
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// lucide-reactのアイコンをモック
vi.mock('lucide-react', () => ({
  Copy: () => <span data-testid="copy-icon">Copy</span>,
  Heart: () => <span data-testid="heart-icon">Heart</span>,
  MessageCircle: () => <span data-testid="message-icon">MessageCircle</span>,
  ArrowLeft: () => <span data-testid="arrow-left-icon">ArrowLeft</span>,
  User: () => <span data-testid="user-icon">User</span>,
  Share2: () => <span data-testid="share-icon">Share2</span>,
}))

// scenario-tagsをモック
vi.mock('@/lib/utils/scenario-tags', () => ({
  calculateScenarioTags: vi.fn(() => ({
    tags: ['クマフェス', '初心者向け'],
    tagColors: {
      クマフェス: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
      初心者向け: 'bg-green-500/20 text-green-300 border-green-500/50',
    },
  })),
}))

global.fetch = vi.fn()

// navigator.clipboardをモック
const mockWriteText = vi.fn().mockResolvedValue(undefined)

describe('ScenarioDetailClient', () => {
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
      {
        wave_number: 2,
        tide: 'high' as const,
        event: null,
        delivered_count: 35,
        quota: 30,
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

  const mockComments = [
    {
      id: 1,
      user_id: 'user2',
      content: '素晴らしいシナリオです！',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
  ]

  const mockAuthorInfo = {
    id: 'user1',
    name: 'テストユーザー',
    avatar_url: 'https://example.com/avatar.png',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockWriteText.mockClear()
    // navigator.clipboardをモック（Object.definePropertyを使用）
    Object.defineProperty(global.navigator, 'clipboard', {
      value: {
        writeText: mockWriteText,
      },
      writable: true,
      configurable: true,
    })
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/comments')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: mockComments,
          }),
        })
      }
      if (url.includes('/users/')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: mockAuthorInfo,
          }),
        })
      }
      return Promise.resolve({
        json: async () => ({
          success: true,
          data: {},
        }),
      })
    })
  })

  it('renders scenario detail information', () => {
    render(<ScenarioDetailClient scenario={mockScenario} />)

    expect(screen.getByText('ABC123')).toBeInTheDocument()
    expect(screen.getByText('アラマキ砦')).toBeInTheDocument()
    expect(screen.getByText('200%')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('displays wave details in table', () => {
    render(<ScenarioDetailClient scenario={mockScenario} />)

    expect(screen.getByText('WAVE別詳細')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('ラッシュ')).toBeInTheDocument()
  })

  it('displays weapons', () => {
    render(<ScenarioDetailClient scenario={mockScenario} />)

    expect(screen.getByText('武器')).toBeInTheDocument()
    // 武器名は画像のalt属性またはtitle属性に存在する
    expect(screen.getByAltText('スプラシューター')).toBeInTheDocument()
  })

  it('displays tags when available', () => {
    render(<ScenarioDetailClient scenario={mockScenario} />)

    expect(screen.getByText('タグ')).toBeInTheDocument()
    expect(screen.getByText('#クマフェス')).toBeInTheDocument()
    expect(screen.getByText('#初心者向け')).toBeInTheDocument()
  })

  it('copies scenario code to clipboard', async () => {
    const user = userEvent.setup()
    
    // このテスト用にnavigator.clipboardを再設定
    Object.defineProperty(global.navigator, 'clipboard', {
      value: {
        writeText: mockWriteText,
      },
      writable: true,
      configurable: true,
    })
    
    render(<ScenarioDetailClient scenario={mockScenario} />)

    const copyButton = screen.getByText('コードをコピー')
    await user.click(copyButton)

    // 非同期処理を待つ（clipboard APIは非同期）
    await waitFor(
      () => {
        expect(mockWriteText).toHaveBeenCalledWith('ABC123')
      },
      { timeout: 3000 }
    )
  })

  it('toggles like status', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn((url: string, options?: any) => {
      if (options?.method === 'POST' && url.includes('/likes')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: {
              is_liked: true,
              like_count: 6,
            },
          }),
        })
      }
      // 初期データ取得用のモック
      if (url.includes('/comments')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: mockComments,
          }),
        })
      }
      if (url.includes('/users/')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: mockAuthorInfo,
          }),
        })
      }
      return Promise.resolve({
        json: async () => ({
          success: true,
          data: {},
        }),
      })
    })

    render(<ScenarioDetailClient scenario={mockScenario} />)

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    const likeButton = screen.getByText('5')
    await user.click(likeButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/scenarios/ABC123/likes',
        { method: 'POST' }
      )
    })
  })

  it('submits comment', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn((url: string, options?: any) => {
      if (options?.method === 'POST' && url.includes('/comments')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: {
              id: 2,
              user_id: 'user1',
              content: '新しいコメント',
              created_at: '2024-01-03T00:00:00Z',
              updated_at: '2024-01-03T00:00:00Z',
            },
          }),
        })
      }
      // 初期データ取得用のモック
      if (url.includes('/comments') && !options) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: mockComments,
          }),
        })
      }
      if (url.includes('/users/')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: mockAuthorInfo,
          }),
        })
      }
      return Promise.resolve({
        json: async () => ({
          success: true,
          data: {},
        }),
      })
    })

    render(<ScenarioDetailClient scenario={mockScenario} />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('コメントを入力...')).toBeInTheDocument()
    })

    const commentInput = screen.getByPlaceholderText('コメントを入力...')
    await user.type(commentInput, '新しいコメント')

    const submitButton = screen.getByText('コメントを投稿')
    await user.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/scenarios/ABC123/comments',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
    })
  })

  it('loads comments on mount', async () => {
    render(<ScenarioDetailClient scenario={mockScenario} />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/scenarios/ABC123/comments')
    })

    await waitFor(() => {
      expect(screen.getByText('素晴らしいシナリオです！')).toBeInTheDocument()
    })
  })

  it('loads author info on mount', async () => {
    render(<ScenarioDetailClient scenario={mockScenario} />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/users/user1')
    })

    await waitFor(() => {
      expect(screen.getByText('投稿者: テストユーザー')).toBeInTheDocument()
    })
  })

  it('displays EX for wave 4', () => {
    const scenarioWithWave4 = {
      ...mockScenario,
      waves: [
        {
          wave_number: 4,
          tide: 'normal' as const,
          event: null,
          delivered_count: 40,
          quota: 35,
          cleared: true,
        },
      ],
    }

    render(<ScenarioDetailClient scenario={scenarioWithWave4} />)

    expect(screen.getByText('EX')).toBeInTheDocument()
  })
})


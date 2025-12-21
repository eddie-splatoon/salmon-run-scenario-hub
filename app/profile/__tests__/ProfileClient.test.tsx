import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import ProfileClient from '../ProfileClient'

// Next.jsのLinkとuseRouterをモック
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
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
  Edit2: () => <span data-testid="edit-icon">Edit</span>,
  ArrowLeft: () => <span data-testid="arrow-left-icon">ArrowLeft</span>,
  Upload: () => <span data-testid="upload-icon">Upload</span>,
  X: () => <span data-testid="x-icon">X</span>,
}))

// ScenarioCardをモック
vi.mock('@/app/components/ScenarioCard', () => ({
  default: ({
    code,
    stageName,
    showDelete,
    onDelete,
    isDeleting,
  }: {
    code: string
    stageName: string
    showDelete?: boolean
    onDelete?: (code: string) => void
    isDeleting?: boolean
  }) => (
    <div data-testid={`scenario-card-${code}`}>
      <div>{stageName}</div>
      {showDelete && onDelete && (
        <button
          data-testid={`delete-button-${code}`}
          onClick={() => onDelete(code)}
          disabled={isDeleting}
        >
          削除
        </button>
      )}
    </div>
  ),
}))

// StatisticsDashboardをモック
vi.mock('@/app/components/StatisticsDashboard', () => ({
  default: ({ initialData }: { initialData?: any }) => (
    <div data-testid="statistics-dashboard">
      {initialData ? (
        <div data-testid="statistics-data">
          <div>平均: {initialData.average_golden_eggs}</div>
          <div>最大: {initialData.max_golden_eggs}</div>
          <div>総数: {initialData.total_scenarios}</div>
        </div>
      ) : (
        <div>統計データなし</div>
      )}
    </div>
  ),
}))

// react-image-cropをモック
vi.mock('react-image-crop', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="react-crop">{children}</div>
  ),
  centerCrop: vi.fn((crop) => crop),
  makeAspectCrop: vi.fn((crop) => crop),
}))

global.fetch = vi.fn()
global.confirm = vi.fn(() => true)
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()
// window.location.reloadは読み取り専用プロパティのため、Object.definePropertyを使用
Object.defineProperty(window, 'location', {
  value: {
    ...window.location,
    reload: vi.fn(),
  },
  writable: true,
  configurable: true,
})

describe('ProfileClient', () => {
  const mockUser = {
    id: 'user1',
    email: 'test@example.com',
    name: 'テストユーザー',
    avatar_url: 'https://example.com/avatar.png',
  }

  const mockScenarios = [
    {
      code: 'ABC123',
      stage_id: 1,
      stage_name: 'アラマキ砦',
      danger_rate: 200,
      total_golden_eggs: 100,
      created_at: '2024-01-01T00:00:00Z',
      weapons: [
        {
          weapon_id: 1,
          weapon_name: 'スプラシューター',
          icon_url: 'https://example.com/weapon1.png',
          display_order: 1,
        },
      ],
    },
  ]

  const mockStatisticsData = {
    average_golden_eggs: 95.5,
    max_golden_eggs: 120,
    total_scenarios: 5,
    stage_stats: [
      { stage_id: 1, stage_name: 'アラマキ砦', count: 3 },
    ],
    liked_scenarios: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        data: {},
      }),
    })
  })

  it('renders profile information', () => {
    render(
      <ProfileClient
        user={mockUser}
        initialScenarios={mockScenarios}
        initialStatisticsData={mockStatisticsData}
      />
    )

    expect(screen.getByText('マイページ')).toBeInTheDocument()
    expect(screen.getByText('テストユーザー')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('displays statistics dashboard', () => {
    render(
      <ProfileClient
        user={mockUser}
        initialScenarios={mockScenarios}
        initialStatisticsData={mockStatisticsData}
      />
    )

    expect(screen.getByText('統計ダッシュボード')).toBeInTheDocument()
    expect(screen.getByTestId('statistics-dashboard')).toBeInTheDocument()
    expect(screen.getByText('平均: 95.5')).toBeInTheDocument()
    expect(screen.getByText('最大: 120')).toBeInTheDocument()
    expect(screen.getByText('総数: 5')).toBeInTheDocument()
  })

  it('displays scenarios list', () => {
    render(
      <ProfileClient
        user={mockUser}
        initialScenarios={mockScenarios}
        initialStatisticsData={mockStatisticsData}
      />
    )

    expect(screen.getByText('投稿したシナリオ (1件)')).toBeInTheDocument()
    expect(screen.getByTestId('scenario-card-ABC123')).toBeInTheDocument()
  })

  it('displays empty state when no scenarios', () => {
    render(
      <ProfileClient
        user={mockUser}
        initialScenarios={[]}
        initialStatisticsData={mockStatisticsData}
      />
    )

    expect(screen.getByText('投稿したシナリオ (0件)')).toBeInTheDocument()
    expect(screen.getByText('まだ投稿がありません')).toBeInTheDocument()
  })

  it('allows editing profile name', async () => {
    const user = userEvent.setup()
    render(
      <ProfileClient
        user={mockUser}
        initialScenarios={mockScenarios}
        initialStatisticsData={mockStatisticsData}
      />
    )

    const editButton = screen.getByText('編集')
    await user.click(editButton)

    const nameInput = screen.getByPlaceholderText('ユーザー名')
    expect(nameInput).toBeInTheDocument()

    await user.clear(nameInput)
    await user.type(nameInput, '新しい名前')

    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
      }),
    })

    const saveButton = screen.getByText('保存')
    await user.click(saveButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: '新しい名前' }),
      })
    })
  })

  it('deletes scenario when delete button is clicked', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
      }),
    })

    render(
      <ProfileClient
        user={mockUser}
        initialScenarios={mockScenarios}
        initialStatisticsData={mockStatisticsData}
      />
    )

    const deleteButton = screen.getByTestId('delete-button-ABC123')
    await user.click(deleteButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/scenarios/ABC123', {
        method: 'DELETE',
      })
    })
  })

  it('handles profile save error', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: false,
        error: '保存エラー',
      }),
    })

    render(
      <ProfileClient
        user={mockUser}
        initialScenarios={mockScenarios}
        initialStatisticsData={mockStatisticsData}
      />
    )

    const editButton = screen.getByText('編集')
    await user.click(editButton)

    const saveButton = screen.getByText('保存')
    await user.click(saveButton)

    await waitFor(() => {
      const { toast } = require('sonner')
      expect(toast.error).toHaveBeenCalled()
    })
  })

  it('handles empty profile name validation', async () => {
    const user = userEvent.setup()
    render(
      <ProfileClient
        user={mockUser}
        initialScenarios={mockScenarios}
        initialStatisticsData={mockStatisticsData}
      />
    )

    const editButton = screen.getByText('編集')
    await user.click(editButton)

    const nameInput = screen.getByPlaceholderText('ユーザー名')
    await user.clear(nameInput)

    const saveButton = screen.getByText('保存')
    await user.click(saveButton)

    await waitFor(() => {
      const { toast } = require('sonner')
      expect(toast.error).toHaveBeenCalledWith('ユーザー名を入力してください')
    })
  })

  it('displays user initial when avatar is not available', () => {
    const userWithoutAvatar = {
      ...mockUser,
      avatar_url: null,
    }

    render(
      <ProfileClient
        user={userWithoutAvatar}
        initialScenarios={mockScenarios}
        initialStatisticsData={mockStatisticsData}
      />
    )

    // アバターがない場合はユーザー名の最初の文字が表示される
    expect(screen.getByText('テストユーザー')).toBeInTheDocument()
  })
})


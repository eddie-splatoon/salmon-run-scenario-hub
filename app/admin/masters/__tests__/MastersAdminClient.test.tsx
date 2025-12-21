import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import MastersAdminClient from '../MastersAdminClient'

// lucide-reactのアイコンをモック
vi.mock('lucide-react', () => ({
  Plus: () => <span data-testid="plus-icon">Plus</span>,
  Edit2: () => <span data-testid="edit-icon">Edit</span>,
  Trash2: () => <span data-testid="trash-icon">Trash</span>,
  AlertCircle: () => <span data-testid="alert-icon">Alert</span>,
  CheckCircle2: () => <span data-testid="check-icon">Check</span>,
}))

global.fetch = vi.fn()
global.confirm = vi.fn(() => true)
global.alert = vi.fn()

describe('MastersAdminClient', () => {
  const mockStages = [
    {
      id: 1,
      name: 'アラマキ砦',
      image_url: 'https://example.com/stage1.png',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: '難破船ドン・ブラコ',
      image_url: null,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
  ]

  const mockWeapons = [
    {
      id: 1,
      name: 'スプラシューター',
      icon_url: 'https://example.com/weapon1.png',
      is_grizzco_weapon: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'クマサン印の武器',
      icon_url: 'https://example.com/weapon2.png',
      is_grizzco_weapon: true,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
  ]

  const mockUnknownStages = [
    {
      id: 1,
      name: '未知のステージ',
      detected_at: '2024-01-01T00:00:00Z',
      resolved_at: null,
    },
  ]

  const mockUnknownWeapons = [
    {
      id: 1,
      name: '未知の武器',
      detected_at: '2024-01-01T00:00:00Z',
      resolved_at: null,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/api/admin/masters/stages')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: mockStages,
          }),
        })
      }
      if (url.includes('/api/admin/masters/weapons')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: mockWeapons,
          }),
        })
      }
      if (url.includes('/api/admin/unknown?type=stages')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: mockUnknownStages,
          }),
        })
      }
      if (url.includes('/api/admin/unknown?type=weapons')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: mockUnknownWeapons,
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

  it('renders masters admin page with tabs', async () => {
    render(<MastersAdminClient />)

    expect(screen.getByText('マスタ管理')).toBeInTheDocument()
    expect(screen.getByText('ステージ')).toBeInTheDocument()
    expect(screen.getByText('武器')).toBeInTheDocument()
    expect(screen.getByText('未知データ')).toBeInTheDocument()
  })

  it('loads and displays stages when stages tab is active', async () => {
    render(<MastersAdminClient />)

    await waitFor(() => {
      expect(screen.getByText('ステージ一覧')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('アラマキ砦')).toBeInTheDocument()
      expect(screen.getByText('難破船ドン・ブラコ')).toBeInTheDocument()
    })
  })

  it('switches to weapons tab and displays weapons', async () => {
    const user = userEvent.setup()
    render(<MastersAdminClient />)

    await waitFor(() => {
      expect(screen.getByText('ステージ一覧')).toBeInTheDocument()
    })

    const weaponsTab = screen.getByText('武器')
    await user.click(weaponsTab)

    await waitFor(() => {
      expect(screen.getByText('武器一覧')).toBeInTheDocument()
      expect(screen.getByText('スプラシューター')).toBeInTheDocument()
      expect(screen.getByText('クマサン印の武器')).toBeInTheDocument()
    })
  })

  it('switches to unknown tab and displays unknown data', async () => {
    const user = userEvent.setup()
    render(<MastersAdminClient />)

    await waitFor(() => {
      expect(screen.getByText('ステージ一覧')).toBeInTheDocument()
    })

    const unknownTab = screen.getByText('未知データ')
    await user.click(unknownTab)

    await waitFor(() => {
      // 見出しとテーブルセルの両方に存在するため、getAllByTextを使用
      const stageTexts = screen.getAllByText('未知のステージ')
      expect(stageTexts.length).toBeGreaterThan(0)
      const weaponTexts = screen.getAllByText('未知の武器')
      expect(weaponTexts.length).toBeGreaterThan(0)
    })
  })

  it('displays add stage form when add button is clicked', async () => {
    const user = userEvent.setup()
    render(<MastersAdminClient />)

    await waitFor(() => {
      expect(screen.getByText('ステージ一覧')).toBeInTheDocument()
    })

    const addButton = screen.getByText('追加')
    await user.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('ステージを追加')).toBeInTheDocument()
    })
  })

  it('displays add weapon form when add button is clicked', async () => {
    const user = userEvent.setup()
    render(<MastersAdminClient />)

    await waitFor(() => {
      expect(screen.getByText('ステージ一覧')).toBeInTheDocument()
    })

    const weaponsTab = screen.getByText('武器')
    await user.click(weaponsTab)

    await waitFor(() => {
      expect(screen.getByText('武器一覧')).toBeInTheDocument()
    })

    const addButton = screen.getByText('追加')
    await user.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('武器を追加')).toBeInTheDocument()
    })
  })

  it('saves new stage', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn((url: string, options?: any) => {
      if (options?.method === 'POST' && url.includes('/api/admin/masters/stages')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: {},
          }),
        })
      }
      // 初期データ取得用のモック
      if (url.includes('/api/admin/masters/stages') && !options) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: mockStages,
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

    render(<MastersAdminClient />)

    await waitFor(() => {
      expect(screen.getByText('ステージ一覧')).toBeInTheDocument()
    })

    const addButton = screen.getByText('追加')
    await user.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('ステージを追加')).toBeInTheDocument()
    })

    // labelとinputが関連付けられていないため、最初のtextboxを取得
    const textboxes = screen.getAllByRole('textbox')
    const nameInput = textboxes[0]
    await user.type(nameInput, '新しいステージ')

    const saveButton = screen.getByText('保存')
    await user.click(saveButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/masters/stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '新しいステージ', image_url: undefined }),
      })
    })
  })

  it('deletes stage when delete button is clicked', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn((url: string, options?: any) => {
      if (options?.method === 'DELETE' && url.includes('/api/admin/masters/stages/')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: {},
          }),
        })
      }
      // 初期データ取得用のモック
      if (url.includes('/api/admin/masters/stages') && !options) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: mockStages,
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

    render(<MastersAdminClient />)

    await waitFor(() => {
      expect(screen.getByText('アラマキ砦')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByTestId('trash-icon')
    await user.click(deleteButtons[0].closest('button')!)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/masters/stages/1', {
        method: 'DELETE',
      })
    })
  })

  it('displays edit form when edit button is clicked', async () => {
    const user = userEvent.setup()
    render(<MastersAdminClient />)

    await waitFor(() => {
      expect(screen.getByText('アラマキ砦')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByTestId('edit-icon')
    await user.click(editButtons[0].closest('button')!)

    await waitFor(() => {
      expect(screen.getByText('ステージを編集')).toBeInTheDocument()
    })
  })

  it('displays loading state initially', () => {
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}))

    render(<MastersAdminClient />)

    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  it('displays error message when API fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: false,
        error: 'API Error',
      }),
    })

    render(<MastersAdminClient />)

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument()
    })
  })

  it('displays unknown data count badge', async () => {
    const user = userEvent.setup()
    render(<MastersAdminClient />)

    await waitFor(() => {
      const unknownTab = screen.getByText('未知データ')
      expect(unknownTab).toBeInTheDocument()
    })

    // バッジが表示されることを確認（未知データが2件あるため）
    await waitFor(() => {
      const badge = screen.getByText('2')
      expect(badge).toBeInTheDocument()
    })
  })

  it('displays empty state for unknown data when none exists', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/api/admin/unknown?type=stages')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: [],
          }),
        })
      }
      if (url.includes('/api/admin/unknown?type=weapons')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: [],
          }),
        })
      }
      // 初期データ取得用のモック
      if (url.includes('/api/admin/masters/stages')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: mockStages,
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

    render(<MastersAdminClient />)

    await waitFor(() => {
      expect(screen.getByText('ステージ一覧')).toBeInTheDocument()
    })

    const unknownTab = screen.getByText('未知データ')
    await user.click(unknownTab)

    await waitFor(() => {
      expect(screen.getByText('未知のステージはありません')).toBeInTheDocument()
      expect(screen.getByText('未知の武器はありません')).toBeInTheDocument()
    })
  })
})


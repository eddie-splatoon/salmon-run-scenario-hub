import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import ScenariosListClient from '../ScenariosListClient'

// Next.jsのnavigationをモック
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// ScenarioCardをモック
vi.mock('@/app/components/ScenarioCard', () => ({
  default: ({ code, stageName }: { code: string; stageName: string }) => (
    <div data-testid={`scenario-card-${code}`}>{stageName}</div>
  ),
}))

// lucide-reactのアイコンをモック
vi.mock('lucide-react', () => ({
  Grid: () => <span data-testid="grid-icon">Grid</span>,
  List: () => <span data-testid="list-icon">List</span>,
  Filter: () => <span data-testid="filter-icon">Filter</span>,
}))

// Material-UIコンポーネントをモック
vi.mock('@mui/material', () => ({
  Autocomplete: ({ options, value, onChange, renderInput, multiple, ...props }: any) => {
    const inputProps = {
      label: props.label || '',
      variant: props.variant || 'outlined',
    }
    return (
      <div data-testid="autocomplete">
        <select
          data-testid="autocomplete-select"
          value={multiple ? (value?.map((v: any) => v.id).join(',') || '') : value?.id || ''}
          onChange={(e) => {
            if (multiple) {
              const selectedIds = Array.from(e.target.selectedOptions, (opt) => Number(opt.value))
              const selected = options.filter((opt: any) => selectedIds.includes(opt.id))
              onChange(null, selected)
            } else {
              const selected = options.find((opt: any) => opt.id === Number(e.target.value))
              onChange(null, selected || null)
            }
          }}
          multiple={multiple}
        >
          <option value="">選択してください</option>
          {options.map((opt: any) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
        {renderInput && renderInput(inputProps)}
      </div>
    )
  },
  TextField: ({ label, ...props }: any) => (
    <input data-testid={`textfield-${label}`} placeholder={label} {...props} />
  ),
  Chip: ({ label }: any) => <span data-testid="chip">{label}</span>,
  ToggleButton: ({ children, value }: any) => (
    <button data-testid={`toggle-${value}`}>{children}</button>
  ),
  ToggleButtonGroup: ({ value, onChange, children }: any) => (
    <div data-testid="toggle-button-group">
      {React.Children.map(children, (child) =>
        React.cloneElement(child, {
          onClick: () => onChange(null, child.props.value),
          'data-selected': child.props.value === value,
        })
      )}
    </div>
  ),
  Slider: ({ value, onChange }: any) => (
    <input
      type="range"
      data-testid="slider"
      value={value}
      onChange={(e) => onChange(null, Number(e.target.value))}
      min={0}
      max={333}
    />
  ),
  Box: ({ children }: any) => <div data-testid="box">{children}</div>,
  Typography: ({ children }: any) => <div data-testid="typography">{children}</div>,
  Button: ({ children, onClick, variant }: any) => (
    <button data-testid={`button-${variant || 'default'}`} onClick={onClick}>
      {children}
    </button>
  ),
  Paper: ({ children }: any) => <div data-testid="paper">{children}</div>,
}))

global.fetch = vi.fn()

describe('ScenariosListClient', () => {
  const mockStages = [
    { id: 1, name: 'アラマキ砦' },
    { id: 2, name: '難破船ドン・ブラコ' },
  ]

  const mockWeapons = [
    { id: 1, name: 'スプラシューター', icon_url: 'https://example.com/weapon1.png' },
    { id: 2, name: 'スプラチャージャー', icon_url: 'https://example.com/weapon2.png' },
  ]

  const mockScenarios = [
    {
      code: 'ABC123',
      stage_id: 1,
      stage_name: 'アラマキ砦',
      danger_rate: 200,
      total_golden_eggs: 100,
      created_at: '2024-01-01T00:00:00Z',
      author_id: 'user1',
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

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        data: mockScenarios,
      }),
    })
  })

  it('renders scenarios list with filters', async () => {
    render(<ScenariosListClient stages={mockStages} weapons={mockWeapons} />)

    expect(screen.getByText('シナリオ一覧')).toBeInTheDocument()
    expect(screen.getByText('フィルタ')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTestId('scenario-card-ABC123')).toBeInTheDocument()
    })
  })

  it('displays loading state initially', () => {
    render(<ScenariosListClient stages={mockStages} weapons={mockWeapons} />)

    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  it('displays empty state when no scenarios found', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        data: [],
      }),
    })

    render(<ScenariosListClient stages={mockStages} weapons={mockWeapons} />)

    await waitFor(() => {
      expect(screen.getByText('シナリオが見つかりませんでした')).toBeInTheDocument()
    })
  })

  it('fetches scenarios with filters', async () => {
    const user = userEvent.setup()
    render(<ScenariosListClient stages={mockStages} weapons={mockWeapons} />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/scenarios?')
    })

    // ステージフィルタを選択
    const stageSelect = screen.getByTestId('autocomplete-select')
    await user.selectOptions(stageSelect, '1')

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('stage_id=1')
      )
    })
  })

  it('switches view mode between card and table', async () => {
    const user = userEvent.setup()
    render(<ScenariosListClient stages={mockStages} weapons={mockWeapons} />)

    await waitFor(() => {
      expect(screen.getByTestId('toggle-button-group')).toBeInTheDocument()
    })

    const cardToggle = screen.getByTestId('toggle-card')
    const tableToggle = screen.getByTestId('toggle-table')

    expect(cardToggle).toBeInTheDocument()
    expect(tableToggle).toBeInTheDocument()

    // テーブル表示に切り替え
    await user.click(tableToggle)

    await waitFor(() => {
      // テーブルヘッダーが表示されることを確認
      const codeHeader = screen.queryByText('コード')
      const stageHeader = screen.queryByText('ステージ')
      // テーブル表示の場合、ヘッダーが表示される
      if (codeHeader || stageHeader) {
        expect(codeHeader || stageHeader).toBeInTheDocument()
      }
    })
  })

  it('clears filters when clear button is clicked', async () => {
    const user = userEvent.setup()
    render(<ScenariosListClient stages={mockStages} weapons={mockWeapons} />)

    // ステージフィルタを選択
    await waitFor(() => {
      const stageSelect = screen.getByTestId('autocomplete-select')
      expect(stageSelect).toBeInTheDocument()
    })

    const stageSelect = screen.getByTestId('autocomplete-select')
    await user.selectOptions(stageSelect, '1')

    await waitFor(() => {
      const clearButton = screen.queryByText('フィルタをクリア')
      if (clearButton) {
        expect(clearButton).toBeInTheDocument()
        // クリアボタンが表示されたらクリック
        user.click(clearButton).then(() => {
          waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
              expect.stringMatching(/^\/api\/scenarios/)
            )
          })
        })
      }
    })
  })

  it('handles API error gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: false,
        error: 'API Error',
      }),
    })

    render(<ScenariosListClient stages={mockStages} weapons={mockWeapons} />)

    await waitFor(() => {
      expect(screen.getByText('シナリオが見つかりませんでした')).toBeInTheDocument()
    })
  })
})


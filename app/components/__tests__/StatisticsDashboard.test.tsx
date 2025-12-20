import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import StatisticsDashboard from '../StatisticsDashboard'

// Rechartsをモック
vi.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'pie-chart' }, children),
  Pie: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'pie' }, children),
  Cell: ({ fill }: { fill: string }) => React.createElement('div', { 'data-testid': 'cell', style: { fill } }),
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'responsive-container' }, children),
  Legend: () => React.createElement('div', { 'data-testid': 'legend' }, 'Legend'),
  Tooltip: () => React.createElement('div', { 'data-testid': 'tooltip' }, 'Tooltip'),
}))

// ScenarioCardをモック
vi.mock('../ScenarioCard', () => ({
  default: ({ code, stageName }: { code: string; stageName: string }) =>
    React.createElement('div', { 'data-testid': 'scenario-card' }, `${code} - ${stageName}`),
}))

describe('StatisticsDashboard', () => {
  const mockStatisticsData = {
    average_golden_eggs: 125.5,
    max_golden_eggs: 200,
    total_scenarios: 10,
    stage_stats: [
      { stage_id: 1, stage_name: 'ステージ1', count: 5 },
      { stage_id: 2, stage_name: 'ステージ2', count: 3 },
      { stage_id: 3, stage_name: 'ステージ3', count: 2 },
    ],
    liked_scenarios: [
      {
        code: 'CODE1',
        stage_id: 1,
        stage_name: 'ステージ1',
        danger_rate: 100,
        total_golden_eggs: 150,
        created_at: '2024-01-01T00:00:00Z',
        weapons: [],
      },
      {
        code: 'CODE2',
        stage_id: 2,
        stage_name: 'ステージ2',
        danger_rate: 150,
        total_golden_eggs: 180,
        created_at: '2024-01-02T00:00:00Z',
        weapons: [],
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('should render statistics dashboard with initial data', () => {
    render(<StatisticsDashboard initialData={mockStatisticsData} />)

    expect(screen.getByText('平均金イクラ数')).toBeInTheDocument()
    expect(screen.getByText('125.5')).toBeInTheDocument()
    expect(screen.getByText('最高記録')).toBeInTheDocument()
    expect(screen.getByText('200')).toBeInTheDocument()
    expect(screen.getByText('総投稿数')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('ステージ別投稿数')).toBeInTheDocument()
    expect(screen.getByText('お気に入りシナリオ (2件)')).toBeInTheDocument()
  })

  it('should display stage statistics in pie chart', () => {
    render(<StatisticsDashboard initialData={mockStatisticsData} />)

    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    expect(screen.getByTestId('pie')).toBeInTheDocument()
  })

  it('should display liked scenarios', () => {
    render(<StatisticsDashboard initialData={mockStatisticsData} />)

    expect(screen.getByTestId('scenario-card')).toBeInTheDocument()
    expect(screen.getByText('CODE1 - ステージ1')).toBeInTheDocument()
  })

  it('should show loading state when fetching data', async () => {
    vi.mocked(global.fetch).mockImplementation(
      () =>
        new Promise(() => {
          // 永続的なPromise（解決しない）でローディング状態をシミュレート
        })
    )

    render(<StatisticsDashboard />)

    expect(screen.getByText('統計データを読み込み中...')).toBeInTheDocument()
  })

  it('should show error state when fetch fails', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({ success: false, error: 'Fetch failed' }),
    } as Response)

    render(<StatisticsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Fetch failed')).toBeInTheDocument()
    })
  })

  it('should show empty state when no data', () => {
    const emptyData = {
      average_golden_eggs: 0,
      max_golden_eggs: 0,
      total_scenarios: 0,
      stage_stats: [],
      liked_scenarios: [],
    }

    render(<StatisticsDashboard initialData={emptyData} />)

    expect(screen.getByText('平均金イクラ数')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('投稿がありません')).toBeInTheDocument()
    expect(screen.getByText('まだお気に入りのシナリオがありません')).toBeInTheDocument()
  })

  it('should fetch data from API when initialData is not provided', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockStatisticsData }),
    } as Response)

    render(<StatisticsDashboard />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/profile/stats')
      expect(screen.getByText('平均金イクラ数')).toBeInTheDocument()
    })
  })

  it('should display message when no liked scenarios', () => {
    const dataWithoutLikes = {
      ...mockStatisticsData,
      liked_scenarios: [],
    }

    render(<StatisticsDashboard initialData={dataWithoutLikes} />)

    expect(screen.getByText('まだお気に入りのシナリオがありません')).toBeInTheDocument()
    expect(screen.getByText(/シナリオ詳細ページで「いいね」を押すと/)).toBeInTheDocument()
  })

  it('should not display pie chart when stage_stats is empty', () => {
    const dataWithoutStages = {
      ...mockStatisticsData,
      stage_stats: [],
    }

    render(<StatisticsDashboard initialData={dataWithoutStages} />)

    expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument()
  })
})


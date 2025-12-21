import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import ScenariosPage from '../page'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}))

vi.mock('../ScenariosListClient', () => ({
  default: ({ stages, weapons }: { stages: any[]; weapons: any[] }) => (
    <div data-testid="scenarios-list-client">
      <div data-testid="stages-count">{stages.length}</div>
      <div data-testid="weapons-count">{weapons.length}</div>
    </div>
  ),
}))

describe('ScenariosPage', () => {
  const mockSupabase = {
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  it('renders ScenariosListClient with stages and weapons', async () => {
    const mockStages = [
      { id: 1, name: 'アラマキ砦' },
      { id: 2, name: '難破船ドン・ブラコ' },
    ]

    const mockWeapons = [
      { id: 1, name: 'スプラシューター', icon_url: 'https://example.com/weapon1.png' },
    ]

    const mockStagesQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockStages,
        error: null,
      }),
    }

    const mockWeaponsQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockWeapons,
        error: null,
      }),
    }

    mockSupabase.from = vi.fn((table: string) => {
      if (table === 'm_stages') return mockStagesQuery
      if (table === 'm_weapons') return mockWeaponsQuery
      return { from: vi.fn() }
    })

    const page = await ScenariosPage()
    render(page)

    expect(screen.getByTestId('scenarios-list-client')).toBeInTheDocument()
    expect(screen.getByTestId('stages-count')).toHaveTextContent('2')
    expect(screen.getByTestId('weapons-count')).toHaveTextContent('1')
  })

  it('handles empty stages and weapons', async () => {
    const mockStagesQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    }

    const mockWeaponsQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    }

    mockSupabase.from = vi.fn((table: string) => {
      if (table === 'm_stages') return mockStagesQuery
      if (table === 'm_weapons') return mockWeaponsQuery
      return { from: vi.fn() }
    })

    const page = await ScenariosPage()
    render(page)

    expect(screen.getByTestId('scenarios-list-client')).toBeInTheDocument()
    expect(screen.getByTestId('stages-count')).toHaveTextContent('0')
    expect(screen.getByTestId('weapons-count')).toHaveTextContent('0')
  })

  it('handles database errors gracefully', async () => {
    const mockStagesQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    }

    const mockWeaponsQuery = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    }

    mockSupabase.from = vi.fn((table: string) => {
      if (table === 'm_stages') return mockStagesQuery
      if (table === 'm_weapons') return mockWeaponsQuery
      return { from: vi.fn() }
    })

    const page = await ScenariosPage()
    render(page)

    expect(screen.getByTestId('scenarios-list-client')).toBeInTheDocument()
    expect(screen.getByTestId('stages-count')).toHaveTextContent('0')
    expect(screen.getByTestId('weapons-count')).toHaveTextContent('0')
  })
})


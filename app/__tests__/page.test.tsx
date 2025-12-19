import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Home from '../page'

// fetchをモック
global.fetch = vi.fn()

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // デフォルトのモックレスポンスを設定
    vi.mocked(global.fetch).mockImplementation((url: string | URL) => {
      if (typeof url === 'string') {
        if (url.includes('/api/stages')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: [
                { id: 1, name: 'アラマキ砦' },
                { id: 2, name: 'シェケナダム' },
              ],
            }),
          } as Response)
        }
        if (url.includes('/api/weapons')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: [
                { id: 1, name: 'スプラシューター', icon_url: 'https://example.com/weapon1.png' },
                { id: 2, name: 'スプラローラー', icon_url: 'https://example.com/weapon2.png' },
              ],
            }),
          } as Response)
        }
        if (url.includes('/api/scenarios')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: [],
            }),
          } as Response)
        }
      }
      return Promise.reject(new Error('Unknown URL'))
    })
  })

  it('renders the main heading', () => {
    render(<Home />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Salmon Run Scenario Hub')
  })

  it('renders filter section', () => {
    render(<Home />)
    const filterHeading = screen.getByRole('heading', { level: 2 })
    expect(filterHeading).toHaveTextContent('フィルター')
  })

  it('renders link to analyze page', () => {
    render(<Home />)
    const analyzeLink = screen.getByRole('link', { name: '画像解析' })
    expect(analyzeLink).toBeInTheDocument()
    expect(analyzeLink).toHaveAttribute('href', '/analyze')
  })

  it('fetches master data on mount', async () => {
    render(<Home />)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/stages')
      expect(global.fetch).toHaveBeenCalledWith('/api/weapons')
    })
  })

  it('fetches scenarios on mount', async () => {
    render(<Home />)
    await waitFor(() => {
      // マスタデータ取得後にシナリオ一覧が取得される
      expect(global.fetch).toHaveBeenCalledWith('/api/stages')
      expect(global.fetch).toHaveBeenCalledWith('/api/weapons')
      // シナリオ一覧はクエリパラメータ付きで呼ばれる可能性がある（空のクエリパラメータでも?が付く）
      const scenarioCalls = vi.mocked(global.fetch).mock.calls.filter((call) => {
        const url = typeof call[0] === 'string' ? call[0] : call[0].toString()
        return url.includes('/api/scenarios')
      })
      expect(scenarioCalls.length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })
})


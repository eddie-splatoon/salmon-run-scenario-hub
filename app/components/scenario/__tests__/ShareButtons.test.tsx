import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ShareButtons from '../ShareButtons'

describe('ShareButtons', () => {
  const mockWindowOpen = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // window.openをモック
    Object.defineProperty(window, 'open', {
      value: mockWindowOpen,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    // window.openのモックを削除
    delete (window as { open?: typeof window.open }).open
  })

  const defaultProps = {
    scenarioCode: 'ABC123',
    stageName: 'アラマキ砦',
    totalGoldenEggs: 150,
  }

  it('should render all share buttons', () => {
    render(<ShareButtons {...defaultProps} />)

    expect(screen.getByLabelText('𝕏で共有')).toBeInTheDocument()
    expect(screen.getByLabelText('BlueSkyで共有')).toBeInTheDocument()
    expect(screen.getByLabelText('LINEで共有')).toBeInTheDocument()
  })

  it('should open X share URL when X button is clicked', async () => {
    const user = userEvent.setup()
    render(<ShareButtons {...defaultProps} />)

    const xButton = screen.getByLabelText('𝕏で共有')
    await user.click(xButton)

    expect(mockWindowOpen).toHaveBeenCalledTimes(1)
    const callArgs = mockWindowOpen.mock.calls[0]
    const url = callArgs[0] as string
    expect(url).toContain('https://x.com/intent/post')
    // URLをパースして検証
    const urlObj = new URL(url)
    expect(urlObj.searchParams.get('text')).toContain('ステージ: アラマキ砦')
    expect(urlObj.searchParams.get('text')).toContain('金イクラ: 150')
    expect(urlObj.searchParams.get('text')).toContain('シナリオコード: ABC123')
    expect(urlObj.searchParams.get('url')).toContain('/scenarios/ABC123')
    expect(urlObj.searchParams.get('hashtags')).toContain('サーモンランNW')
    expect(callArgs[1]).toBe('_blank')
    expect(callArgs[2]).toBe('width=600,height=400')
  })

  it('should open BlueSky share URL when BlueSky button is clicked', async () => {
    const user = userEvent.setup()
    render(<ShareButtons {...defaultProps} />)

    const blueskyButton = screen.getByLabelText('BlueSkyで共有')
    await user.click(blueskyButton)

    expect(mockWindowOpen).toHaveBeenCalledTimes(1)
    const callArgs = mockWindowOpen.mock.calls[0]
    const url = callArgs[0] as string
    expect(url).toContain('https://bsky.app/intent/compose')
    // URLをパースして検証
    const urlObj = new URL(url)
    const text = decodeURIComponent(urlObj.searchParams.get('text') || '')
    expect(text).toContain('ステージ: アラマキ砦')
    expect(text).toContain('金イクラ: 150')
    expect(text).toContain('シナリオコード: ABC123')
    expect(text).toContain('/scenarios/ABC123')
    expect(callArgs[1]).toBe('_blank')
    expect(callArgs[2]).toBe('width=600,height=400')
  })

  it('should open LINE share URL when LINE button is clicked', async () => {
    const user = userEvent.setup()
    render(<ShareButtons {...defaultProps} />)

    const lineButton = screen.getByLabelText('LINEで共有')
    await user.click(lineButton)

    expect(mockWindowOpen).toHaveBeenCalledTimes(1)
    const callArgs = mockWindowOpen.mock.calls[0]
    const url = callArgs[0] as string
    expect(url).toContain('https://social-plugins.line.me/lineit/share')
    // URLをパースして検証
    const urlObj = new URL(url)
    const shareUrl = decodeURIComponent(urlObj.searchParams.get('url') || '')
    expect(shareUrl).toContain('/scenarios/ABC123')
    expect(callArgs[1]).toBe('_blank')
    expect(callArgs[2]).toBe('width=600,height=400')
  })

  it('should generate correct share text with different props', async () => {
    const user = userEvent.setup()
    const props = {
      scenarioCode: 'XYZ789',
      stageName: 'シェケナダム',
      totalGoldenEggs: 200,
    }
    render(<ShareButtons {...props} />)

    const xButton = screen.getByLabelText('𝕏で共有')
    await user.click(xButton)

    const callArgs = mockWindowOpen.mock.calls[0]
    const url = callArgs[0] as string
    const urlObj = new URL(url)
    const text = decodeURIComponent(urlObj.searchParams.get('text') || '')
    expect(text).toContain('ステージ: シェケナダム')
    expect(text).toContain('金イクラ: 200')
    expect(text).toContain('シナリオコード: XYZ789')
    const shareUrl = decodeURIComponent(urlObj.searchParams.get('url') || '')
    expect(shareUrl).toContain('/scenarios/XYZ789')
  })

  it('should use default site URL when NEXT_PUBLIC_SITE_URL is not set', async () => {
    const user = userEvent.setup()
    // 環境変数を一時的に削除（実際にはテスト環境では設定されていない可能性がある）
    const originalEnv = process.env.NEXT_PUBLIC_SITE_URL
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (process.env as any).NEXT_PUBLIC_SITE_URL

    render(<ShareButtons {...defaultProps} />)

    const xButton = screen.getByLabelText('𝕏で共有')
    await user.click(xButton)

    const callArgs = mockWindowOpen.mock.calls[0]
    const url = callArgs[0] as string
    const urlObj = new URL(url)
    const shareUrl = decodeURIComponent(urlObj.searchParams.get('url') || '')
    // デフォルトURLが使用されることを確認
    expect(shareUrl).toContain('salmon-run-scenario-hub.vercel.app')
    expect(shareUrl).toContain('/scenarios/ABC123')

    // 環境変数を復元
    if (originalEnv) {
      process.env.NEXT_PUBLIC_SITE_URL = originalEnv
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (process.env as any).NEXT_PUBLIC_SITE_URL
    }
  })
})


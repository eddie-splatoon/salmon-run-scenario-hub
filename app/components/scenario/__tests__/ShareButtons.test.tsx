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
    dangerRate: 200,
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
    // URL文字列を直接検証（エンコードされた文字列も含めて）
    expect(url).toContain('text=')
    expect(url).toContain('url=')
    expect(url).toContain('hashtags=')
    // エンコードされた文字列を検証
    expect(url).toMatch(/ステージ|%E3%82%B9%E3%83%86%E3%83%BC%E3%82%B8/)
    expect(url).toMatch(/キケン度|%E3%82%AD%E3%82%B1%E3%83%B3%E5%BA%A6/)
    expect(url).toMatch(/ABC123/)
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
    // URL文字列を直接検証
    expect(url).toContain('text=')
    // エンコードされた文字列を検証
    expect(url).toMatch(/ステージ|%E3%82%B9%E3%83%86%E3%83%BC%E3%82%B8/)
    expect(url).toMatch(/キケン度|%E3%82%AD%E3%82%B1%E3%83%B3%E5%BA%A6/)
    expect(url).toMatch(/ABC123/)
    expect(url).toMatch(/scenarios/)
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
    // URL文字列を直接検証
    expect(url).toContain('url=')
    expect(url).toMatch(/scenarios\/ABC123|scenarios%2FABC123/)
    expect(callArgs[1]).toBe('_blank')
    expect(callArgs[2]).toBe('width=600,height=400')
  })

  it('should generate correct share text with different props', async () => {
    const user = userEvent.setup()
    const props = {
      scenarioCode: 'XYZ789',
      stageName: 'シェケナダム',
      dangerRate: 300,
    }
    render(<ShareButtons {...props} />)

    const xButton = screen.getByLabelText('𝕏で共有')
    await user.click(xButton)

    const callArgs = mockWindowOpen.mock.calls[0]
    const url = callArgs[0] as string
    // URL文字列を直接検証
    expect(url).toMatch(/シェケナダム|%E3%82%B7%E3%82%A7%E3%82%B1%E3%83%8A%E3%83%80%E3%83%A0/)
    expect(url).toMatch(/XYZ789/)
    expect(url).toMatch(/scenarios\/XYZ789|scenarios%2FXYZ789/)
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
    // URL文字列を直接検証（デフォルトURLが使用されることを確認）
    expect(url).toMatch(/salmon-run-scenario-hub\.vercel\.app|salmon-run-scenario-hub%2Evercel%2Eapp/)
    expect(url).toMatch(/scenarios\/ABC123|scenarios%2FABC123/)

    // 環境変数を復元
    if (originalEnv) {
      process.env.NEXT_PUBLIC_SITE_URL = originalEnv
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (process.env as any).NEXT_PUBLIC_SITE_URL
    }
  })
})


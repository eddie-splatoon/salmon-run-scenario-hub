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
    
    // 基本的なURL構造を検証
    expect(url).toContain('https://x.com/intent/post')
    expect(url).toContain('text=')
    expect(url).toContain('url=')
    expect(url).toContain('hashtags=')
    
    // シナリオコードが含まれていることを確認
    expect(url).toContain('ABC123')
    
    // window.openの引数を確認
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
    
    // 基本的なURL構造を検証
    expect(url).toContain('https://bsky.app/intent/compose')
    expect(url).toContain('text=')
    
    // シナリオコードが含まれていることを確認
    expect(url).toContain('ABC123')
    expect(url).toContain('scenarios')
    
    // window.openの引数を確認
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
    
    // 基本的なURL構造を検証
    expect(url).toContain('https://social-plugins.line.me/lineit/share')
    expect(url).toContain('url=')
    
    // シナリオコードが含まれていることを確認
    expect(url).toContain('ABC123')
    expect(url).toContain('scenarios')
    
    // window.openの引数を確認
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
    
    // 基本的なURL構造を検証
    expect(url).toContain('https://x.com/intent/post')
    
    // 異なるpropsの値が含まれていることを確認
    expect(url).toContain('XYZ789')
    expect(url).toContain('scenarios')
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
    
    // デフォルトURLが使用されることを確認
    expect(url).toContain('salmon-run-scenario-hub')
    expect(url).toContain('vercel.app')
    expect(url).toContain('ABC123')
    expect(url).toContain('scenarios')

    // 環境変数を復元
    if (originalEnv) {
      process.env.NEXT_PUBLIC_SITE_URL = originalEnv
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (process.env as any).NEXT_PUBLIC_SITE_URL
    }
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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

    await waitFor(() => {
      expect(mockWindowOpen).toHaveBeenCalledTimes(1)
    })

    const callArgs = mockWindowOpen.mock.calls[0]
    expect(callArgs).toBeDefined()
    expect(callArgs.length).toBeGreaterThan(0)
    
    const url = callArgs[0] as string
    expect(typeof url).toBe('string')
    expect(url).toContain('https://x.com/intent/post')
    expect(url).toContain('text=')
    expect(url).toContain('url=')
    expect(url).toContain('hashtags=')
    expect(url).toContain('ABC123')
    
    if (callArgs[1]) {
      expect(callArgs[1]).toBe('_blank')
    }
    if (callArgs[2]) {
      expect(callArgs[2]).toBe('width=600,height=400')
    }
  })

  it('should open BlueSky share URL when BlueSky button is clicked', async () => {
    const user = userEvent.setup()
    render(<ShareButtons {...defaultProps} />)

    const blueskyButton = screen.getByLabelText('BlueSkyで共有')
    await user.click(blueskyButton)

    await waitFor(() => {
      expect(mockWindowOpen).toHaveBeenCalledTimes(1)
    })

    const callArgs = mockWindowOpen.mock.calls[0]
    expect(callArgs).toBeDefined()
    
    const url = callArgs[0] as string
    expect(typeof url).toBe('string')
    expect(url).toContain('https://bsky.app/intent/compose')
    expect(url).toContain('text=')
    expect(url).toContain('ABC123')
    expect(url).toContain('scenarios')
    
    if (callArgs[1]) {
      expect(callArgs[1]).toBe('_blank')
    }
    if (callArgs[2]) {
      expect(callArgs[2]).toBe('width=600,height=400')
    }
  })

  it('should open LINE share URL when LINE button is clicked', async () => {
    const user = userEvent.setup()
    render(<ShareButtons {...defaultProps} />)

    const lineButton = screen.getByLabelText('LINEで共有')
    await user.click(lineButton)

    await waitFor(() => {
      expect(mockWindowOpen).toHaveBeenCalledTimes(1)
    })

    const callArgs = mockWindowOpen.mock.calls[0]
    expect(callArgs).toBeDefined()
    
    const url = callArgs[0] as string
    expect(typeof url).toBe('string')
    expect(url).toContain('https://social-plugins.line.me/lineit/share')
    expect(url).toContain('url=')
    expect(url).toContain('ABC123')
    expect(url).toContain('scenarios')
    
    if (callArgs[1]) {
      expect(callArgs[1]).toBe('_blank')
    }
    if (callArgs[2]) {
      expect(callArgs[2]).toBe('width=600,height=400')
    }
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

    await waitFor(() => {
      expect(mockWindowOpen).toHaveBeenCalledTimes(1)
    })

    const callArgs = mockWindowOpen.mock.calls[0]
    expect(callArgs).toBeDefined()
    
    const url = callArgs[0] as string
    expect(typeof url).toBe('string')
    expect(url).toContain('https://x.com/intent/post')
    expect(url).toContain('XYZ789')
    expect(url).toContain('scenarios')
  })

  it('should use default site URL when NEXT_PUBLIC_SITE_URL is not set', async () => {
    const user = userEvent.setup()
    // 環境変数を一時的に削除
    const originalEnv = process.env.NEXT_PUBLIC_SITE_URL
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (process.env as any).NEXT_PUBLIC_SITE_URL

    render(<ShareButtons {...defaultProps} />)

    const xButton = screen.getByLabelText('𝕏で共有')
    await user.click(xButton)

    await waitFor(() => {
      expect(mockWindowOpen).toHaveBeenCalledTimes(1)
    })

    const callArgs = mockWindowOpen.mock.calls[0]
    expect(callArgs).toBeDefined()
    
    const url = callArgs[0] as string
    expect(typeof url).toBe('string')
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

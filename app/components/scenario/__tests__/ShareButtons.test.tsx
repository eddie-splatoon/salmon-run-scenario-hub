import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ShareButtons from '../ShareButtons'

describe('ShareButtons', () => {
  const mockWindowOpen = vi.fn()
  const originalWindowOpen = window.open

  beforeEach(() => {
    vi.clearAllMocks()
    window.open = mockWindowOpen
  })

  afterEach(() => {
    window.open = originalWindowOpen
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
    expect(callArgs[0]).toContain('https://x.com/intent/post')
    expect(callArgs[0]).toContain(encodeURIComponent('ステージ: アラマキ砦 / 金イクラ: 150 / シナリオコード: ABC123'))
    expect(callArgs[0]).toContain(encodeURIComponent('/scenarios/ABC123'))
    expect(callArgs[0]).toContain(encodeURIComponent('サーモンランNW,SalmonRunScenarioHub,サーモンランシナリオhub'))
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
    expect(callArgs[0]).toContain('https://bsky.app/intent/compose')
    expect(callArgs[0]).toContain(encodeURIComponent('ステージ: アラマキ砦 / 金イクラ: 150 / シナリオコード: ABC123'))
    expect(callArgs[0]).toContain(encodeURIComponent('/scenarios/ABC123'))
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
    expect(callArgs[0]).toContain('https://social-plugins.line.me/lineit/share')
    expect(callArgs[0]).toContain(encodeURIComponent('/scenarios/ABC123'))
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
    expect(callArgs[0]).toContain(encodeURIComponent('ステージ: シェケナダム / 金イクラ: 200 / シナリオコード: XYZ789'))
    expect(callArgs[0]).toContain(encodeURIComponent('/scenarios/XYZ789'))
  })

  it('should use default site URL when NEXT_PUBLIC_SITE_URL is not set', async () => {
    const user = userEvent.setup()
    // 環境変数を一時的に削除（実際にはテスト環境では設定されていない可能性がある）
    const originalEnv = process.env.NEXT_PUBLIC_SITE_URL
    delete process.env.NEXT_PUBLIC_SITE_URL

    render(<ShareButtons {...defaultProps} />)

    const xButton = screen.getByLabelText('𝕏で共有')
    await user.click(xButton)

    const callArgs = mockWindowOpen.mock.calls[0]
    // デフォルトURLが使用されることを確認
    expect(callArgs[0]).toContain('https://salmon-run-scenario-hub.vercel.app/scenarios/ABC123')

    // 環境変数を復元
    if (originalEnv) {
      process.env.NEXT_PUBLIC_SITE_URL = originalEnv
    }
  })
})


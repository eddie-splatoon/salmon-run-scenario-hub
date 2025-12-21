import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { usePathname, useSearchParams } from 'next/navigation'
import ScrollRestorer from '../ScrollRestorer'

// Next.jsのnavigationをモック
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}))

describe('ScrollRestorer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/')
    ;(useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(new URLSearchParams() as any)
    // sessionStorageとwindow.scrollToをモック
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
      },
      writable: true,
      configurable: true,
    })

    window.scrollTo = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('restores scroll position from sessionStorage', () => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn(() => '500'),
        setItem: vi.fn(),
      },
      writable: true,
    })

    render(<ScrollRestorer />)

    // タイムアウトを待つ
    vi.advanceTimersByTime(50)

    expect(window.scrollTo).toHaveBeenCalledWith(0, 500)
    expect(window.sessionStorage.getItem).toHaveBeenCalledWith('scrollPosition')
  })

  it('does not scroll when no saved position exists', () => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
      },
      writable: true,
      configurable: true,
    })
    window.scrollTo = vi.fn()

    render(<ScrollRestorer />)

    vi.advanceTimersByTime(50)

    expect(window.scrollTo).not.toHaveBeenCalled()
  })

  it('does not scroll when saved position is 0', () => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn(() => '0'),
        setItem: vi.fn(),
      },
      writable: true,
      configurable: true,
    })
    window.scrollTo = vi.fn()

    render(<ScrollRestorer />)

    vi.advanceTimersByTime(50)

    expect(window.scrollTo).not.toHaveBeenCalled()
  })

  it('cleans up timeout on unmount', () => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn(() => '500'),
        setItem: vi.fn(),
      },
      writable: true,
      configurable: true,
    })
    window.scrollTo = vi.fn()

    const { unmount } = render(<ScrollRestorer />)
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
  })

  it('restores scroll position when pathname changes', () => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn(() => '300'),
        setItem: vi.fn(),
      },
      writable: true,
      configurable: true,
    })

    const { rerender } = render(<ScrollRestorer />)

    vi.advanceTimersByTime(50)
    expect(window.scrollTo).toHaveBeenCalledWith(0, 300)

    vi.clearAllMocks()
    // パス名が変わったように再レンダー（usePathnameのモックを変更）
    ;(usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/new-path')
    rerender(<ScrollRestorer />)

    vi.advanceTimersByTime(50)
    expect(window.scrollTo).toHaveBeenCalledWith(0, 300)
  })

  it('restores scroll position when searchParams changes', () => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn(() => '700'),
        setItem: vi.fn(),
      },
      writable: true,
      configurable: true,
    })

    const { rerender } = render(<ScrollRestorer />)

    vi.advanceTimersByTime(50)
    expect(window.scrollTo).toHaveBeenCalledWith(0, 700)

    vi.clearAllMocks()
    // 検索パラメータが変わったように再レンダー（useSearchParamsのモックを変更）
    ;(useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(new URLSearchParams('?filter=test') as any)
    rerender(<ScrollRestorer />)

    vi.advanceTimersByTime(50)
    expect(window.scrollTo).toHaveBeenCalledWith(0, 700)
  })
})


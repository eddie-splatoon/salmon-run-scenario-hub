import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import HomeFilterSection from '../HomeFilterSection'

// Next.jsのnavigationをモック
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}))

// lucide-reactのアイコンをモック
vi.mock('lucide-react', () => ({
  Filter: () => <span data-testid="filter-icon">Filter</span>,
}))

describe('HomeFilterSection', () => {
  const mockReplace = vi.fn()
  const mockGet = vi.fn()
  const mockToString = vi.fn(() => '')

  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockReturnValue(null)
    mockToString.mockReturnValue('')
    ;(useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      replace: mockReplace,
    })
    ;(useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: mockGet,
      toString: mockToString,
    } as any)
    // sessionStorageをモック
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        setItem: vi.fn(),
        getItem: vi.fn(),
      },
      writable: true,
      configurable: true,
    })
    // scrollYをモック
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
      configurable: true,
    })
  })

  it('renders filter section with title', () => {
    render(<HomeFilterSection />)
    expect(screen.getByText('ハッシュタグフィルタ')).toBeInTheDocument()
    expect(screen.getByTestId('filter-icon')).toBeInTheDocument()
  })

  it('renders all available tags', () => {
    render(<HomeFilterSection />)
    
    const tags = [
      '#クマフェス',
      '#オルラン',
      '#初心者向け',
      '#未クリア',
      '#高難易度',
      '#乱獲向け',
      '#昼のみ',
      '#夜1',
      '#夜2',
      '#夜のみ',
      '#オカシラあり',
    ]

    tags.forEach((tag) => {
      expect(screen.getByText(tag)).toBeInTheDocument()
    })
  })

  it('highlights selected tags', () => {
    mockGet.mockReturnValue('クマフェス,オルラン')
    mockToString.mockReturnValue('tags=クマフェス,オルラン')

    render(<HomeFilterSection />)

    const kumafesButton = screen.getByText('#クマフェス').closest('button')
    const orlanButton = screen.getByText('#オルラン').closest('button')
    const beginnerButton = screen.getByText('#初心者向け').closest('button')

    expect(kumafesButton).toHaveClass('bg-orange-500')
    expect(orlanButton).toHaveClass('bg-orange-500')
    expect(beginnerButton).not.toHaveClass('bg-orange-500')
  })

  it('adds tag when clicking unselected tag', () => {
    mockGet.mockReturnValue(null)
    mockToString.mockReturnValue('')

    render(<HomeFilterSection />)

    const kumafesButton = screen.getByText('#クマフェス').closest('button')
    fireEvent.click(kumafesButton!)

    expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
      'scrollPosition',
      expect.any(String)
    )
    // URLSearchParamsを使用すると日本語が自動的にURLエンコードされる
    const expectedUrl = new URLSearchParams({ tags: 'クマフェス' }).toString()
    expect(mockReplace).toHaveBeenCalledWith(`/?${expectedUrl}#latest`, { scroll: false })
  })

  it('removes tag when clicking selected tag', () => {
    mockGet.mockReturnValue('クマフェス')
    mockToString.mockReturnValue('tags=クマフェス')

    render(<HomeFilterSection />)

    const kumafesButton = screen.getByText('#クマフェス').closest('button')
    fireEvent.click(kumafesButton!)

    expect(mockReplace).toHaveBeenCalledWith('/#latest', { scroll: false })
  })

  it('preserves existing tags when adding new one', () => {
    mockGet.mockReturnValue('クマフェス')
    mockToString.mockReturnValue('tags=クマフェス')

    render(<HomeFilterSection />)

    const orlanButton = screen.getByText('#オルラン').closest('button')
    fireEvent.click(orlanButton!)

    // URLSearchParamsを使用すると日本語が自動的にURLエンコードされる
    const expectedUrl = new URLSearchParams({ tags: 'クマフェス,オルラン' }).toString()
    expect(mockReplace).toHaveBeenCalledWith(
      `/?${expectedUrl}#latest`,
      { scroll: false }
    )
  })

  it('saves scroll position before navigation', () => {
    Object.defineProperty(window, 'scrollY', {
      value: 500,
      writable: true,
      configurable: true,
    })

    mockGet.mockReturnValue(null)
    mockToString.mockReturnValue('')

    render(<HomeFilterSection />)

    const kumafesButton = screen.getByText('#クマフェス').closest('button')
    fireEvent.click(kumafesButton!)

    expect(window.sessionStorage.setItem).toHaveBeenCalled()
    const setItemCalls = (window.sessionStorage.setItem as ReturnType<typeof vi.fn>).mock.calls
    const scrollPositionCall = setItemCalls.find(call => call[0] === 'scrollPosition')
    expect(scrollPositionCall).toBeDefined()
    expect(scrollPositionCall?.[1]).toBe('500')
  })

  it('adds scroll event listener', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = render(<HomeFilterSection />)

    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
  })
})


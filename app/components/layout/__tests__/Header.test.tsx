import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, usePathname } from 'next/navigation'
import Header from '../Header'

// Next.jsのナビゲーションフックをモック
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}))

// Supabaseクライアントをモック
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
      }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  })),
}))

// 認証関数をモック
vi.mock('@/lib/auth/google-auth', () => ({
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
}))

describe('Header', () => {
  const mockPush = vi.fn()
  const mockPathname = vi.fn(() => '/')

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
      refresh: vi.fn(),
    })
    ;(usePathname as ReturnType<typeof vi.fn>).mockReturnValue(mockPathname())
  })

  it('should render search input', () => {
    render(<Header />)
    const searchInput = screen.getByPlaceholderText('シナリオコードを入力')
    expect(searchInput).toBeInTheDocument()
  })

  it('should navigate to scenario detail page when search code is submitted', async () => {
    render(<Header />)
    const searchInput = screen.getByPlaceholderText('シナリオコードを入力')
    const form = searchInput.closest('form')

    fireEvent.change(searchInput, { target: { value: 'ABC1234567890123' } })
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/scenarios/ABC1234567890123')
    })
  })

  it('should clear search input after submission', async () => {
    render(<Header />)
    const searchInput = screen.getByPlaceholderText('シナリオコードを入力') as HTMLInputElement
    const form = searchInput.closest('form')

    fireEvent.change(searchInput, { target: { value: 'ABC1234567890123' } })
    expect(searchInput.value).toBe('ABC1234567890123')

    fireEvent.submit(form!)

    await waitFor(() => {
      expect(searchInput.value).toBe('')
    })
  })

  it('should not navigate when search input is empty', async () => {
    render(<Header />)
    const searchInput = screen.getByPlaceholderText('シナリオコードを入力')
    const form = searchInput.closest('form')

    fireEvent.submit(form!)

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  it('should limit search input to 16 characters', () => {
    render(<Header />)
    const searchInput = screen.getByPlaceholderText('シナリオコードを入力') as HTMLInputElement

    expect(searchInput.maxLength).toBe(16)
  })
})


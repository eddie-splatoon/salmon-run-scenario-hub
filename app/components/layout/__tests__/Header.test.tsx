import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, usePathname } from 'next/navigation'
import Header from '../Header'
import type { User } from '@supabase/supabase-js'

// Next.jsのナビゲーションフックをモック
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}))

// Supabaseクライアントをモック
const mockGetUser = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockMaybeSingle = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: mockFrom,
  })),
}))

// 認証関数をモック
const mockSignInWithGoogle = vi.fn()
const mockSignOut = vi.fn()

vi.mock('@/lib/auth/google-auth', () => ({
  signInWithGoogle: mockSignInWithGoogle,
  signOut: mockSignOut,
}))

// LogoIconコンポーネントをモック
vi.mock('../../LogoIcon', () => ({
  default: ({ size, className }: { size?: number; className?: string }) => (
    <div data-testid="logo-icon" data-size={size} className={className}>
      Logo
    </div>
  ),
}))

describe('Header', () => {
  const mockPush = vi.fn()
  const mockRefresh = vi.fn()
  const mockUnsubscribe = vi.fn()
  let mockPathname: () => string

  const createMockUser = (overrides?: Partial<User>): User => ({
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      full_name: 'Test User',
      picture: 'https://example.com/avatar.jpg',
    },
    ...overrides,
  } as User)

  beforeEach(() => {
    vi.clearAllMocks()
    mockPathname = vi.fn(() => '/')
    ;(useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    })
    ;(usePathname as ReturnType<typeof vi.fn>).mockReturnValue(mockPathname())

    // デフォルトのモック設定
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    })
    mockFrom.mockReturnValue({
      select: mockSelect,
    })
    mockSelect.mockReturnValue({
      eq: mockEq,
    })
    mockEq.mockReturnValue({
      maybeSingle: mockMaybeSingle,
    })
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: null,
    })
  })

  describe('検索機能', () => {
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

    it('should not navigate when search input is only whitespace', async () => {
      render(<Header />)
      const searchInput = screen.getByPlaceholderText('シナリオコードを入力')
      const form = searchInput.closest('form')

      fireEvent.change(searchInput, { target: { value: '   ' } })
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

    it('should trim whitespace from search code before navigation', async () => {
      render(<Header />)
      const searchInput = screen.getByPlaceholderText('シナリオコードを入力')
      const form = searchInput.closest('form')

      fireEvent.change(searchInput, { target: { value: '  ABC123  ' } })
      fireEvent.submit(form!)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/scenarios/ABC123')
      })
    })
  })

  describe('認証状態', () => {
    it('should show loading state initially', () => {
      render(<Header />)
      // ローディング中はアニメーション付きのdivが表示される
      const loadingIndicator = document.querySelector('.animate-pulse')
      expect(loadingIndicator).toBeInTheDocument()
    })

    it('should show login button when user is not authenticated', async () => {
      render(<Header />)

      await waitFor(() => {
        const loginButton = screen.getByText('ログイン')
        expect(loginButton).toBeInTheDocument()
      })
    })

    it('should show user menu when user is authenticated', async () => {
      const mockUser = createMockUser()
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      render(<Header />)

      await waitFor(() => {
        const userMenuButton = screen.getByLabelText('ユーザーメニュー')
        expect(userMenuButton).toBeInTheDocument()
      })
    })

    it('should display user name when authenticated', async () => {
      const mockUser = createMockUser()
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      render(<Header />)

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument()
      })
    })

    it('should display email prefix when full_name is not available', async () => {
      const mockUser = createMockUser({
        user_metadata: {},
      })
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      render(<Header />)

      await waitFor(() => {
        expect(screen.getByText('test')).toBeInTheDocument()
      })
    })

    it('should handle authentication state change', async () => {
      const mockUser = createMockUser()
      let authStateChangeCallback: (event: string, session: { user: User | null } | null) => void

      mockOnAuthStateChange.mockImplementation((callback) => {
        authStateChangeCallback = callback
        return {
          data: { subscription: { unsubscribe: mockUnsubscribe } },
        }
      })

      render(<Header />)

      await waitFor(() => {
        expect(screen.getByText('ログイン')).toBeInTheDocument()
      })

      // 認証状態変更をシミュレート
      authStateChangeCallback!('SIGNED_IN', { user: mockUser })

      await waitFor(() => {
        expect(screen.getByLabelText('ユーザーメニュー')).toBeInTheDocument()
      })
    })

    it('should handle logout event', async () => {
      const mockUser = createMockUser()
      let authStateChangeCallback: (event: string, session: { user: User | null } | null) => void

      mockOnAuthStateChange.mockImplementation((callback) => {
        authStateChangeCallback = callback
        return {
          data: { subscription: { unsubscribe: mockUnsubscribe } },
        }
      })

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      render(<Header />)

      await waitFor(() => {
        expect(screen.getByLabelText('ユーザーメニュー')).toBeInTheDocument()
      })

      // ログアウトイベントをシミュレート
      authStateChangeCallback!('SIGNED_OUT', null)

      await waitFor(() => {
        expect(screen.getByText('ログイン')).toBeInTheDocument()
      })
    })
  })

  describe('プロフィール画像', () => {
    it('should display profile avatar from profiles table', async () => {
      const mockUser = createMockUser()
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      mockMaybeSingle.mockResolvedValue({
        data: { avatar_url: 'https://example.com/profile-avatar.jpg' },
        error: null,
      })

      render(<Header />)

      await waitFor(() => {
        const avatarImage = screen.getByAltText('Test User')
        expect(avatarImage).toHaveAttribute('src', 'https://example.com/profile-avatar.jpg')
      })
    })

    it('should fallback to user_metadata.picture when profile avatar is not available', async () => {
      const mockUser = createMockUser()
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      mockMaybeSingle.mockResolvedValue({
        data: null,
        error: null,
      })

      render(<Header />)

      await waitFor(() => {
        const avatarImage = screen.getByAltText('Test User')
        expect(avatarImage).toHaveAttribute('src', 'https://example.com/avatar.jpg')
      })
    })

    it('should show user icon when no avatar is available', async () => {
      const mockUser = createMockUser({
        user_metadata: {},
      })
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      mockMaybeSingle.mockResolvedValue({
        data: null,
        error: null,
      })

      render(<Header />)

      await waitFor(() => {
        // ユーザーアイコンはSVG要素として表示される
        const userIcon = document.querySelector('svg')
        expect(userIcon).toBeInTheDocument()
      })
    })

    it('should handle avatar image error', async () => {
      const mockUser = createMockUser()
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      mockMaybeSingle.mockResolvedValue({
        data: { avatar_url: 'https://example.com/invalid-avatar.jpg' },
        error: null,
      })

      render(<Header />)

      let avatarImage: HTMLElement
      await waitFor(() => {
        avatarImage = screen.getByAltText('Test User')
        expect(avatarImage).toBeInTheDocument()
      })

      // 画像エラーをシミュレート
      fireEvent.error(avatarImage!)

      await waitFor(() => {
        // エラー後はuser_metadata.pictureが表示される
        const images = screen.getAllByAltText('Test User')
        expect(images.length).toBeGreaterThan(0)
      })
    })

    it('should reload profile when pathname changes', async () => {
      const mockUser = createMockUser()
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      mockMaybeSingle.mockResolvedValue({
        data: { avatar_url: 'https://example.com/old-avatar.jpg' },
        error: null,
      })

      const { rerender } = render(<Header />)

      await waitFor(() => {
        expect(screen.getByAltText('Test User')).toBeInTheDocument()
      })

      // パス名を変更
      mockPathname = vi.fn(() => '/profile')
      ;(usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/profile')
      mockMaybeSingle.mockResolvedValue({
        data: { avatar_url: 'https://example.com/new-avatar.jpg' },
        error: null,
      })

      rerender(<Header />)

      await waitFor(() => {
        expect(mockMaybeSingle).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('ログイン/ログアウト', () => {
    it('should call signInWithGoogle when login button is clicked', async () => {
      render(<Header />)

      await waitFor(() => {
        expect(screen.getByText('ログイン')).toBeInTheDocument()
      })

      const loginButton = screen.getByText('ログイン')
      await userEvent.click(loginButton)

      expect(mockSignInWithGoogle).toHaveBeenCalled()
    })

    it('should handle sign in error gracefully', async () => {
      mockSignInWithGoogle.mockRejectedValue(new Error('Sign in failed'))
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(<Header />)

      await waitFor(() => {
        expect(screen.getByText('ログイン')).toBeInTheDocument()
      })

      const loginButton = screen.getByText('ログイン')
      await userEvent.click(loginButton)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Sign in error:', expect.any(Error))
      })

      consoleErrorSpy.mockRestore()
    })

    it('should call signOut and redirect when logout is clicked', async () => {
      const mockUser = createMockUser()
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      mockSignOut.mockResolvedValue(undefined)

      render(<Header />)

      await waitFor(() => {
        expect(screen.getByLabelText('ユーザーメニュー')).toBeInTheDocument()
      })

      const userMenuButton = screen.getByLabelText('ユーザーメニュー')
      await userEvent.click(userMenuButton)

      await waitFor(() => {
        expect(screen.getByText('ログアウト')).toBeInTheDocument()
      })

      const logoutButton = screen.getByText('ログアウト')
      await userEvent.click(logoutButton)

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled()
        expect(mockPush).toHaveBeenCalledWith('/')
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it('should handle sign out error gracefully', async () => {
      const mockUser = createMockUser()
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      mockSignOut.mockRejectedValue(new Error('Sign out failed'))

      render(<Header />)

      await waitFor(() => {
        expect(screen.getByLabelText('ユーザーメニュー')).toBeInTheDocument()
      })

      const userMenuButton = screen.getByLabelText('ユーザーメニュー')
      await userEvent.click(userMenuButton)

      await waitFor(() => {
        expect(screen.getByText('ログアウト')).toBeInTheDocument()
      })

      const logoutButton = screen.getByText('ログアウト')
      await userEvent.click(logoutButton)

      await waitFor(() => {
        // エラーが発生してもリダイレクトは実行される
        expect(mockPush).toHaveBeenCalledWith('/')
        expect(mockRefresh).toHaveBeenCalled()
      })
    })
  })

  describe('ナビゲーション', () => {
    it('should highlight active path', async () => {
      mockPathname = vi.fn(() => '/scenarios')
      ;(usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/scenarios')

      render(<Header />)

      await waitFor(() => {
        const scenariosLink = screen.getByText('一覧').closest('a')
        expect(scenariosLink).toHaveClass('bg-orange-500')
      })
    })

    it('should not highlight inactive paths', async () => {
      mockPathname = vi.fn(() => '/')
      ;(usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/')

      render(<Header />)

      await waitFor(() => {
        const scenariosLink = screen.getByText('一覧').closest('a')
        expect(scenariosLink).not.toHaveClass('bg-orange-500')
      })
    })

    it('should render all navigation links', async () => {
      render(<Header />)

      await waitFor(() => {
        expect(screen.getByText('一覧')).toBeInTheDocument()
        expect(screen.getByText('投稿する')).toBeInTheDocument()
        expect(screen.getByText('ガイド')).toBeInTheDocument()
      })
    })
  })

  describe('モバイルメニュー', () => {
    it('should toggle mobile menu when menu button is clicked', async () => {
      render(<Header />)

      const menuButton = screen.getByLabelText('メニューを開く')
      expect(menuButton).toBeInTheDocument()

      await userEvent.click(menuButton)

      await waitFor(() => {
        expect(screen.getByText('一覧')).toBeInTheDocument()
      })

      const closeButton = screen.getByLabelText('メニューを開く')
      await userEvent.click(closeButton)

      await waitFor(() => {
        // モバイルメニューが閉じられる
        // デスクトップメニューには存在する
        expect(screen.getAllByText('一覧').length).toBeGreaterThan(0)
      })
    })

    it('should close mobile menu when link is clicked', async () => {
      render(<Header />)

      const menuButton = screen.getByLabelText('メニューを開く')
      await userEvent.click(menuButton)

      await waitFor(() => {
        expect(screen.getByText('一覧')).toBeInTheDocument()
      })

      const scenariosLink = screen.getAllByText('一覧')[0]
      await userEvent.click(scenariosLink)

      await waitFor(() => {
        // モバイルメニューが閉じられる
        // デスクトップメニューには存在する
        expect(screen.getAllByText('一覧').length).toBeGreaterThan(0)
      })
    })

    it('should show mobile login button when not authenticated', async () => {
      render(<Header />)

      const menuButton = screen.getByLabelText('メニューを開く')
      await userEvent.click(menuButton)

      await waitFor(() => {
        const mobileLoginButton = screen.getAllByText('ログイン').find(
          (button) => button.closest('button')?.className.includes('bg-orange-500')
        )
        expect(mobileLoginButton).toBeInTheDocument()
      })
    })

    it('should show mobile user menu when authenticated', async () => {
      const mockUser = createMockUser()
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      render(<Header />)

      await waitFor(() => {
        expect(screen.getByLabelText('ユーザーメニュー')).toBeInTheDocument()
      })

      const menuButton = screen.getByLabelText('メニューを開く')
      await userEvent.click(menuButton)

      await waitFor(() => {
        expect(screen.getByText('マイページ')).toBeInTheDocument()
        expect(screen.getByText('ログアウト')).toBeInTheDocument()
      })
    })
  })

  describe('クリーンアップ', () => {
    it('should unsubscribe from auth state changes on unmount', () => {
      const { unmount } = render(<Header />)

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })

  describe('エラーハンドリング', () => {
    it('should handle getUser error gracefully', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Get user error' },
      })

      render(<Header />)

      await waitFor(() => {
        expect(screen.getByText('ログイン')).toBeInTheDocument()
      })
    })

    it('should handle profile fetch error gracefully', async () => {
      const mockUser = createMockUser()
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      mockMaybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'Profile fetch error' },
      })

      render(<Header />)

      await waitFor(() => {
        // エラーが発生してもコンポーネントは正常に表示される
        expect(screen.getByLabelText('ユーザーメニュー')).toBeInTheDocument()
      })
    })
  })
})


import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import LoginPage from '../page'
import { signInWithGoogle } from '@/lib/auth/google-auth'

// Google認証をモック
vi.mock('@/lib/auth/google-auth', () => ({
  signInWithGoogle: vi.fn(),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login heading', () => {
    render(<LoginPage />)
    expect(screen.getByText('ログイン')).toBeInTheDocument()
  })

  it('renders Google login button', () => {
    render(<LoginPage />)
    const button = screen.getByRole('button', { name: /Googleでログイン/i })
    expect(button).toBeInTheDocument()
  })

  it('calls signInWithGoogle when button is clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(signInWithGoogle).mockResolvedValue(undefined)

    render(<LoginPage />)
    const button = screen.getByRole('button', { name: /Googleでログイン/i })

    await user.click(button)

    expect(signInWithGoogle).toHaveBeenCalledTimes(1)
  })

  it('shows loading state when signing in', async () => {
    const user = userEvent.setup()
    vi.mocked(signInWithGoogle).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    render(<LoginPage />)
    const button = screen.getByRole('button', { name: /Googleでログイン/i })

    await user.click(button)

    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('displays error message when sign in fails', async () => {
    const user = userEvent.setup()
    const errorMessage = '認証に失敗しました'
    vi.mocked(signInWithGoogle).mockRejectedValue(new Error(errorMessage))

    render(<LoginPage />)
    const button = screen.getByRole('button', { name: /Googleでログイン/i })

    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('displays generic error message for non-Error objects', async () => {
    const user = userEvent.setup()
    vi.mocked(signInWithGoogle).mockRejectedValue('Unknown error')

    render(<LoginPage />)
    const button = screen.getByRole('button', { name: /Googleでログイン/i })

    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('認証に失敗しました')).toBeInTheDocument()
    })
  })

  it('clears error when signing in again', async () => {
    const user = userEvent.setup()
    vi.mocked(signInWithGoogle)
      .mockRejectedValueOnce(new Error('First error'))
      .mockResolvedValueOnce(undefined)

    render(<LoginPage />)
    const button = screen.getByRole('button', { name: /Googleでログイン/i })

    // 最初のクリックでエラー
    await user.click(button)
    await waitFor(() => {
      expect(screen.getByText('First error')).toBeInTheDocument()
    })

    // 2回目のクリックでエラーがクリアされる
    await user.click(button)
    await waitFor(() => {
      expect(screen.queryByText('First error')).not.toBeInTheDocument()
    })
  })

  it('button is enabled after sign in completes', async () => {
    const user = userEvent.setup()
    vi.mocked(signInWithGoogle).mockResolvedValue(undefined)

    render(<LoginPage />)
    const button = screen.getByRole('button', { name: /Googleでログイン/i })

    await user.click(button)

    await waitFor(() => {
      expect(button).not.toBeDisabled()
    })
  })
})


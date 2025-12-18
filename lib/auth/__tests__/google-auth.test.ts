import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signInWithGoogle, signOut, getCurrentUser, getSession } from '../google-auth'
import { createClient } from '@/lib/supabase/client'

// Supabaseクライアントをモック
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

describe('Google Auth', () => {
  const mockSupabase = {
    auth: {
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockReturnValue(mockSupabase as any)
  })

  describe('signInWithGoogle', () => {
    it('should call signInWithOAuth with correct parameters', async () => {
      const mockData = { url: 'https://example.com/auth' }
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ data: mockData, error: null })

      const result = await signInWithGoogle()

      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback'),
        },
      })
      expect(result).toEqual(mockData)
    })

    it('should throw error when signInWithOAuth fails', async () => {
      const mockError = { message: 'Authentication failed' }
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ data: null, error: mockError })

      await expect(signInWithGoogle()).rejects.toEqual(mockError)
    })
  })

  describe('signOut', () => {
    it('should call signOut successfully', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      await signOut()

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })

    it('should throw error when signOut fails', async () => {
      const mockError = { message: 'Sign out failed' }
      mockSupabase.auth.signOut.mockResolvedValue({ error: mockError })

      await expect(signOut()).rejects.toEqual(mockError)
    })
  })

  describe('getCurrentUser', () => {
    it('should return user when authenticated', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const user = await getCurrentUser()

      expect(user).toEqual(mockUser)
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
    })

    it('should throw error when getUser fails', async () => {
      const mockError = { message: 'Failed to get user' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: mockError,
      })

      await expect(getCurrentUser()).rejects.toEqual(mockError)
    })
  })

  describe('getSession', () => {
    it('should return session when available', async () => {
      const mockSession = { access_token: 'token', user: { id: '123' } }
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const session = await getSession()

      expect(session).toEqual(mockSession)
      expect(mockSupabase.auth.getSession).toHaveBeenCalled()
    })

    it('should throw error when getSession fails', async () => {
      const mockError = { message: 'Failed to get session' }
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: mockError,
      })

      await expect(getSession()).rejects.toEqual(mockError)
    })
  })
})


import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../users/[id]/route'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// モック設定
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}))

describe('GET /api/users/[id]', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = {
      from: vi.fn(),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase)
  })

  it('returns user profile when profile exists', async () => {
    const mockProfile = {
      user_id: 'user-123',
      display_name: 'Test User',
      avatar_url: 'https://example.com/avatar.png',
    }

    const profilesQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      }),
    }

    mockSupabase.from.mockReturnValue(profilesQuery)

    const request = new NextRequest('http://localhost:3000/api/users/user-123')
    const response = await GET(request, { params: Promise.resolve({ id: 'user-123' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual({
      id: 'user-123',
      email: null, // 自分以外のユーザーの場合はemailは返さない
      name: 'Test User',
      avatar_url: 'https://example.com/avatar.png',
    })
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
    expect(profilesQuery.eq).toHaveBeenCalledWith('user_id', 'user-123')
  })

  it('returns user info with email when requesting own profile', async () => {
    const mockProfile = {
      user_id: 'user-123',
      display_name: 'Test User',
      avatar_url: 'https://example.com/avatar.png',
    }

    const profilesQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      }),
    }

    mockSupabase.from.mockReturnValue(profilesQuery)
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      },
    })

    const request = new NextRequest('http://localhost:3000/api/users/user-123')
    const response = await GET(request, { params: Promise.resolve({ id: 'user-123' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data?.email).toBe('test@example.com')
  })

  it('returns auth user info when profile does not exist but user is authenticated', async () => {
    const profilesQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    }

    mockSupabase.from.mockReturnValue(profilesQuery)
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: {
            full_name: 'Test User',
            picture: 'https://example.com/picture.png',
          },
        },
      },
    })

    const request = new NextRequest('http://localhost:3000/api/users/user-123')
    const response = await GET(request, { params: Promise.resolve({ id: 'user-123' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      avatar_url: 'https://example.com/picture.png',
    })
  })

  it('returns empty user info when profile does not exist and user is not authenticated', async () => {
    const profilesQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    }

    mockSupabase.from.mockReturnValue(profilesQuery)
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
    })

    const request = new NextRequest('http://localhost:3000/api/users/user-123')
    const response = await GET(request, { params: Promise.resolve({ id: 'user-123' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual({
      id: 'user-123',
      email: null,
      name: null,
      avatar_url: null,
    })
  })

  it('handles database errors', async () => {
    const profilesQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    }

    mockSupabase.from.mockReturnValue(profilesQuery)

    const request = new NextRequest('http://localhost:3000/api/users/user-123')
    const response = await GET(request, { params: Promise.resolve({ id: 'user-123' }) })
    const data = await response.json()

    // エラーが発生してもプロフィール情報が存在しない場合として処理される
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('handles unexpected errors', async () => {
    vi.mocked(createClient).mockRejectedValue(new Error('Unexpected error'))

    const request = new NextRequest('http://localhost:3000/api/users/user-123')
    const response = await GET(request, { params: Promise.resolve({ id: 'user-123' }) })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toContain('予期しないエラー')
  })
})


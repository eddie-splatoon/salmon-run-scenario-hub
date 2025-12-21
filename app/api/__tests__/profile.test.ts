import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { PUT } from '../profile/route'
import { createClient } from '@/lib/supabase/server'

// Supabaseクライアントをモック
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('PUT /api/profile', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
      updateUser: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  it('should update profile successfully', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSupabase.auth.updateUser.mockResolvedValue({
      data: { user: { ...mockUser, user_metadata: { full_name: 'Updated Name' } } },
      error: null,
    })

    mockSupabase.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    })

    const request = new NextRequest('http://localhost:3000/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Name' }),
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
      data: {
        full_name: 'Updated Name',
      },
    })
  })

  it('should return 401 when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const request = new NextRequest('http://localhost:3000/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Name' }),
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('認証が必要です')
  })

  it('should return 400 when name is empty', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ name: '   ' }),
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('ユーザー名を入力してください')
  })

  it('should return 400 when name is too long', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const longName = 'a'.repeat(51)

    const request = new NextRequest('http://localhost:3000/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ name: longName }),
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('ユーザー名は50文字以内で入力してください')
  })

  it('should return 500 when update fails', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSupabase.auth.updateUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Update failed' },
    })

    const request = new NextRequest('http://localhost:3000/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Name' }),
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toContain('プロフィールの更新に失敗しました')
  })

  it('should return 400 when request body is invalid JSON', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/profile', {
      method: 'PUT',
      body: 'invalid json',
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('リクエストボディの解析に失敗しました')
  })
})


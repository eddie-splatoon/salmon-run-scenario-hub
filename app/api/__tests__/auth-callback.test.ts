import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../../auth/callback/route'
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

describe('GET /auth/callback', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = {
      auth: {
        exchangeCodeForSession: vi.fn(),
      },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase)
  })

  it('redirects to next path after successful authentication', async () => {
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/auth/callback?code=test-code&next=/dashboard')
    const response = await GET(request)

    expect(response.status).toBe(307) // Redirect
    expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard')
    expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('test-code')
  })

  it('redirects to home when next parameter is not provided', async () => {
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/auth/callback?code=test-code')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/')
  })

  it('redirects to login page with error when code exchange fails', async () => {
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
      error: { message: 'Invalid code' },
    })

    const request = new NextRequest('http://localhost:3000/auth/callback?code=invalid-code')
    const response = await GET(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('/auth/login')
    expect(location).toContain('error=Invalid%20code')
  })

  it('redirects to home when no code is provided', async () => {
    const request = new NextRequest('http://localhost:3000/auth/callback')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/')
    expect(mockSupabase.auth.exchangeCodeForSession).not.toHaveBeenCalled()
  })
})


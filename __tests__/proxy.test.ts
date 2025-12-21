import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { proxy } from '../proxy'
import { NextRequest } from 'next/server'

// モック設定
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
      }),
    },
  })),
}))

describe('proxy', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns NextResponse', async () => {
    const { createServerClient } = await import('@supabase/ssr')
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: null },
    })
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
    } as any)

    const request = new NextRequest('http://localhost:3000/', {
      headers: new Headers(),
    })
    const response = await proxy(request)

    expect(response).toBeDefined()
    expect(response.status).toBe(200)
  })

  it('creates Supabase client and refreshes session', async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: null },
    })

    const { createServerClient } = await import('@supabase/ssr')
    const mockCreateServerClient = vi.mocked(createServerClient)
    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
    } as any)

        const request = new NextRequest('http://localhost:3000/', {
          headers: new Headers(),
        })
        await proxy(request)

    expect(mockCreateServerClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      })
    )
    expect(mockGetUser).toHaveBeenCalled()
  })

  it('handles authenticated user', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    }
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: mockUser },
    })

    const { createServerClient } = await import('@supabase/ssr')
    const mockCreateServerClient = vi.mocked(createServerClient)
    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
    } as any)

    const request = new NextRequest('http://localhost:3000/', {
      headers: new Headers(),
    })
    const response = await proxy(request)

    expect(response).toBeDefined()
    expect(mockGetUser).toHaveBeenCalled()
  })

  it('handles cookie operations', async () => {
    const { createServerClient } = await import('@supabase/ssr')
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: null },
    })
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
    } as any)

    const headers = new Headers()
    headers.set('cookie', 'test-cookie=test-value')
    const request = new NextRequest('http://localhost:3000/', {
      headers,
    })

    const response = await proxy(request)

    expect(response).toBeDefined()
    expect(request.cookies.getAll()).toBeDefined()
  })
})


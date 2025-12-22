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

    const request = new NextRequest('http://localhost:3000/')
    // NextRequestのheadersプロパティがHeadersインスタンスであることを確認
    if (!(request.headers instanceof Headers)) {
      // headersがHeadersインスタンスでない場合、新しいHeadersインスタンスを作成
      Object.defineProperty(request, 'headers', {
        value: new Headers(),
        writable: true,
        configurable: true,
      })
    }
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

        const request = new NextRequest('http://localhost:3000/')
        // NextRequestのheadersプロパティがHeadersインスタンスであることを確認
        if (!(request.headers instanceof Headers)) {
          // headersがHeadersインスタンスでない場合、新しいHeadersインスタンスを作成
          Object.defineProperty(request, 'headers', {
            value: new Headers(),
            writable: true,
            configurable: true,
          })
        }
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

    const request = new NextRequest('http://localhost:3000/')
    // NextRequestのheadersプロパティがHeadersインスタンスであることを確認
    if (!(request.headers instanceof Headers)) {
      // headersがHeadersインスタンスでない場合、新しいHeadersインスタンスを作成
      Object.defineProperty(request, 'headers', {
        value: new Headers(),
        writable: true,
        configurable: true,
      })
    }
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

    const request = new NextRequest('http://localhost:3000/')
    // NextRequestのheadersプロパティがHeadersインスタンスであることを確認
    if (!(request.headers instanceof Headers)) {
      // headersがHeadersインスタンスでない場合、新しいHeadersインスタンスを作成
      Object.defineProperty(request, 'headers', {
        value: new Headers({
          'cookie': 'test-cookie=test-value',
        }),
        writable: true,
        configurable: true,
      })
    } else {
      // headersが既にHeadersインスタンスの場合、cookieを設定
      request.headers.set('cookie', 'test-cookie=test-value')
    }

    const response = await proxy(request)

    expect(response).toBeDefined()
    expect(request.cookies.getAll()).toBeDefined()
  })

  describe('Security Headers', () => {
    it('sets X-Content-Type-Options header', async () => {
      const { createServerClient } = await import('@supabase/ssr')
      const mockGetUser = vi.fn().mockResolvedValue({
        data: { user: null },
      })
      vi.mocked(createServerClient).mockReturnValue({
        auth: {
          getUser: mockGetUser,
        },
      } as any)

      const request = new NextRequest('http://localhost:3000/')
      if (!(request.headers instanceof Headers)) {
        Object.defineProperty(request, 'headers', {
          value: new Headers(),
          writable: true,
          configurable: true,
        })
      }
      const response = await proxy(request)

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    })

    it('sets X-Frame-Options header', async () => {
      const { createServerClient } = await import('@supabase/ssr')
      const mockGetUser = vi.fn().mockResolvedValue({
        data: { user: null },
      })
      vi.mocked(createServerClient).mockReturnValue({
        auth: {
          getUser: mockGetUser,
        },
      } as any)

      const request = new NextRequest('http://localhost:3000/')
      if (!(request.headers instanceof Headers)) {
        Object.defineProperty(request, 'headers', {
          value: new Headers(),
          writable: true,
          configurable: true,
        })
      }
      const response = await proxy(request)

      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    })

    it('sets X-XSS-Protection header', async () => {
      const { createServerClient } = await import('@supabase/ssr')
      const mockGetUser = vi.fn().mockResolvedValue({
        data: { user: null },
      })
      vi.mocked(createServerClient).mockReturnValue({
        auth: {
          getUser: mockGetUser,
        },
      } as any)

      const request = new NextRequest('http://localhost:3000/')
      if (!(request.headers instanceof Headers)) {
        Object.defineProperty(request, 'headers', {
          value: new Headers(),
          writable: true,
          configurable: true,
        })
      }
      const response = await proxy(request)

      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block')
    })

    it('sets Referrer-Policy header', async () => {
      const { createServerClient } = await import('@supabase/ssr')
      const mockGetUser = vi.fn().mockResolvedValue({
        data: { user: null },
      })
      vi.mocked(createServerClient).mockReturnValue({
        auth: {
          getUser: mockGetUser,
        },
      } as any)

      const request = new NextRequest('http://localhost:3000/')
      if (!(request.headers instanceof Headers)) {
        Object.defineProperty(request, 'headers', {
          value: new Headers(),
          writable: true,
          configurable: true,
        })
      }
      const response = await proxy(request)

      expect(response.headers.get('Referrer-Policy')).toBe(
        'strict-origin-when-cross-origin'
      )
    })

    it('sets Permissions-Policy header', async () => {
      const { createServerClient } = await import('@supabase/ssr')
      const mockGetUser = vi.fn().mockResolvedValue({
        data: { user: null },
      })
      vi.mocked(createServerClient).mockReturnValue({
        auth: {
          getUser: mockGetUser,
        },
      } as any)

      const request = new NextRequest('http://localhost:3000/')
      if (!(request.headers instanceof Headers)) {
        Object.defineProperty(request, 'headers', {
          value: new Headers(),
          writable: true,
          configurable: true,
        })
      }
      const response = await proxy(request)

      expect(response.headers.get('Permissions-Policy')).toBe(
        'camera=(), microphone=(), geolocation=(), interest-cohort=()'
      )
    })

    it('sets Content-Security-Policy header', async () => {
      const { createServerClient } = await import('@supabase/ssr')
      const mockGetUser = vi.fn().mockResolvedValue({
        data: { user: null },
      })
      vi.mocked(createServerClient).mockReturnValue({
        auth: {
          getUser: mockGetUser,
        },
      } as any)

      const request = new NextRequest('http://localhost:3000/')
      if (!(request.headers instanceof Headers)) {
        Object.defineProperty(request, 'headers', {
          value: new Headers(),
          writable: true,
          configurable: true,
        })
      }
      const response = await proxy(request)

      const csp = response.headers.get('Content-Security-Policy')
      expect(csp).toBeDefined()
      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain("script-src 'self'")
      expect(csp).toContain("style-src 'self'")
    })

    it('sets Strict-Transport-Security header for HTTPS requests', async () => {
      const { createServerClient } = await import('@supabase/ssr')
      const mockGetUser = vi.fn().mockResolvedValue({
        data: { user: null },
      })
      vi.mocked(createServerClient).mockReturnValue({
        auth: {
          getUser: mockGetUser,
        },
      } as any)

      const request = new NextRequest('https://localhost:3000/')
      if (!(request.headers instanceof Headers)) {
        Object.defineProperty(request, 'headers', {
          value: new Headers(),
          writable: true,
          configurable: true,
        })
      }
      const response = await proxy(request)

      expect(response.headers.get('Strict-Transport-Security')).toBe(
        'max-age=31536000; includeSubDomains; preload'
      )
    })

    it('does not set Strict-Transport-Security header for HTTP requests', async () => {
      const { createServerClient } = await import('@supabase/ssr')
      const mockGetUser = vi.fn().mockResolvedValue({
        data: { user: null },
      })
      vi.mocked(createServerClient).mockReturnValue({
        auth: {
          getUser: mockGetUser,
        },
      } as any)

      const request = new NextRequest('http://localhost:3000/')
      if (!(request.headers instanceof Headers)) {
        Object.defineProperty(request, 'headers', {
          value: new Headers(),
          writable: true,
          configurable: true,
        })
      }
      const response = await proxy(request)

      expect(response.headers.get('Strict-Transport-Security')).toBeNull()
    })
  })
})


import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createClient } from '../server'

// モック設定
const mockGetAll = vi.fn(() => [])
const mockSet = vi.fn()

const mockCookieStore = {
  getAll: mockGetAll,
  set: mockSet,
}

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}))

const mockCreateServerClient = vi.fn((url, key, options) => ({
  url,
  key,
  options,
  type: 'server',
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: mockCreateServerClient,
}))

describe('createClient (server)', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    mockGetAll.mockReturnValue([])
    mockSet.mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('基本機能', () => {
    it('creates a server client with correct URL and key', async () => {
      const client = await createClient()

      expect(client.url).toBe('https://test.supabase.co')
      expect(client.key).toBe('test-anon-key')
      expect(client.type).toBe('server')
    })

    it('uses environment variables from process.env', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://custom.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'custom-key'

      const client = await createClient()

      expect(client.url).toBe('https://custom.supabase.co')
      expect(client.key).toBe('custom-key')
    })

    it('provides cookie handlers', async () => {
      await createClient()

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
    })
  })

  describe('Cookie処理', () => {
    it('getAll returns all cookies from cookieStore', async () => {
      const mockCookies = [
        { name: 'cookie1', value: 'value1' },
        { name: 'cookie2', value: 'value2' },
      ]
      mockGetAll.mockReturnValue(mockCookies)

      await createClient()

      const callArgs = mockCreateServerClient.mock.calls[0]
      const cookieOptions = callArgs[2]
      const getAllResult = cookieOptions.cookies.getAll()

      expect(getAllResult).toEqual(mockCookies)
      expect(mockGetAll).toHaveBeenCalled()
    })

    it('setAll sets all cookies using cookieStore.set', async () => {
      await createClient()

      const callArgs = mockCreateServerClient.mock.calls[0]
      const cookieOptions = callArgs[2]
      const cookiesToSet = [
        { name: 'cookie1', value: 'value1', options: { httpOnly: true } },
        { name: 'cookie2', value: 'value2', options: { secure: true } },
      ]

      cookieOptions.cookies.setAll(cookiesToSet)

      expect(mockSet).toHaveBeenCalledTimes(2)
      expect(mockSet).toHaveBeenCalledWith('cookie1', 'value1', { httpOnly: true })
      expect(mockSet).toHaveBeenCalledWith('cookie2', 'value2', { secure: true })
    })

    it('setAll handles errors gracefully when called from Server Component', async () => {
      mockSet.mockImplementation(() => {
        throw new Error('Cannot set cookie in Server Component')
      })

      await createClient()

      const callArgs = mockCreateServerClient.mock.calls[0]
      const cookieOptions = callArgs[2]
      const cookiesToSet = [
        { name: 'cookie1', value: 'value1', options: {} },
      ]

      // エラーが発生しても例外を投げない
      expect(() => {
        cookieOptions.cookies.setAll(cookiesToSet)
      }).not.toThrow()
    })

    it('setAll handles empty array', async () => {
      await createClient()

      const callArgs = mockCreateServerClient.mock.calls[0]
      const cookieOptions = callArgs[2]

      expect(() => {
        cookieOptions.cookies.setAll([])
      }).not.toThrow()

      expect(mockSet).not.toHaveBeenCalled()
    })

    it('getAll returns empty array when no cookies exist', async () => {
      mockGetAll.mockReturnValue([])

      await createClient()

      const callArgs = mockCreateServerClient.mock.calls[0]
      const cookieOptions = callArgs[2]
      const getAllResult = cookieOptions.cookies.getAll()

      expect(getAllResult).toEqual([])
    })
  })

  describe('環境変数', () => {
    it('uses NEXT_PUBLIC_SUPABASE_URL from environment', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://env-test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'env-key'

      await createClient()

      expect(mockCreateServerClient).toHaveBeenCalledWith(
        'https://env-test.supabase.co',
        'env-key',
        expect.any(Object)
      )
    })

    it('handles missing environment variables gracefully', async () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      await createClient()

      expect(mockCreateServerClient).toHaveBeenCalledWith(
        undefined,
        undefined,
        expect.any(Object)
      )

      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey
    })
  })

  describe('非同期処理', () => {
    it('awaits cookies() before creating client', async () => {
      let cookiesResolved = false
      const { cookies } = await import('next/headers')
      const originalCookies = vi.mocked(cookies)

      vi.mocked(cookies).mockImplementation(() => {
        return Promise.resolve({
          ...mockCookieStore,
          getAll: () => {
            cookiesResolved = true
            return mockGetAll()
          },
        })
      })

      await createClient()

      expect(cookiesResolved).toBe(true)

      vi.mocked(cookies).mockImplementation(originalCookies)
    })

    it('creates new client instance on each call', async () => {
      const client1 = await createClient()
      const client2 = await createClient()

      expect(client1).not.toBe(client2)
      expect(mockCreateServerClient).toHaveBeenCalledTimes(2)
    })
  })

  describe('型安全性', () => {
    it('passes Database type to createServerClient', async () => {
      await createClient()

      // createServerClientが呼ばれたことを確認
      expect(mockCreateServerClient).toHaveBeenCalled()
      
      // 型パラメータは実行時には確認できないが、TypeScriptの型チェックで検証される
      const callArgs = mockCreateServerClient.mock.calls[0]
      expect(callArgs).toHaveLength(3)
    })
  })

  describe('エラーハンドリング', () => {
    it('handles cookie store errors gracefully', async () => {
      const { cookies } = await import('next/headers')
      vi.mocked(cookies).mockRejectedValueOnce(new Error('Cookie store error'))

      await expect(createClient()).rejects.toThrow('Cookie store error')
    })

    it('handles createServerClient errors', async () => {
      mockCreateServerClient.mockImplementationOnce(() => {
        throw new Error('Failed to create client')
      })

      await expect(createClient()).rejects.toThrow('Failed to create client')
    })
  })
})


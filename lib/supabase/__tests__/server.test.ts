import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createClient } from '../server'

// モック設定
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((url, key, options) => ({
    url,
    key,
    options,
    type: 'server',
  })),
}))

describe('createClient (server)', () => {
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

  it('creates a server client with correct URL and key', async () => {
    const client = await createClient()

    expect(client.url).toBe('https://test.supabase.co')
    expect(client.key).toBe('test-anon-key')
    expect(client.type).toBe('server')
  })

  it('provides cookie handlers', async () => {
    const { createServerClient } = await import('@supabase/ssr')
    
    await createClient()

    expect(createServerClient).toHaveBeenCalledWith(
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

  it('uses environment variables from process.env', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://custom.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'custom-key'

    const client = await createClient()

    expect(client.url).toBe('https://custom.supabase.co')
    expect(client.key).toBe('custom-key')
  })
})


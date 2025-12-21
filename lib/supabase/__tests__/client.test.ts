import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createClient } from '../client'

// モック設定
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn((url, key) => ({
    url,
    key,
    type: 'browser',
  })),
}))

describe('createClient (browser)', () => {
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

  it('creates a browser client with correct URL and key', () => {
    const client = createClient()

    expect(client.url).toBe('https://test.supabase.co')
    expect(client.key).toBe('test-anon-key')
    expect(client.type).toBe('browser')
  })

  it('uses environment variables from process.env', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://custom.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'custom-key'

    const client = createClient()

    expect(client.url).toBe('https://custom.supabase.co')
    expect(client.key).toBe('custom-key')
  })
})


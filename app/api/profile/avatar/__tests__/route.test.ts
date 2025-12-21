import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('/api/profile/avatar', () => {
  const mockSupabase = {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  describe('POST', () => {
    it('uploads avatar for authenticated user', async () => {
      const mockUser = { id: 'user1' }
      const fileContent = new Uint8Array([1, 2, 3, 4])
      const imageFile = new File([fileContent], 'avatar.png', { type: 'image/png' })
      
      // arrayBufferメソッドをモック
      imageFile.arrayBuffer = vi.fn().mockResolvedValue(fileContent.buffer)

      const mockAuth = {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      }

      const mockProfilesQuery = {
        from: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockResolvedValue({
          error: null,
        }),
      }

      mockSupabase.auth = mockAuth
      mockSupabase.from = vi.fn(() => mockProfilesQuery)

      const formData = new FormData()
      formData.append('image', imageFile)

      const request = new NextRequest('http://localhost/api/profile/avatar', {
        method: 'POST',
      })
      vi.spyOn(request, 'formData').mockResolvedValue(formData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data?.avatar_url).toBeDefined()
    })

    it('returns 401 for unauthenticated user', async () => {
      const mockAuth = {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' },
        }),
      }

      mockSupabase.auth = mockAuth

      const formData = new FormData()
      const imageFile = new File(['test'], 'avatar.png', { type: 'image/png' })
      formData.append('image', imageFile)

      const request = new NextRequest('http://localhost/api/profile/avatar', {
        method: 'POST',
      })
      vi.spyOn(request, 'formData').mockResolvedValue(formData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('認証が必要です')
    })

    it('returns 400 when no image file is provided', async () => {
      const mockUser = { id: 'user1' }

      const mockAuth = {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      }

      mockSupabase.auth = mockAuth

      const formData = new FormData()
      const request = new NextRequest('http://localhost/api/profile/avatar', {
        method: 'POST',
      })
      vi.spyOn(request, 'formData').mockResolvedValue(formData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('画像ファイルが必要です')
    })

    it('returns 400 when file size exceeds 5MB', async () => {
      const mockUser = { id: 'user1' }
      // 5MBを超えるファイルサイズをシミュレート
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', {
        type: 'image/png',
      })

      const mockAuth = {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      }

      mockSupabase.auth = mockAuth

      const formData = new FormData()
      formData.append('image', largeFile)

      const request = new NextRequest('http://localhost/api/profile/avatar', {
        method: 'POST',
      })
      vi.spyOn(request, 'formData').mockResolvedValue(formData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('画像サイズは5MB以下である必要があります')
    })

    it('returns 400 when file is not an image', async () => {
      const mockUser = { id: 'user1' }
      const textFile = new File(['test'], 'document.txt', { type: 'text/plain' })

      const mockAuth = {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      }

      mockSupabase.auth = mockAuth

      const formData = new FormData()
      formData.append('image', textFile)

      const request = new NextRequest('http://localhost/api/profile/avatar', {
        method: 'POST',
      })
      vi.spyOn(request, 'formData').mockResolvedValue(formData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('画像ファイルである必要があります')
    })
  })
})


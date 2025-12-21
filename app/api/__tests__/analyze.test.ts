import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '../analyze/route'
import { NextRequest } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { lookupStageId, lookupWeaponIds } from '@/lib/utils/master-lookup'

// モック設定
vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: vi.fn(),
  }
})
vi.mock('@/lib/utils/master-lookup', () => ({
  lookupStageId: vi.fn(),
  lookupWeaponIds: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('POST /api/analyze', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    process.env.GEMINI_API_KEY = 'test-api-key'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns 500 when GEMINI_API_KEY is not configured', async () => {
    delete process.env.GEMINI_API_KEY

    // Fileオブジェクトを作成して、arrayBufferメソッドをモック
    const fileContent = new Uint8Array([1, 2, 3])
    const file = new File([fileContent], 'test.jpg', { type: 'image/jpeg' })
    // arrayBufferメソッドが正しく動作するように確認
    const formData = new FormData()
    formData.append('image', file)

    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: formData,
    })
    // formData()をモックして、実際のFileオブジェクトを含むFormDataを返す
    vi.spyOn(request, 'formData').mockResolvedValue(formData)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('GEMINI_API_KEY is not configured')
  })

  it('returns 400 when image file is missing', async () => {
    // 空のFormDataをbodyに設定すると、NextRequestがformData()を呼び出した際にエラーが発生する可能性がある
    // そのため、request.formData()をモックして空のFormDataを返すようにする
    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
    })
    const emptyFormData = new FormData()
    vi.spyOn(request, 'formData').mockResolvedValue(emptyFormData)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Image file is required')
  })

  it('successfully analyzes image and returns result', async () => {
    const mockGenerateContent = vi.fn().mockResolvedValue({
      response: {
        text: vi.fn().mockReturnValue(JSON.stringify({
          scenario_code: 'ABC123',
          stage_name: 'アラマキ砦',
          danger_rate: 200,
          total_golden_eggs: 150,
          weapons: ['スプラシューター', 'スプラチャージャー'],
          waves: [
            { wave_number: 1, tide: 'low', event: null, delivered_count: 50, quota: 50, cleared: true },
            { wave_number: 2, tide: 'normal', event: 'ラッシュ', delivered_count: 52, quota: 55, cleared: true },
            { wave_number: 3, tide: 'high', event: null, delivered_count: 48, quota: 50, cleared: true },
          ],
        })),
      },
    })

    const mockModel = {
      generateContent: mockGenerateContent,
    }

    const mockGenAI = {
      getGenerativeModel: vi.fn().mockReturnValue(mockModel),
    }

    vi.mocked(GoogleGenerativeAI).mockImplementation(() => mockGenAI as any)
    vi.mocked(lookupStageId).mockResolvedValue(1)
    vi.mocked(lookupWeaponIds).mockResolvedValue([1, 2])

    // Fileオブジェクトを作成（BlobではなくFileを使用）
    // テスト環境では、Fileオブジェクトが正しくarrayBufferメソッドを持つことを確認
    const fileContent = new Uint8Array([1, 2, 3, 4, 5])
    const file = new File([fileContent], 'test.jpg', { type: 'image/jpeg' })
    const formData = new FormData()
    formData.append('image', file)

    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: formData,
    })
    // formData()をモックして、実際のFileオブジェクトを含むFormDataを返す
    // FormDataから取得する際にFileオブジェクトが保持されるようにする
    const mockFormData = new FormData()
    mockFormData.append('image', file)
    vi.spyOn(request, 'formData').mockResolvedValue(mockFormData)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
    expect(data.data.scenario_code).toBe('ABC123')
    expect(data.data.stage_id).toBe(1)
    expect(data.data.weapon_ids).toEqual([1, 2])
    expect(mockGenerateContent).toHaveBeenCalled()
  })

  it('handles JSON wrapped in markdown code blocks', async () => {
    const mockGenerateContent = vi.fn().mockResolvedValue({
      response: {
        text: vi.fn().mockReturnValue('```json\n{"scenario_code": "ABC123", "stage_name": "アラマキ砦"}\n```'),
      },
    })

    const mockModel = {
      generateContent: mockGenerateContent,
    }

    const mockGenAI = {
      getGenerativeModel: vi.fn().mockReturnValue(mockModel),
    }

    vi.mocked(GoogleGenerativeAI).mockImplementation(() => mockGenAI as any)
    vi.mocked(lookupStageId).mockResolvedValue(1)
    vi.mocked(lookupWeaponIds).mockResolvedValue([])

    const formData = new FormData()
    const fileContent = new Uint8Array([1, 2, 3])
    const file = new File([fileContent], 'test.jpg', { type: 'image/jpeg' })
    formData.append('image', file)

    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: formData,
    })
    // formData()をモックして、FormDataを返すようにする
    vi.spyOn(request, 'formData').mockResolvedValue(formData)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.scenario_code).toBe('ABC123')
  })

  it('returns 500 when JSON parsing fails', async () => {
    const mockGenerateContent = vi.fn().mockResolvedValue({
      response: {
        text: vi.fn().mockReturnValue('invalid json'),
      },
    })

    const mockModel = {
      generateContent: mockGenerateContent,
    }

    const mockGenAI = {
      getGenerativeModel: vi.fn().mockReturnValue(mockModel),
    }

    vi.mocked(GoogleGenerativeAI).mockImplementation(() => mockGenAI as any)

    // Fileオブジェクトを作成して、arrayBufferメソッドをモック
    const fileContent = new Uint8Array([1, 2, 3])
    const file = new File([fileContent], 'test.jpg', { type: 'image/jpeg' })
    // arrayBufferメソッドが正しく動作するように確認
    const formData = new FormData()
    formData.append('image', file)

    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: formData,
    })
    // formData()をモックして、実際のFileオブジェクトを含むFormDataを返す
    vi.spyOn(request, 'formData').mockResolvedValue(formData)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to parse AI response as JSON')
  })

  it('handles rate limit error (429)', async () => {
    const mockGenerateContent = vi.fn().mockRejectedValue(
      new Error('429 Too Many Requests')
    )

    const mockModel = {
      generateContent: mockGenerateContent,
    }

    const mockGenAI = {
      getGenerativeModel: vi.fn().mockReturnValue(mockModel),
    }

    vi.mocked(GoogleGenerativeAI).mockImplementation(() => mockGenAI as any)

    // Fileオブジェクトを作成して、arrayBufferメソッドをモック
    const fileContent = new Uint8Array([1, 2, 3])
    const file = new File([fileContent], 'test.jpg', { type: 'image/jpeg' })
    // arrayBufferメソッドが正しく動作するように確認
    const formData = new FormData()
    formData.append('image', file)

    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: formData,
    })
    // formData()をモックして、実際のFileオブジェクトを含むFormDataを返す
    vi.spyOn(request, 'formData').mockResolvedValue(formData)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.success).toBe(false)
    expect(data.error).toContain('リクエスト数の上限')
  })

  it('handles authentication error (401)', async () => {
    const mockGenerateContent = vi.fn().mockRejectedValue(
      new Error('401 Unauthorized: API key is invalid')
    )

    const mockModel = {
      generateContent: mockGenerateContent,
    }

    const mockGenAI = {
      getGenerativeModel: vi.fn().mockReturnValue(mockModel),
    }

    vi.mocked(GoogleGenerativeAI).mockImplementation(() => mockGenAI as any)

    const formData = new FormData()
    const fileContent = new Uint8Array([1, 2, 3])
    const file = new File([fileContent], 'test.jpg', { type: 'image/jpeg' })
    formData.append('image', file)

    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: formData,
    })
    // formData()をモックして、FormDataを返すようにする
    vi.spyOn(request, 'formData').mockResolvedValue(formData)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toContain('APIキー')
  })
})


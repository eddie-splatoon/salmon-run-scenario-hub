import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '../analyze/route'
import { NextRequest } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { fetchMasterNames } from '@/lib/utils/master-names'
import { lookupStageId, lookupWeaponIds } from '@/lib/utils/master-lookup'

vi.mock('@google/genai', () => {
  class MediaResolutionEnum {}
  return {
    GoogleGenAI: vi.fn(),
    MediaResolution: { MEDIA_RESOLUTION_HIGH: 'MEDIA_RESOLUTION_HIGH' },
    MediaResolutionEnum,
  }
})

vi.mock('@/lib/utils/master-lookup', () => ({
  lookupStageId: vi.fn(),
  lookupWeaponIds: vi.fn(),
}))

vi.mock('@/lib/utils/master-names', () => ({
  fetchMasterNames: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      getAll: vi.fn(() => []),
      set: vi.fn(),
    })
  ),
}))

const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
    })
  ),
}))

describe('POST /api/analyze', () => {
  const originalEnv = process.env

  const ensureArrayBuffer = (file: File, content: Uint8Array): File => {
    if (!file.arrayBuffer) {
      // jsdom 環境で arrayBuffer が未実装な File へのフォールバック
      ;(file as unknown as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer =
        vi.fn().mockResolvedValue(content.buffer as ArrayBuffer)
    }
    return file
  }

  const createMockFormDataWithFile = (
    fileContent: Uint8Array,
    weaponCropContents?: Uint8Array[]
  ): FormData => {
    const file = new File([fileContent], 'test.jpg', { type: 'image/jpeg' })
    const formData = new FormData()
    formData.append('image', file)

    const cropFiles =
      weaponCropContents?.map((content, i) => {
        const blob = new Blob([content as unknown as ArrayBuffer], { type: 'image/jpeg' })
        return new File([blob], `weapon_${i + 1}.jpg`, { type: 'image/jpeg' })
      }) ?? []
    cropFiles.forEach((cropFile) => formData.append('weapon_crops', cropFile))

    const originalGet = formData.get.bind(formData)
    const originalGetAll = formData.getAll.bind(formData)

    formData.get = vi.fn((name: string) => {
      const value = originalGet(name)
      if (name === 'image' && value instanceof File) {
        ensureArrayBuffer(value, fileContent)
      }
      return value
    }) as typeof formData.get

    formData.getAll = vi.fn((name: string) => {
      const values = originalGetAll(name)
      if (name === 'weapon_crops') {
        values.forEach((value, i) => {
          if (value instanceof File) {
            ensureArrayBuffer(value, weaponCropContents?.[i] ?? new Uint8Array([0]))
          }
        })
      }
      return values
    }) as typeof formData.getAll

    return formData
  }

  const createMockGenAI = (
    generateContent: ReturnType<typeof vi.fn>
  ): { models: { generateContent: typeof generateContent } } => ({
    models: { generateContent },
  })

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    process.env.GEMINI_API_KEY = 'test-api-key'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key'

    vi.mocked(fetchMasterNames).mockResolvedValue({
      stages: ['アラマキ砦'],
      weapons: ['スプラシューター', 'スプラチャージャー'],
    })

    // デフォルトで認証済みユーザーを返す
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    })
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const fileContent = new Uint8Array([1, 2, 3])
    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
    })
    const mockFormData = createMockFormDataWithFile(fileContent)
    vi.spyOn(request, 'formData').mockResolvedValue(mockFormData)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('認証が必要です')
  })

  it('returns 500 when GEMINI_API_KEY is not configured', async () => {
    delete process.env.GEMINI_API_KEY

    const fileContent = new Uint8Array([1, 2, 3])
    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
    })
    const mockFormData = createMockFormDataWithFile(fileContent)
    vi.spyOn(request, 'formData').mockResolvedValue(mockFormData)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('GEMINI_API_KEY is not configured')
  })

  it('returns 400 when image file is missing', async () => {
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
      text: JSON.stringify({
        scenario_code: 'ABC123',
        stage_name: 'アラマキ砦',
        danger_rate: 200,
        weapons: ['スプラシューター', 'スプラチャージャー'],
        waves: [
          { wave_number: 1, tide: 'low', event: null, delivered_count: 50, quota: 50, cleared: true },
          { wave_number: 2, tide: 'normal', event: 'ラッシュ', delivered_count: 52, quota: 55, cleared: true },
          { wave_number: 3, tide: 'high', event: null, delivered_count: 48, quota: 50, cleared: true },
        ],
      }),
    })

    vi.mocked(GoogleGenAI).mockImplementation(
      () => createMockGenAI(mockGenerateContent) as unknown as InstanceType<typeof GoogleGenAI>
    )
    vi.mocked(lookupStageId).mockResolvedValue(1)
    vi.mocked(lookupWeaponIds).mockResolvedValue([1, 2])

    const fileContent = new Uint8Array([1, 2, 3, 4, 5])
    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
    })
    const mockFormData = createMockFormDataWithFile(fileContent)
    vi.spyOn(request, 'formData').mockResolvedValue(mockFormData)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.scenario_code).toBe('ABC123')
    expect(data.data.stage_id).toBe(1)
    expect(data.data.weapon_ids).toEqual([1, 2])
    expect(mockGenerateContent).toHaveBeenCalledTimes(1)

    const callArg = mockGenerateContent.mock.calls[0][0]
    expect(callArg.config.mediaResolution).toBe('MEDIA_RESOLUTION_HIGH')
    expect(callArg.config.responseMimeType).toBe('application/json')
    expect(callArg.config.responseJsonSchema).toBeDefined()
    // ステージは enum 制約（選択肢少数・影響軽微）
    expect(callArg.config.responseJsonSchema.properties.stage_name.enum).toContain('アラマキ砦')
    // ブキは enum 制約を外し、プロンプト側でヒントとして列挙する
    expect(callArg.config.responseJsonSchema.properties.weapons.items.enum).toBeUndefined()
    const promptPart = callArg.contents.find((part: { text?: string }) => typeof part.text === 'string')
    expect(promptPart?.text).toContain('スプラシューター')
  })

  it('forwards weapon crops as multi-part inlineData to Gemini', async () => {
    const mockGenerateContent = vi.fn().mockResolvedValue({
      text: JSON.stringify({
        scenario_code: 'XYZ999',
        stage_name: 'アラマキ砦',
        danger_rate: 100,
        weapons: ['スプラシューター', 'スプラシューター', 'スプラシューター', 'スプラシューター'],
        waves: [
          { wave_number: 1, tide: 'low', delivered_count: 1 },
          { wave_number: 2, tide: 'normal', delivered_count: 1 },
          { wave_number: 3, tide: 'high', delivered_count: 1 },
        ],
      }),
    })

    vi.mocked(GoogleGenAI).mockImplementation(
      () => createMockGenAI(mockGenerateContent) as unknown as InstanceType<typeof GoogleGenAI>
    )
    vi.mocked(lookupStageId).mockResolvedValue(1)
    vi.mocked(lookupWeaponIds).mockResolvedValue([1, 1, 1, 1])

    const fileContent = new Uint8Array([1, 2, 3])
    const cropContents = [
      new Uint8Array([10]),
      new Uint8Array([20]),
      new Uint8Array([30]),
      new Uint8Array([40]),
    ]
    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
    })
    const mockFormData = createMockFormDataWithFile(fileContent, cropContents)
    vi.spyOn(request, 'formData').mockResolvedValue(mockFormData)

    const response = await POST(request)
    expect(response.status).toBe(200)

    const callArg = mockGenerateContent.mock.calls[0][0]
    const inlineParts = (
      callArg.contents as Array<{ inlineData?: { data: string; mimeType: string } }>
    ).filter((p) => p.inlineData)

    // 1枚目（全体）+ 4枚（ブキ拡大）= 5枚
    expect(inlineParts).toHaveLength(5)
    inlineParts.forEach((p) => {
      expect(p.inlineData?.mimeType).toBe('image/jpeg')
      expect(typeof p.inlineData?.data).toBe('string')
      expect((p.inlineData?.data ?? '').length).toBeGreaterThan(0)
    })
  })

  it('still works when no weapon crops are attached (graceful fallback)', async () => {
    const mockGenerateContent = vi.fn().mockResolvedValue({
      text: JSON.stringify({
        scenario_code: 'NOCROP1',
        stage_name: 'アラマキ砦',
        danger_rate: 100,
        weapons: ['スプラシューター', 'スプラシューター', 'スプラシューター', 'スプラシューター'],
        waves: [
          { wave_number: 1, tide: 'low', delivered_count: 1 },
          { wave_number: 2, tide: 'normal', delivered_count: 1 },
          { wave_number: 3, tide: 'high', delivered_count: 1 },
        ],
      }),
    })

    vi.mocked(GoogleGenAI).mockImplementation(
      () => createMockGenAI(mockGenerateContent) as unknown as InstanceType<typeof GoogleGenAI>
    )
    vi.mocked(lookupStageId).mockResolvedValue(1)
    vi.mocked(lookupWeaponIds).mockResolvedValue([1, 1, 1, 1])

    const fileContent = new Uint8Array([1, 2, 3])
    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
    })
    const mockFormData = createMockFormDataWithFile(fileContent)
    vi.spyOn(request, 'formData').mockResolvedValue(mockFormData)

    const response = await POST(request)
    expect(response.status).toBe(200)

    const callArg = mockGenerateContent.mock.calls[0][0]
    const inlineParts = (
      callArg.contents as Array<{ inlineData?: { data: string; mimeType: string } }>
    ).filter((p) => p.inlineData)
    expect(inlineParts).toHaveLength(1)
  })

  it('returns 500 when response text is empty', async () => {
    const mockGenerateContent = vi.fn().mockResolvedValue({ text: '' })

    vi.mocked(GoogleGenAI).mockImplementation(
      () => createMockGenAI(mockGenerateContent) as unknown as InstanceType<typeof GoogleGenAI>
    )

    const fileContent = new Uint8Array([1, 2, 3])
    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
    })
    const mockFormData = createMockFormDataWithFile(fileContent)
    vi.spyOn(request, 'formData').mockResolvedValue(mockFormData)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toContain('AI')
  })

  it('returns 500 when JSON parsing fails', async () => {
    const mockGenerateContent = vi.fn().mockResolvedValue({ text: 'invalid json' })

    vi.mocked(GoogleGenAI).mockImplementation(
      () => createMockGenAI(mockGenerateContent) as unknown as InstanceType<typeof GoogleGenAI>
    )
    vi.mocked(lookupStageId).mockResolvedValue(1)
    vi.mocked(lookupWeaponIds).mockResolvedValue([])

    const fileContent = new Uint8Array([1, 2, 3])
    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
    })
    const mockFormData = createMockFormDataWithFile(fileContent)
    vi.spyOn(request, 'formData').mockResolvedValue(mockFormData)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to parse AI response as JSON')
  })

  it('handles rate limit error (429)', async () => {
    const mockGenerateContent = vi
      .fn()
      .mockRejectedValue(new Error('429 Too Many Requests'))

    vi.mocked(GoogleGenAI).mockImplementation(
      () => createMockGenAI(mockGenerateContent) as unknown as InstanceType<typeof GoogleGenAI>
    )

    const fileContent = new Uint8Array([1, 2, 3])
    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
    })
    const mockFormData = createMockFormDataWithFile(fileContent)
    vi.spyOn(request, 'formData').mockResolvedValue(mockFormData)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.success).toBe(false)
    expect(data.error).toContain('リクエスト数の上限')
  })

  it('handles authentication error (401)', async () => {
    const mockGenerateContent = vi
      .fn()
      .mockRejectedValue(new Error('401 Unauthorized: API key is invalid'))

    vi.mocked(GoogleGenAI).mockImplementation(
      () => createMockGenAI(mockGenerateContent) as unknown as InstanceType<typeof GoogleGenAI>
    )

    const fileContent = new Uint8Array([1, 2, 3])
    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
    })
    const mockFormData = createMockFormDataWithFile(fileContent)
    vi.spyOn(request, 'formData').mockResolvedValue(mockFormData)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toContain('APIキー')
  })
})

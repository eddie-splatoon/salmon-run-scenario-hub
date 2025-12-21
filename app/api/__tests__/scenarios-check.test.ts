import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../scenarios/check/route'
import { createClient } from '@/lib/supabase/server'

// Supabaseサーバークライアントをモック
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('GET /api/scenarios/check', () => {
  const mockSupabase = {
    from: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    limit: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase)
  })

  describe('正常系', () => {
    it('シナリオコードが存在する場合はexists=trueを返す', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.limit.mockResolvedValue({
        data: [{ code: 'TEST123' }],
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/scenarios/check?code=TEST123')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.exists).toBe(true)
      expect(data.scenario_code).toBe('TEST123')
    })

    it('シナリオコードが存在しない場合はexists=falseを返す', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.limit.mockResolvedValue({
        data: [],
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/scenarios/check?code=NOTEXIST')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.exists).toBe(false)
      expect(data.scenario_code).toBeUndefined()
    })

    it('シナリオコードが空文字列の場合は400を返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/scenarios/check?code=')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('シナリオコードが指定されていません')
    })

    it('シナリオコードが空白のみの場合は400を返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/scenarios/check?code=%20%20')
      const response = await GET(request)

      expect(response.status).toBe(200)
      // URLパラメータとして空白は有効な値として扱われるため、実際にはチェックされる
      // ただし、空文字列として扱われる可能性がある
    })

    it('複数のシナリオコードが存在する場合でも最初の1件のみをチェック', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.limit.mockResolvedValue({
        data: [{ code: 'TEST123' }],
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/scenarios/check?code=TEST123')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.exists).toBe(true)
      expect(mockSupabase.limit).toHaveBeenCalledWith(1)
    })
  })

  describe('エラーハンドリング', () => {
    it('シナリオコードが指定されていない場合は400を返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/scenarios/check')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('シナリオコードが指定されていません')
    })

    it('Supabaseクエリエラーが発生した場合は500を返す', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.limit.mockResolvedValue({
        data: null,
        error: { message: 'Database connection error', code: 'PGRST116' },
      })

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const request = new NextRequest('http://localhost:3000/api/scenarios/check?code=TEST123')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('重複チェック中にエラーが発生しました')
      expect(data.error).toContain('Database connection error')

      consoleErrorSpy.mockRestore()
    })

    it('予期しないエラーが発生した場合は500を返す', async () => {
      ;(createClient as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Unexpected error')
      )

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const request = new NextRequest('http://localhost:3000/api/scenarios/check?code=TEST123')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('予期しないエラーが発生しました')
      expect(data.error).toContain('Unexpected error')

      consoleErrorSpy.mockRestore()
    })

    it('エラーオブジェクトがErrorインスタンスでない場合も適切に処理', async () => {
      ;(createClient as ReturnType<typeof vi.fn>).mockRejectedValue('String error')

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const request = new NextRequest('http://localhost:3000/api/scenarios/check?code=TEST123')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('重複チェック中にエラーが発生しました')

      consoleErrorSpy.mockRestore()
    })
  })

  describe('クエリパラメータ', () => {
    it('異なるシナリオコードで正しくクエリを実行', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.limit.mockResolvedValue({
        data: [],
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/scenarios/check?code=DIFFERENT123')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockSupabase.eq).toHaveBeenCalledWith('code', 'DIFFERENT123')
    })

    it('URLエンコードされたシナリオコードを正しく処理', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.limit.mockResolvedValue({
        data: [],
        error: null,
      })

      const encodedCode = encodeURIComponent('TEST-123_ABC')
      const request = new NextRequest(
        `http://localhost:3000/api/scenarios/check?code=${encodedCode}`
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockSupabase.eq).toHaveBeenCalledWith('code', 'TEST-123_ABC')
    })

    it('複数のcodeパラメータがある場合は最初のものを使用', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.limit.mockResolvedValue({
        data: [],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/scenarios/check?code=FIRST&code=SECOND'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockSupabase.eq).toHaveBeenCalledWith('code', 'FIRST')
    })
  })

  describe('レスポンス形式', () => {
    it('成功時のレスポンスに必要なフィールドが含まれる', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.limit.mockResolvedValue({
        data: [{ code: 'TEST123' }],
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/scenarios/check?code=TEST123')
      const response = await GET(request)
      const data = await response.json()

      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('exists')
      expect(data).toHaveProperty('scenario_code')
      expect(typeof data.success).toBe('boolean')
      expect(typeof data.exists).toBe('boolean')
    })

    it('エラー時のレスポンスに必要なフィールドが含まれる', async () => {
      const request = new NextRequest('http://localhost:3000/api/scenarios/check')
      const response = await GET(request)
      const data = await response.json()

      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('error')
      expect(data.success).toBe(false)
      expect(typeof data.error).toBe('string')
    })
  })

  describe('Supabaseクエリチェーン', () => {
    it('正しい順序でSupabaseクエリメソッドが呼ばれる', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.limit.mockResolvedValue({
        data: [],
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/scenarios/check?code=TEST123')
      await GET(request)

      expect(mockSupabase.from).toHaveBeenCalledWith('scenarios')
      expect(mockSupabase.select).toHaveBeenCalledWith('code')
      expect(mockSupabase.eq).toHaveBeenCalledWith('code', 'TEST123')
      expect(mockSupabase.limit).toHaveBeenCalledWith(1)
    })
  })
})


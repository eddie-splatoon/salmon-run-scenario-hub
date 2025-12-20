import { describe, it, expect, vi, beforeEach } from 'vitest'
import { lookupStageId, lookupWeaponId } from '../master-lookup'
import { createClient } from '@/lib/supabase/server'

// Supabaseサーバークライアントをモック
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('master-lookup', () => {
  const mockSupabase = {
    from: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase)
  })

  describe('lookupStageId', () => {
    it('完全一致でステージIDを返す', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: { id: 1 },
        error: null,
      })

      const result = await lookupStageId('ムニ・エール海洋発電所')
      expect(result).toBe(1)
    })

    it('エイリアスでステージIDを返す', async () => {
      // 完全一致なし
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.maybeSingle
        .mockResolvedValueOnce({ data: null, error: null }) // 完全一致なし
        .mockResolvedValueOnce({ data: { stage_id: 1 }, error: null }) // エイリアス一致

      const result = await lookupStageId('ムニエル')
      expect(result).toBe(1)
    })

    it('部分一致でステージIDを返す', async () => {
      // 完全一致なし、エイリアスなし
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.maybeSingle
        .mockResolvedValueOnce({ data: null, error: null }) // 完全一致なし
        .mockResolvedValueOnce({ data: null, error: null }) // エイリアスなし

      // 部分一致用のデータ
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { id: 1, name: 'ムニ・エール海洋発電所' },
          { id: 2, name: '難破船ドン・ブラコ' },
        ],
        error: null,
      })

      const result = await lookupStageId('ムニエル')
      expect(result).toBe(1)
    })

    it('マッチしない場合はnullを返す', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.maybeSingle
        .mockResolvedValueOnce({ data: null, error: null }) // 完全一致なし
        .mockResolvedValueOnce({ data: null, error: null }) // エイリアスなし

      mockSupabase.select.mockResolvedValueOnce({
        data: [{ id: 1, name: 'ムニ・エール海洋発電所' }],
        error: null,
      })

      const result = await lookupStageId('存在しないステージ')
      expect(result).toBeNull()
    })
  })

  describe('lookupWeaponId', () => {
    it('完全一致で武器IDを返す', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: { id: 1 },
        error: null,
      })

      const result = await lookupWeaponId('スプラシューター')
      expect(result).toBe(1)
    })
  })
})


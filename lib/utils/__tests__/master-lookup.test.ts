import { describe, it, expect, vi, beforeEach } from 'vitest'
import { lookupStageId, lookupWeaponId } from '../master-lookup'
import { createClient } from '@/lib/supabase/server'

// Supabaseサーバークライアントをモック
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('master-lookup', () => {
  let mockSupabase: {
    from: ReturnType<typeof vi.fn>
    select: ReturnType<typeof vi.fn>
    eq: ReturnType<typeof vi.fn>
    maybeSingle: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase = {
      from: vi.fn(),
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(),
    }

    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase)
  })

  describe('lookupStageId', () => {
    it('完全一致でステージIDを返す', async () => {
      const exactMatchChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 1 },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValueOnce(exactMatchChain)

      const result = await lookupStageId('ムニ・エール海洋発電所')
      expect(result).toBe(1)
    })

    it('エイリアスでステージIDを返す', async () => {
      // 完全一致なし
      const exactMatchChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }

      // エイリアス一致
      const aliasMatchChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { stage_id: 1 },
          error: null,
        }),
      }

      mockSupabase.from
        .mockReturnValueOnce(exactMatchChain) // 完全一致
        .mockReturnValueOnce(aliasMatchChain) // エイリアス

      const result = await lookupStageId('ムニエル')
      expect(result).toBe(1)
    })

    it('部分一致でステージIDを返す', async () => {
      // 完全一致なし
      const exactMatchChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }

      // エイリアスなし
      const aliasMatchChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }

      // 部分一致用のデータ（selectの後に直接データを返す）
      const partialMatchChain = {
        select: vi.fn().mockResolvedValue({
          data: [
            { id: 1, name: 'ムニ・エール海洋発電所' },
            { id: 2, name: '難破船ドン・ブラコ' },
          ],
          error: null,
        }),
      }

      mockSupabase.from
        .mockReturnValueOnce(exactMatchChain) // 完全一致
        .mockReturnValueOnce(aliasMatchChain) // エイリアス
        .mockReturnValueOnce(partialMatchChain) // 部分一致（selectが直接データを返す）

      const result = await lookupStageId('ムニエル')
      expect(result).toBe(1)
    })

    it('マッチしない場合はnullを返す', async () => {
      // 完全一致なし
      const exactMatchChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }

      // エイリアスなし
      const aliasMatchChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }

      // 部分一致用のデータ（マッチしない）
      const partialMatchChain = {
        select: vi.fn().mockResolvedValue({
          data: [{ id: 1, name: 'ムニ・エール海洋発電所' }],
          error: null,
        }),
      }

      mockSupabase.from
        .mockReturnValueOnce(exactMatchChain) // 完全一致
        .mockReturnValueOnce(aliasMatchChain) // エイリアス
        .mockReturnValueOnce(partialMatchChain) // 部分一致（selectが直接データを返す）

      const result = await lookupStageId('存在しないステージ')
      expect(result).toBeNull()
    })
  })

  describe('lookupWeaponId', () => {
    it('完全一致で武器IDを返す', async () => {
      const exactMatchChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 1 },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValueOnce(exactMatchChain)

      const result = await lookupWeaponId('スプラシューター')
      expect(result).toBe(1)
    })
  })
})


import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { DELETE } from '../scenarios/[id]/route'
import { createClient } from '@/lib/supabase/server'

// Supabaseクライアントをモック
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('DELETE /api/scenarios/[id]', () => {
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

  it('should delete scenario successfully', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    // Promiseを返すオブジェクトを作成（thenable）
    const createQueryResult = (result: any) => {
      return {
        then: (resolve: (_value: any) => any) => resolve(result),
        catch: (_reject: (_error: any) => any) => _reject,
      }
    }

    const selectQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnValue(
        createQueryResult({
          data: {
            code: 'ABC123',
            author_id: 'user-123',
          },
          error: null,
        })
      ),
    }

    const deleteQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue(
        createQueryResult({
          data: null,
          error: null,
        })
      ),
    }

    // 最初の呼び出しはselect、2回目はdelete
    let callCount = 0
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'scenarios') {
        callCount++
        if (callCount === 1) {
          return selectQuery
        }
        return deleteQuery
      }
      return selectQuery
    })

    const request = new NextRequest('http://localhost:3000/api/scenarios/ABC123', {
      method: 'DELETE',
    })

    const params = Promise.resolve({ id: 'ABC123' })
    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(deleteQuery.eq).toHaveBeenCalledWith('code', 'ABC123')
  })

  it('should return 401 when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const request = new NextRequest('http://localhost:3000/api/scenarios/ABC123', {
      method: 'DELETE',
    })

    const params = Promise.resolve({ id: 'ABC123' })
    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('認証が必要です')
  })

  it('should return 404 when scenario does not exist', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const createQueryResult = (result: any) => {
      return {
        then: (resolve: (_value: any) => any) => resolve(result),
        catch: (_reject: (_error: any) => any) => _reject,
      }
    }

    const selectQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnValue(
        createQueryResult({
          data: null,
          error: { message: 'Not found' },
        })
      ),
    }

    mockSupabase.from.mockReturnValue(selectQuery)

    const request = new NextRequest('http://localhost:3000/api/scenarios/ABC123', {
      method: 'DELETE',
    })

    const params = Promise.resolve({ id: 'ABC123' })
    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toBe('シナリオが見つかりません')
  })

  it('should return 403 when user is not the author', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const createQueryResult = (result: any) => {
      return {
        then: (resolve: (_value: any) => any) => resolve(result),
        catch: (_reject: (_error: any) => any) => _reject,
      }
    }

    const selectQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnValue(
        createQueryResult({
          data: {
            code: 'ABC123',
            author_id: 'other-user-456',
          },
          error: null,
        })
      ),
    }

    mockSupabase.from.mockReturnValue(selectQuery)

    const request = new NextRequest('http://localhost:3000/api/scenarios/ABC123', {
      method: 'DELETE',
    })

    const params = Promise.resolve({ id: 'ABC123' })
    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error).toBe('このシナリオを削除する権限がありません')
  })

  it('should return 500 when delete fails', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const createQueryResult = (result: any) => {
      return {
        then: (resolve: (_value: any) => any) => resolve(result),
        catch: (_reject: (_error: any) => any) => _reject,
      }
    }

    const selectQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnValue(
        createQueryResult({
          data: {
            code: 'ABC123',
            author_id: 'user-123',
          },
          error: null,
        })
      ),
    }

    const deleteQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue(
        createQueryResult({
          data: null,
          error: { message: 'Delete failed' },
        })
      ),
    }

    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return selectQuery
      }
      return deleteQuery
    })

    const request = new NextRequest('http://localhost:3000/api/scenarios/ABC123', {
      method: 'DELETE',
    })

    const params = Promise.resolve({ id: 'ABC123' })
    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toContain('シナリオの削除に失敗しました')
  })
})


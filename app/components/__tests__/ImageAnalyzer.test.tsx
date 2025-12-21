import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImageAnalyzer from '../ImageAnalyzer'
import { useRouter } from 'next/navigation'

// Next.jsのuseRouterをモック
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Material-UIのAutocompleteをモック
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material')
  return {
    ...actual,
    Autocomplete: ({ options, value, onChange, renderInput, multiple, ...props }: any) => {
      const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (multiple) {
          const selectedValues = Array.from(e.target.selectedOptions, (option) => {
            const optionValue = option.value
            return options.find((opt: any) => String(opt.id || opt.value) === optionValue)
          })
          onChange?.(null, selectedValues)
        } else {
          const selectedValue = options.find(
            (opt: any) => String(opt.id || opt.value || opt.name) === e.target.value
          )
          onChange?.(null, selectedValue)
        }
      }

      return (
        <div data-testid="autocomplete">
          <select
            multiple={multiple}
            value={
              multiple
                ? Array.isArray(value)
                  ? value.map((v: any) => String(v?.id || v?.value || v?.name || ''))
                  : []
                : value
                  ? String(value?.id || value?.value || value?.name || '')
                  : ''
            }
            onChange={handleChange}
            {...props}
          >
            {options.map((opt: any) => (
              <option key={opt.id || opt.value || opt.name} value={String(opt.id || opt.value || opt.name)}>
                {opt.label || opt.name || opt.value}
              </option>
            ))}
          </select>
          {renderInput && renderInput({})}
        </div>
      )
    },
  }
})

describe('ImageAnalyzer', () => {
  const mockPush = vi.fn()
  const mockRefresh = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
    } as any)

    // fetchをモック
    global.fetch = vi.fn((url: string, options?: any) => {
      // 初期データ取得用のリクエスト
      if (url.includes('/api/stages')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: [
              { id: 1, name: 'アラマキ砦' },
              { id: 2, name: 'シェケナダム' },
            ],
          }),
        } as Response)
      }
      if (url.includes('/api/weapons')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: [
              { id: 1, name: 'スプラシューター' },
              { id: 2, name: 'スプラローラー' },
            ],
          }),
        } as Response)
      }
      // 解析API
      if (options?.method === 'POST' && url.includes('/api/analyze')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              scenario_code: 'ABC123',
              stage_name: 'アラマキ砦',
              danger_rate: 100,
              score: 150,
              weapons: ['スプラシューター', 'スプラローラー', 'スプラチャージャー', 'スプラスロッシャー'],
              waves: [
                {
                  wave_number: 1,
                  tide: 'normal',
                  event: null,
                  delivered_count: 50,
                  quota: 50,
                  cleared: true,
                },
                {
                  wave_number: 2,
                  tide: 'high',
                  event: 'ラッシュ',
                  delivered_count: 60,
                  quota: 60,
                  cleared: true,
                },
                {
                  wave_number: 3,
                  tide: 'low',
                  event: null,
                  delivered_count: 40,
                  quota: 40,
                  cleared: true,
                },
              ],
            },
          }),
        } as Response)
      }
      // 重複チェックAPI
      if (url.includes('/api/scenarios/check')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            exists: false,
          }),
        } as Response)
      }
      // 保存API
      if (options?.method === 'POST' && url.includes('/api/scenarios')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
          }),
        } as Response)
      }
      return Promise.resolve({
        json: async () => ({ success: true }),
      } as Response)
    })

    // URL.createObjectURLとrevokeObjectURLをモック
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
  })

  it('should render image upload button', () => {
    render(<ImageAnalyzer />)
    expect(screen.getByText('サーモンランの結果画像を選択')).toBeInTheDocument()
  })

  it('should handle image selection', async () => {
    const user = userEvent.setup()
    render(<ImageAnalyzer />)

    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    expect(input).toBeInTheDocument()
    await user.upload(input, file)
    await waitFor(() => {
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(file)
    })
  })

  it('should show error for non-image file', async () => {
    const user = userEvent.setup()
    render(<ImageAnalyzer />)

    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    expect(input).toBeInTheDocument()
    
    // ファイルを直接設定してonChangeイベントを発火
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
      configurable: true,
    })
    
    // ChangeEventを作成して発火
    const changeEvent = new Event('change', { bubbles: true }) as any
    Object.defineProperty(changeEvent, 'target', {
      value: input,
      enumerable: true,
    })
    input.dispatchEvent(changeEvent)
    
    await waitFor(
      () => {
        const errorMessage = screen.queryByText('画像ファイルを選択してください')
        expect(errorMessage).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('should show error for file too large', async () => {
    const user = userEvent.setup()
    render(<ImageAnalyzer />)

    // 10MBを超えるファイルを作成
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.png', { type: 'image/png' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    expect(input).toBeInTheDocument()
    
    // ファイルを直接設定してonChangeイベントを発火
    Object.defineProperty(input, 'files', {
      value: [largeFile],
      writable: false,
      configurable: true,
    })
    
    // ChangeEventを作成して発火
    const changeEvent = new Event('change', { bubbles: true }) as any
    Object.defineProperty(changeEvent, 'target', {
      value: input,
      enumerable: true,
    })
    input.dispatchEvent(changeEvent)
    
    await waitFor(
      () => {
        const errorMessage = screen.queryByText(/画像ファイルのサイズが大きすぎます/)
        expect(errorMessage).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('should analyze image and show results', async () => {
    const user = userEvent.setup()
    render(<ImageAnalyzer />)

    // 画像を選択
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    expect(input).toBeInTheDocument()
    await user.upload(input, file)

    // 解析ボタンをクリック
    await waitFor(() => {
      const analyzeButton = screen.getByText('解析する')
      expect(analyzeButton).not.toBeDisabled()
    })

    const analyzeButton = screen.getByText('解析する')
    await user.click(analyzeButton)

    // 解析結果が表示されるまで待つ
    await waitFor(
      () => {
        expect(screen.getByText('解析結果の確認と編集')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // シナリオコードが表示されることを確認
    expect(screen.getByDisplayValue('ABC123')).toBeInTheDocument()
  })

  it('should handle save scenario', async () => {
    const user = userEvent.setup()
    
    // 保存APIのモックを準備
    let saveFetchCalled = false
    const mockSaveFetch = vi.fn().mockImplementation(() => {
      saveFetchCalled = true
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
        }),
      } as Response)
    })
    
    // fetchモックを設定（beforeEachの設定を上書き）
    const originalFetch = global.fetch
    const fetchMock = vi.fn((url: string | URL | Request, options?: any) => {
      const urlString = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url
      // 初期データ取得用のリクエスト
      if (urlString.includes('/api/stages')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: [
              { id: 1, name: 'アラマキ砦' },
              { id: 2, name: 'シェケナダム' },
            ],
          }),
        } as Response)
      }
      if (urlString.includes('/api/weapons')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: [
              { id: 1, name: 'スプラシューター' },
              { id: 2, name: 'スプラローラー' },
            ],
          }),
        } as Response)
      }
      // 解析API
      if (options?.method === 'POST' && urlString.includes('/api/analyze')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              scenario_code: 'ABC123',
              stage_name: 'アラマキ砦',
              danger_rate: 100,
              score: 150,
              weapons: ['スプラシューター', 'スプラローラー', 'スプラチャージャー', 'スプラスロッシャー'],
              waves: [
                {
                  wave_number: 1,
                  tide: 'normal',
                  event: null,
                  delivered_count: 50,
                  quota: 50,
                  cleared: true,
                },
                {
                  wave_number: 2,
                  tide: 'high',
                  event: 'ラッシュ',
                  delivered_count: 60,
                  quota: 60,
                  cleared: true,
                },
                {
                  wave_number: 3,
                  tide: 'low',
                  event: null,
                  delivered_count: 40,
                  quota: 40,
                  cleared: true,
                },
              ],
            },
          }),
        } as Response)
      }
      // 重複チェックAPI
      if (urlString.includes('/api/scenarios/check')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            exists: false,
          }),
        } as Response)
      }
      // 保存API
      if (options?.method === 'POST' && urlString.includes('/api/scenarios') && !urlString.includes('/check')) {
        return mockSaveFetch(url, options)
      }
      return Promise.resolve({
        json: async () => ({ success: true }),
      } as Response)
    })
    
    global.fetch = fetchMock
    
    render(<ImageAnalyzer />)

    // 画像を選択して解析
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    expect(input).toBeInTheDocument()
    await user.upload(input, file)

    await waitFor(() => {
      const analyzeButton = screen.getByText('解析する')
      expect(analyzeButton).not.toBeDisabled()
    })

    const analyzeButton = screen.getByText('解析する')
    await user.click(analyzeButton)

    // 解析結果が表示されるまで待つ
    await waitFor(
      () => {
        expect(screen.getByText('解析結果の確認と編集')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // 重複チェックが完了するまで待つ（重複警告がないことを確認）
    await waitFor(
      () => {
        const duplicateWarning = screen.queryByText(/このシナリオコード.*は既に投稿されています/)
        expect(duplicateWarning).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // 保存ボタンが有効であることを確認
    await waitFor(() => {
      const saveButton = screen.getByText('保存する')
      expect(saveButton).not.toBeDisabled()
    }, { timeout: 5000 })

    // フォーム要素を取得
    const form = screen.getByText('保存する').closest('form') as HTMLFormElement
    expect(form).toBeInTheDocument()
    
    // フォームのsubmitイベントを直接発火
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
    const preventDefaultSpy = vi.fn()
    Object.defineProperty(submitEvent, 'preventDefault', {
      value: preventDefaultSpy,
      writable: true,
    })
    
    // フォームのsubmitイベントを発火
    form.dispatchEvent(submitEvent)

    // 保存APIが呼ばれたことを確認（タイムアウトを延長）
    await waitFor(
      () => {
        // fetchMockが呼ばれたか確認
        const saveCalls = fetchMock.mock.calls.filter(
          (call) => {
            const url = typeof call[0] === 'string' ? call[0] : call[0] instanceof URL ? call[0].toString() : call[0]?.url || ''
            const options = call[1] || {}
            return url.includes('/api/scenarios') && !url.includes('/check') && options.method === 'POST'
          }
        )
        expect(saveCalls.length).toBeGreaterThan(0)
        expect(saveFetchCalled).toBe(true)
        expect(mockSaveFetch).toHaveBeenCalled()
      },
      { timeout: 10000 }
    )

    // 保存成功メッセージが表示されることを確認
    await waitFor(
      () => {
        const message = screen.queryByText('シナリオを保存しました')
        expect(message).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
    
    // 元のfetchを復元（beforeEachで設定されたモックに戻す）
    global.fetch = originalFetch
  }, 15000) // テスト全体のタイムアウトを15秒に設定

  it('should handle clear button', async () => {
    const user = userEvent.setup()
    render(<ImageAnalyzer />)

    // 画像を選択
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    expect(input).toBeInTheDocument()
    await user.upload(input, file)

    // クリアボタンをクリック
    await waitFor(() => {
      const clearButton = screen.getByText('クリア')
      expect(clearButton).toBeInTheDocument()
    })

    const clearButton = screen.getByText('クリア')
    await user.click(clearButton)

    // プレビューがクリアされることを確認
    await waitFor(() => {
      expect(global.URL.revokeObjectURL).toHaveBeenCalled()
    })
  })

  it('should show duplicate warning when scenario code exists', async () => {
    // 重複チェックAPIをモック
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/api/stages')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: [{ id: 1, name: 'アラマキ砦' }],
          }),
        } as Response)
      }
      if (url.includes('/api/weapons')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: [{ id: 1, name: 'スプラシューター' }],
          }),
        } as Response)
      }
      if (url.includes('/api/analyze')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              scenario_code: 'ABC123',
              stage_name: 'アラマキ砦',
              danger_rate: 100,
              weapons: ['スプラシューター'],
              waves: [
                {
                  wave_number: 1,
                  tide: 'normal',
                  event: null,
                  delivered_count: 50,
                  quota: 50,
                  cleared: true,
                },
              ],
            },
          }),
        } as Response)
      }
      if (url.includes('/api/scenarios/check')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            exists: true,
            scenario_code: 'ABC123',
          }),
        } as Response)
      }
      return Promise.resolve({
        json: async () => ({ success: true }),
      } as Response)
    })

    const user = userEvent.setup()
    render(<ImageAnalyzer />)

    // 画像を選択して解析
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    expect(input).toBeInTheDocument()
    await user.upload(input, file)

    await waitFor(() => {
      const analyzeButton = screen.getByText('解析する')
      expect(analyzeButton).not.toBeDisabled()
    })

    const analyzeButton = screen.getByText('解析する')
    await user.click(analyzeButton)

    // 重複警告が表示されるまで待つ
    await waitFor(
      () => {
        expect(screen.getByText(/このシナリオコード.*は既に投稿されています/)).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
  })
})


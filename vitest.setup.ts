import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// グローバルタイマー関数を定義（jsdom環境で必要）
if (typeof global.clearTimeout === 'undefined') {
  global.clearTimeout = clearTimeout
}
if (typeof global.setTimeout === 'undefined') {
  global.setTimeout = setTimeout
}

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup()
})


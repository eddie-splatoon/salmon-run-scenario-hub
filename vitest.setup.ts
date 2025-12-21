import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// グローバルタイマー関数を確実に定義（vi.useFakeTimers()使用時の問題を回避）
if (typeof globalThis.clearTimeout === 'undefined') {
  globalThis.clearTimeout = clearTimeout || (() => {})
}
if (typeof globalThis.setTimeout === 'undefined') {
  globalThis.setTimeout = setTimeout || (() => {})
}

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup()
})


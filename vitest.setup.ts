import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// グローバルタイマー関数を確実に定義（vi.useFakeTimers()使用時の問題を回避）
// Node.js環境では既に定義されているが、jsdom環境では明示的に定義する必要がある場合がある
if (typeof globalThis.clearTimeout === 'undefined') {
  // @ts-expect-error - clearTimeoutはNode.js環境で利用可能
  globalThis.clearTimeout = typeof clearTimeout !== 'undefined' ? clearTimeout : (() => {})
}
if (typeof globalThis.setTimeout === 'undefined') {
  // @ts-expect-error - setTimeoutはNode.js環境で利用可能
  globalThis.setTimeout = typeof setTimeout !== 'undefined' ? setTimeout : (() => {})
}

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup()
})


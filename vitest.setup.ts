import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { webcrypto } from 'node:crypto'

// crypto APIの設定（Vitest環境で必要）
if (typeof globalThis.crypto === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).crypto = webcrypto as any
}

// getRandomValuesが存在しない場合のフォールバック
if (globalThis.crypto && !globalThis.crypto.getRandomValues) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis.crypto as any).getRandomValues = webcrypto.getRandomValues.bind(webcrypto)
}

// グローバルタイマー関数を確実に定義（vi.useFakeTimers()使用時の問題を回避）
// Node.js環境では既に定義されているが、jsdom環境では明示的に定義する必要がある場合がある
// clearTimeoutとsetTimeoutをグローバルスコープで利用可能にする
if (typeof globalThis.clearTimeout === 'undefined') {
  try {
    const clearTimeoutFn = typeof clearTimeout !== 'undefined' ? clearTimeout : (() => {})
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).clearTimeout = clearTimeoutFn
    if (typeof global !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global as any).clearTimeout = clearTimeoutFn
    }
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).clearTimeout = clearTimeoutFn
    }
  } catch {
    // clearTimeoutが利用できない場合は空関数を設定
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).clearTimeout = () => {}
    if (typeof global !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global as any).clearTimeout = () => {}
    }
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).clearTimeout = () => {}
    }
  }
}
if (typeof globalThis.setTimeout === 'undefined') {
  try {
    const setTimeoutFn = typeof setTimeout !== 'undefined' ? setTimeout : (() => {})
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).setTimeout = setTimeoutFn
    if (typeof global !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global as any).setTimeout = setTimeoutFn
    }
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).setTimeout = setTimeoutFn
    }
  } catch {
    // setTimeoutが利用できない場合は空関数を設定
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).setTimeout = () => {}
    if (typeof global !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global as any).setTimeout = () => {}
    }
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).setTimeout = () => {}
    }
  }
}

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup()
})


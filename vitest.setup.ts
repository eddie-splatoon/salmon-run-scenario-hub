import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// グローバルタイマー関数を確実に定義（vi.useFakeTimers()使用時の問題を回避）
// Node.js環境では既に定義されているが、jsdom環境では明示的に定義する必要がある場合がある
// clearTimeoutとsetTimeoutをグローバルスコープで利用可能にする
if (typeof globalThis.clearTimeout === 'undefined') {
  try {
    // @ts-expect-error - clearTimeoutはNode.js環境で利用可能
    const clearTimeoutFn = typeof clearTimeout !== 'undefined' ? clearTimeout : (() => {})
    globalThis.clearTimeout = clearTimeoutFn
    // @ts-expect-error
    global.clearTimeout = clearTimeoutFn
    // @ts-expect-error
    if (typeof window !== 'undefined') window.clearTimeout = clearTimeoutFn
  } catch {
    // clearTimeoutが利用できない場合は空関数を設定
    globalThis.clearTimeout = () => {}
    // @ts-expect-error
    if (typeof global !== 'undefined') global.clearTimeout = () => {}
    // @ts-expect-error
    if (typeof window !== 'undefined') window.clearTimeout = () => {}
  }
}
if (typeof globalThis.setTimeout === 'undefined') {
  try {
    // @ts-expect-error - setTimeoutはNode.js環境で利用可能
    const setTimeoutFn = typeof setTimeout !== 'undefined' ? setTimeout : (() => {})
    globalThis.setTimeout = setTimeoutFn
    // @ts-expect-error
    global.setTimeout = setTimeoutFn
    // @ts-expect-error
    if (typeof window !== 'undefined') window.setTimeout = setTimeoutFn
  } catch {
    // setTimeoutが利用できない場合は空関数を設定
    globalThis.setTimeout = () => {}
    // @ts-expect-error
    if (typeof global !== 'undefined') global.setTimeout = () => {}
    // @ts-expect-error
    if (typeof window !== 'undefined') window.setTimeout = () => {}
  }
}

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup()
})


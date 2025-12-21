import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { webcrypto } from 'node:crypto'

// crypto.getRandomValuesのポリフィル
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = webcrypto as Crypto
}

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup()
})


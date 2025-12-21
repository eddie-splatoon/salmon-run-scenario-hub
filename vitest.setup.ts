import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Node.js環境でFormDataとBlobをグローバルに利用可能にする
// Node.js 18+では標準で利用可能だが、テスト環境で明示的に設定
if (typeof globalThis.FormData === 'undefined') {
  const { FormData } = require('undici')
  globalThis.FormData = FormData
}

if (typeof globalThis.Blob === 'undefined') {
  const { Blob } = require('buffer')
  globalThis.Blob = Blob
}

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup()
})


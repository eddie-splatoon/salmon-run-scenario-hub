'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * ページ遷移時にスクロール位置を復元するコンポーネント
 */
export default function ScrollRestorer() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // URLパラメータが変更された場合のみスクロール位置を復元
    const savedPosition = window.sessionStorage.getItem('scrollPosition')
    if (savedPosition) {
      // 少し遅延してからスクロール位置を復元（DOMの更新を待つ）
      const timeoutId = setTimeout(() => {
        const position = parseInt(savedPosition, 10)
        if (position > 0) {
          window.scrollTo(0, position)
        }
      }, 50)

      return () => clearTimeout(timeoutId)
    }
  }, [pathname, searchParams])

  return null
}


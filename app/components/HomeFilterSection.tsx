'use client'

import { useEffect } from 'react'
import { Filter } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function HomeFilterSection() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentFilter = searchParams.get('filter')
  const currentTag = searchParams.get('tag')

  // スクロール位置を保存
  useEffect(() => {
    const handleScroll = () => {
      window.sessionStorage.setItem('scrollPosition', String(window.scrollY))
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleFilterClick = (filterValue: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (filterValue && filterValue === currentFilter) {
      // 同じフィルタをクリックした場合は削除
      params.delete('filter')
    } else if (filterValue) {
      // 新しいフィルタを設定
      params.set('filter', filterValue)
    } else {
      params.delete('filter')
    }

    // URLを更新（ページリロードなし、スクロール位置保持）
    const newUrl = params.toString() ? `/?${params.toString()}#latest` : '/#latest'
    
    // 現在のスクロール位置を保存
    const currentScrollY = window.scrollY
    window.sessionStorage.setItem('scrollPosition', String(currentScrollY))
    
    router.replace(newUrl, { scroll: false })
  }

  const handleTagClick = (tagValue: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (tagValue && tagValue === currentTag) {
      // 同じタグをクリックした場合は削除
      params.delete('tag')
    } else if (tagValue) {
      // 新しいタグを設定
      params.set('tag', tagValue)
    } else {
      params.delete('tag')
    }

    // URLを更新（ページリロードなし、スクロール位置保持）
    const newUrl = params.toString() ? `/?${params.toString()}#latest` : '/#latest'
    
    // 現在のスクロール位置を保存
    const currentScrollY = window.scrollY
    window.sessionStorage.setItem('scrollPosition', String(currentScrollY))
    
    router.replace(newUrl, { scroll: false })
  }

  // 利用可能なハッシュタグ
  const availableTags = [
    { value: 'クマフェス', label: '#クマフェス' },
    { value: 'オルラン', label: '#オルラン' },
    { value: '初心者向け', label: '#初心者向け' },
    { value: '未クリア', label: '#未クリア' },
    { value: '高難易度', label: '#高難易度' },
    { value: '乱獲向け', label: '#乱獲向け' },
    { value: '昼のみ', label: '#昼のみ' },
    { value: '夜1', label: '#夜1' },
    { value: '夜2', label: '#夜2' },
    { value: '夜のみ', label: '#夜のみ' },
    { value: 'オカシラあり', label: '#オカシラあり' },
  ]

  return (
    <section className="py-8 bg-gray-900 border-t border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-300">クイックフィルタ</h3>
        </div>
          <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleFilterClick('grizzco')}
            className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors border ${
              currentFilter === 'grizzco'
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-orange-500 hover:text-white hover:border-orange-500'
            }`}
          >
            <span>#クマサン印あり</span>
          </button>
          <button
            onClick={() => handleFilterClick('max_danger')}
            className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors border ${
              currentFilter === 'max_danger'
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-orange-500 hover:text-white hover:border-orange-500'
            }`}
          >
            <span>#カンスト向け</span>
          </button>
        </div>
        <div className="mt-3">
          <div className="text-sm text-gray-400 mb-2">ハッシュタグフィルタ</div>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag.value}
                onClick={() => handleTagClick(tag.value)}
                className={`inline-flex items-center px-3 py-1.5 rounded-lg transition-colors border text-sm ${
                  currentTag === tag.value
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-orange-500 hover:text-white hover:border-orange-500'
                }`}
              >
                <span>{tag.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}


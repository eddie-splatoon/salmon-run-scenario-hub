'use client'

import { useEffect, useRef } from 'react'

interface AdBannerProps {
  /**
   * 広告のサイズ
   * 'responsive': レスポンシブ広告（推奨）
   * 'rectangle': 中長方形（300x250）
   * 'leaderboard': バナー（728x90）
   * 'skyscraper': 縦長（160x600）
   */
  size?: 'responsive' | 'rectangle' | 'leaderboard' | 'skyscraper'
  /**
   * 広告のクラス名
   */
  className?: string
  /**
   * 広告のID（複数の広告を区別するため）
   */
  adId?: string
}

/**
 * AdBannerコンポーネント
 * 
 * 広告配信用のコンポーネントです。
 * 実際の広告配信サービス（Google AdSenseなど）を統合する際に使用します。
 * 
 * 注意: 本コンポーネントは、広告配信サービスとの統合を想定したプレースホルダーです。
 * 実際の広告配信を開始する際は、各広告配信サービスのガイドラインに従って実装してください。
 */
export default function AdBanner({
  size = 'responsive',
  className = '',
  adId = 'ad-banner',
}: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 広告配信サービスのスクリプトを読み込む処理をここに実装
    // 例: Google AdSenseの場合
    // if (typeof window !== 'undefined' && !window.adsbygoogle) {
    //   const script = document.createElement('script')
    //   script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'
    //   script.async = true
    //   script.crossOrigin = 'anonymous'
    //   document.head.appendChild(script)
    // }
    
    // 広告を表示する処理
    // if (window.adsbygoogle && adRef.current) {
    //   try {
    //     (window.adsbygoogle = window.adsbygoogle || []).push({})
    //   } catch (e) {
    //     console.error('AdSense error:', e)
    //   }
    // }
  }, [])

  // 広告サイズに応じたスタイルを決定
  const getSizeStyles = () => {
    switch (size) {
      case 'rectangle':
        return 'w-[300px] h-[250px]'
      case 'leaderboard':
        return 'w-full max-w-[728px] h-[90px]'
      case 'skyscraper':
        return 'w-[160px] h-[600px]'
      case 'responsive':
      default:
        return 'w-full h-[250px] md:h-[90px]'
    }
  }

  return (
    <div
      ref={adRef}
      id={adId}
      className={`flex items-center justify-center bg-gray-800 border border-gray-700 rounded-lg ${getSizeStyles()} ${className}`}
      style={{ minHeight: size === 'responsive' ? '250px' : undefined }}
    >
      {/* プレースホルダー: 実際の広告配信サービスを統合する際は、この部分を置き換えます */}
      <div className="text-center text-gray-500 text-sm">
        <p>広告スペース</p>
        <p className="text-xs mt-1">Ad Space</p>
      </div>
      
      {/* 実際の広告配信サービスを統合する際の例（コメントアウト） */}
      {/* 
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot="XXXXXXXXXX"
        data-ad-format={size === 'responsive' ? 'auto' : undefined}
        data-full-width-responsive={size === 'responsive' ? 'true' : undefined}
      />
      */}
    </div>
  )
}


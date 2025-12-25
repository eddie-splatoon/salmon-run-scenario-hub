'use client'

import { Share2 } from 'lucide-react'

interface ShareButtonsProps {
  scenarioCode: string
  stageName: string
  totalGoldenEggs: number
}

export default function ShareButtons({
  scenarioCode,
  stageName,
  totalGoldenEggs,
}: ShareButtonsProps) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://salmon-run-scenario-hub.vercel.app'
  const scenarioUrl = `${baseUrl}/scenarios/${scenarioCode}`

  // 投稿テキストを生成
  const shareText = `ステージ: ${stageName} / 金イクラ: ${totalGoldenEggs} / シナリオコード: ${scenarioCode}`

  // ハッシュタグ
  const hashtags = 'サーモンランNW,SalmonRunScenarioHub,サーモンランシナリオhub'

  // 𝕏 (Twitter) の共有URL
  const twitterUrl = `https://x.com/intent/post?text=${encodeURIComponent(
    shareText
  )}&url=${encodeURIComponent(scenarioUrl)}&hashtags=${encodeURIComponent(hashtags)}`

  // BlueSky の共有URL
  const blueskyUrl = `https://bsky.app/intent/compose?text=${encodeURIComponent(
    `${shareText} ${scenarioUrl}`
  )}`

  // LINE の共有URL
  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
    scenarioUrl
  )}`

  const handleShare = (url: string) => {
    window.open(url, '_blank', 'width=600,height=400')
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {/* 𝕏 (Twitter) ボタン */}
      <button
        onClick={() => handleShare(twitterUrl)}
        className="inline-flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
        aria-label="𝕏で共有"
      >
        <Share2 className="mr-2 h-4 w-4" />
        𝕏で共有
      </button>

      {/* BlueSky ボタン */}
      <button
        onClick={() => handleShare(blueskyUrl)}
        className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
        aria-label="BlueSkyで共有"
      >
        <Share2 className="mr-2 h-4 w-4" />
        BlueSkyで共有
      </button>

      {/* LINE ボタン */}
      <button
        onClick={() => handleShare(lineUrl)}
        className="inline-flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
        aria-label="LINEで共有"
      >
        <Share2 className="mr-2 h-4 w-4" />
        LINEで共有
      </button>
    </div>
  )
}


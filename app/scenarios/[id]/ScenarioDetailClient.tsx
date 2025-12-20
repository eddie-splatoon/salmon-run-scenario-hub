'use client'

import { useState, useEffect } from 'react'
import { Copy, Heart, MessageCircle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface WaveDetail {
  wave_number: number
  tide: 'low' | 'normal' | 'high'
  event: string | null
  delivered_count: number
  quota: number
  cleared: boolean
}

interface WeaponDetail {
  weapon_id: number
  weapon_name: string
  icon_url: string | null
  display_order: number
}

interface ScenarioDetail {
  code: string
  stage_id: number
  stage_name: string
  danger_rate: number
  total_golden_eggs: number
  total_power_eggs: number
  created_at: string
  waves: WaveDetail[]
  weapons: WeaponDetail[]
  like_count: number
  comment_count: number
  is_liked: boolean
}

interface ScenarioDetailClientProps {
  scenario: ScenarioDetail
}

export default function ScenarioDetailClient({ scenario: initialScenario }: ScenarioDetailClientProps) {
  const [scenario, setScenario] = useState(initialScenario)
  const [isLiking, setIsLiking] = useState(false)
  const [comments, setComments] = useState<Array<{
    id: number
    user_id: string
    content: string
    created_at: string
    updated_at: string
  }>>([])
  const [commentContent, setCommentContent] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)

  // コメントを読み込む
  useEffect(() => {
    loadComments()
  }, [])

  const loadComments = async () => {
    setIsLoadingComments(true)
    try {
      const response = await fetch(`/api/scenarios/${scenario.code}/comments`)
      const data = await response.json()
      if (data.success && data.data) {
        setComments(data.data)
      }
    } catch (error) {
      console.error('コメント読み込みエラー:', error)
    } finally {
      setIsLoadingComments(false)
    }
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(scenario.code)
      toast.success('シナリオコードをコピーしました')
    } catch (error) {
      console.error('コピーエラー:', error)
      toast.error('コピーに失敗しました')
    }
  }

  const handleLike = async () => {
    if (isLiking) return

    setIsLiking(true)
    try {
      const response = await fetch(`/api/scenarios/${scenario.code}/likes`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success && data.data) {
        setScenario((prev) => ({
          ...prev,
          is_liked: data.data.is_liked,
          like_count: data.data.like_count,
        }))
      } else {
        toast.error(data.error || 'いいねの処理に失敗しました')
      }
    } catch (error) {
      console.error('いいねエラー:', error)
      toast.error('いいねの処理に失敗しました')
    } finally {
      setIsLiking(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!commentContent.trim() || isSubmittingComment) return

    setIsSubmittingComment(true)
    try {
      const response = await fetch(`/api/scenarios/${scenario.code}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: commentContent.trim() }),
      })

      const data = await response.json()

      if (data.success && data.data) {
        setComments((prev) => [data.data, ...prev])
        setCommentContent('')
        setScenario((prev) => ({
          ...prev,
          comment_count: prev.comment_count + 1,
        }))
        toast.success('コメントを投稿しました')
      } else {
        toast.error(data.error || 'コメントの投稿に失敗しました')
      }
    } catch (error) {
      console.error('コメント投稿エラー:', error)
      toast.error('コメントの投稿に失敗しました')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const getTideColor = (tide: 'low' | 'normal' | 'high') => {
    switch (tide) {
      case 'low':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50'
      case 'normal':
        return 'bg-green-500/20 text-green-300 border-green-500/50'
      case 'high':
        return 'bg-red-500/20 text-red-300 border-red-500/50'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/50'
    }
  }

  const getTideLabel = (tide: 'low' | 'normal' | 'high') => {
    switch (tide) {
      case 'low':
        return '干潮'
      case 'normal':
        return '普通'
      case 'high':
        return '満潮'
      default:
        return tide
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* 戻るボタン */}
        <Link
          href="/"
          className="inline-flex items-center text-gray-400 hover:text-gray-200 mb-6 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          一覧に戻る
        </Link>

        {/* シナリオ詳細カード */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
          {/* ヘッダー */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
            <div className="flex-1 mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-gray-100 mb-2">{scenario.code}</h1>
              <p className="text-lg text-gray-400">{scenario.stage_name}</p>
            </div>
            <div className="flex gap-4">
              {/* コピーボタン */}
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
              >
                <Copy className="mr-2 h-4 w-4" />
                コードをコピー
              </button>
            </div>
          </div>

          {/* 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">キケン度</div>
              <div className="text-2xl font-bold text-red-400">{scenario.danger_rate}%</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">トータル納品数</div>
              <div className="text-2xl font-bold text-yellow-400">{scenario.total_golden_eggs}</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">作成日時</div>
              <div className="text-sm text-gray-300">{formatDate(scenario.created_at)}</div>
            </div>
          </div>

          {/* 武器 */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-3">武器</h2>
            <div className="flex gap-2">
              {scenario.weapons.map((weapon) => (
                <div
                  key={weapon.weapon_id}
                  className="flex-1 bg-gray-700 rounded p-3 flex items-center justify-center min-h-[80px]"
                  title={weapon.weapon_name}
                >
                  {weapon.icon_url ? (
                    <img
                      src={weapon.icon_url}
                      alt={weapon.weapon_name}
                      className="w-full h-auto max-h-16 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        if (target.parentElement) {
                          target.parentElement.innerHTML = `<span class="text-xs text-gray-300 text-center">${weapon.weapon_name}</span>`
                        }
                      }}
                    />
                  ) : (
                    <span className="text-sm text-gray-300 text-center">{weapon.weapon_name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* WAVE別詳細テーブル */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-3">WAVE別詳細</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-700/50">
                    <th className="border border-gray-600 px-4 py-2 text-left text-gray-200">WAVE</th>
                    <th className="border border-gray-600 px-4 py-2 text-left text-gray-200">潮位</th>
                    <th className="border border-gray-600 px-4 py-2 text-left text-gray-200">イベント</th>
                    <th className="border border-gray-600 px-4 py-2 text-left text-gray-200">納品数</th>
                    <th className="border border-gray-600 px-4 py-2 text-left text-gray-200">ノルマ</th>
                    <th className="border border-gray-600 px-4 py-2 text-left text-gray-200">クリア</th>
                  </tr>
                </thead>
                <tbody>
                  {scenario.waves.map((wave) => (
                    <tr key={wave.wave_number} className="bg-gray-800/50 hover:bg-gray-700/50">
                      <td className="border border-gray-600 px-4 py-2 text-gray-200">
                        {wave.wave_number === 4 ? 'EX' : wave.wave_number}
                      </td>
                      <td className="border border-gray-600 px-4 py-2">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getTideColor(wave.tide)}`}
                        >
                          {getTideLabel(wave.tide)}
                        </span>
                      </td>
                      <td className="border border-gray-600 px-4 py-2 text-gray-300">
                        {wave.event || '-'}
                      </td>
                      <td className="border border-gray-600 px-4 py-2 text-gray-200">
                        {wave.delivered_count}
                      </td>
                      <td className="border border-gray-600 px-4 py-2 text-gray-200">{wave.quota}</td>
                      <td className="border border-gray-600 px-4 py-2">
                        {wave.cleared ? (
                          <span className="text-green-400 font-semibold">✓</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ソーシャル機能 */}
          <div className="border-t border-gray-700 pt-6">
            <div className="flex items-center gap-6 mb-6">
              {/* いいねボタン */}
              <button
                onClick={handleLike}
                disabled={isLiking}
                className={`inline-flex items-center px-4 py-2 rounded-lg font-semibold transition-colors ${
                  scenario.is_liked
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Heart className={`mr-2 h-4 w-4 ${scenario.is_liked ? 'fill-current' : ''}`} />
                {scenario.like_count}
              </button>

              {/* コメント数 */}
              <div className="inline-flex items-center text-gray-400">
                <MessageCircle className="mr-2 h-4 w-4" />
                {scenario.comment_count}件のコメント
              </div>
            </div>

            {/* コメント投稿フォーム */}
            <form onSubmit={handleSubmitComment} className="mb-6">
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="コメントを入力..."
                rows={3}
                maxLength={1000}
                className="w-full bg-gray-700 text-gray-100 rounded-lg p-3 border border-gray-600 focus:border-orange-500 focus:outline-none resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">
                  {commentContent.length}/1000文字
                </span>
                <button
                  type="submit"
                  disabled={!commentContent.trim() || isSubmittingComment}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingComment ? '投稿中...' : 'コメントを投稿'}
                </button>
              </div>
            </form>

            {/* コメント一覧 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-4">コメント</h3>
              {isLoadingComments ? (
                <div className="text-gray-400 text-center py-8">読み込み中...</div>
              ) : comments.length === 0 ? (
                <div className="text-gray-400 text-center py-8">まだコメントがありません</div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-sm text-gray-400">
                          {formatDate(comment.created_at)}
                        </div>
                      </div>
                      <p className="text-gray-200 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


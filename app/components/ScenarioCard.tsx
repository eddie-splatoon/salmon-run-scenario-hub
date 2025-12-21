'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, Trash2, User } from 'lucide-react'

interface Weapon {
  weapon_id: number
  weapon_name: string
  icon_url: string | null
  display_order: number
}

interface ScenarioCardProps {
  code: string
  stageName: string
  dangerRate: number
  totalGoldenEggs: number
  weapons: Weapon[]
  authorId?: string
  showTrending?: boolean
  trendingCount?: number
  showDelete?: boolean
  onDelete?: (code: string) => void
  isDeleting?: boolean
}

interface UserInfo {
  id: string
  name: string | null
  avatar_url: string | null
}

export default function ScenarioCard({
  code,
  stageName,
  dangerRate,
  totalGoldenEggs,
  weapons,
  authorId,
  showTrending = false,
  trendingCount = 0,
  showDelete = false,
  onDelete,
  isDeleting = false,
}: ScenarioCardProps) {
  const [authorInfo, setAuthorInfo] = useState<UserInfo | null>(null)
  const [avatarError, setAvatarError] = useState(false)

  useEffect(() => {
    if (!authorId) return

    const fetchAuthorInfo = async () => {
      try {
        const response = await fetch(`/api/users/${authorId}`)
        const data = await response.json()
        if (data.success && data.data) {
          setAuthorInfo({
            id: data.data.id,
            name: data.data.name,
            avatar_url: data.data.avatar_url,
          })
        }
      } catch (error) {
        console.error('投稿者情報取得エラー:', error)
      }
    }

    fetchAuthorInfo()
  }, [authorId])

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onDelete) {
      onDelete(code)
    }
  }

  return (
    <Link href={`/scenarios/${code}`}>
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer flex flex-col h-full">
        {/* シナリオコードと合計納品数 */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-100 mb-1">{code}</h3>
            <p className="text-sm text-gray-400">{stageName}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-400">{totalGoldenEggs}</div>
            <div className="text-xs text-gray-500">金イクラ</div>
          </div>
        </div>

        {/* キケン度 */}
        <div className="mb-3">
          <span className="text-sm text-gray-400">キケン度: </span>
          <span className="text-sm font-semibold text-red-400">{dangerRate}%</span>
        </div>

        {/* 武器アイコン4つ */}
        <div className="flex gap-2 mb-3 flex-1">
          {weapons.slice(0, 4).map((weapon, index) => (
            <div
              key={`${weapon.weapon_id}-${index}`}
              className="flex-1 bg-gray-700 rounded p-2 flex items-center justify-center min-h-[60px]"
              title={weapon.weapon_name}
            >
              {weapon.icon_url ? (
                <img
                  src={weapon.icon_url}
                  alt={weapon.weapon_name}
                  className="w-full h-auto max-h-12 object-contain"
                  onError={(e) => {
                    // 画像読み込み失敗時は武器名を表示
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    if (target.parentElement) {
                      target.parentElement.innerHTML = `<span class="text-xs text-gray-300 text-center">${weapon.weapon_name}</span>`
                    }
                  }}
                />
              ) : (
                <span className="text-xs text-gray-300 text-center">{weapon.weapon_name}</span>
              )}
            </div>
          ))}
          {/* 武器が4つ未満の場合、空のスロットを表示 */}
          {weapons.length < 4 &&
            Array.from({ length: 4 - weapons.length }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="flex-1 bg-gray-700/50 rounded p-2 flex items-center justify-center min-h-[60px] border-2 border-dashed border-gray-600"
              >
                <span className="text-xs text-gray-500">-</span>
              </div>
            ))}
        </div>

        {/* フッタ */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-700">
          {/* 投稿者アイコン */}
          {authorInfo && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                {authorInfo.avatar_url && !avatarError ? (
                  <img
                    src={authorInfo.avatar_url}
                    alt={authorInfo.name || '投稿者'}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <User className="w-3 h-3 text-gray-300" />
                )}
              </div>
              {authorInfo.name && (
                <span className="text-xs text-gray-400 truncate max-w-[100px]">
                  {authorInfo.name}
                </span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {showTrending && (
              <div className="flex items-center gap-1 text-orange-500 text-xs font-semibold">
                <TrendingUp className="h-3 w-3" />
                <span>{trendingCount}</span>
              </div>
            )}
            {showDelete && onDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="削除"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}


'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { signInWithGoogle, signOut } from '@/lib/auth/google-auth'
import type { User } from '@supabase/supabase-js'
import { Menu, X, User as UserIcon, LogOut, LogIn, Search } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils/cn'
import LogoIcon from '../LogoIcon'

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchCode, setSearchCode] = useState('')
  const [avatarError, setAvatarError] = useState(false)
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // 初期ユーザー状態を取得
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // プロフィール情報を取得（profilesテーブル優先、なければuser_metadata）
      if (user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('user_id', user.id)
            .maybeSingle()
          
          if (profile?.avatar_url) {
            setProfileAvatarUrl(profile.avatar_url)
          } else if (user.user_metadata?.avatar_url) {
            setProfileAvatarUrl(user.user_metadata.avatar_url)
          } else if (user.user_metadata?.picture) {
            setProfileAvatarUrl(user.user_metadata.picture)
          }
        } catch (error) {
          console.error('プロフィール取得エラー:', error)
          // エラーが発生した場合はuser_metadataから取得
          if (user.user_metadata?.avatar_url) {
            setProfileAvatarUrl(user.user_metadata.avatar_url)
          } else if (user.user_metadata?.picture) {
            setProfileAvatarUrl(user.user_metadata.picture)
          }
        }
      }
      
      setLoading(false)
    }
    
    loadUser()

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      
      // プロフィール情報を再取得
      if (currentUser) {
        try {
          // まず最新のユーザー情報を取得（user_metadataの更新を反映）
          const { data: { user: freshUser } } = await supabase.auth.getUser()
          
          // profilesテーブルから取得を試みる
          const { data: profile } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('user_id', currentUser.id)
            .maybeSingle()
          
          if (profile?.avatar_url) {
            setProfileAvatarUrl(profile.avatar_url)
          } else if (freshUser?.user_metadata?.avatar_url) {
            setProfileAvatarUrl(freshUser.user_metadata.avatar_url)
          } else if (freshUser?.user_metadata?.picture) {
            setProfileAvatarUrl(freshUser.user_metadata.picture)
          } else {
            setProfileAvatarUrl(null)
          }
        } catch (error) {
          console.error('プロフィール取得エラー:', error)
          // エラーが発生した場合はuser_metadataから取得
          if (currentUser.user_metadata?.avatar_url) {
            setProfileAvatarUrl(currentUser.user_metadata.avatar_url)
          } else if (currentUser.user_metadata?.picture) {
            setProfileAvatarUrl(currentUser.user_metadata.picture)
          } else {
            setProfileAvatarUrl(null)
          }
        }
      } else {
        setProfileAvatarUrl(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])
  
  // パス名が変更されたとき（プロフィール更新後など）にプロフィールを再読み込み
  useEffect(() => {
    const supabase = createClient()
    const reloadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        try {
          // 最新のユーザー情報を取得
          const { data: { user: freshUser } } = await supabase.auth.getUser()
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('user_id', user.id)
            .maybeSingle()
          
          if (profile?.avatar_url) {
            setProfileAvatarUrl(profile.avatar_url)
          } else if (freshUser?.user_metadata?.avatar_url) {
            setProfileAvatarUrl(freshUser.user_metadata.avatar_url)
          } else if (freshUser?.user_metadata?.picture) {
            setProfileAvatarUrl(freshUser.user_metadata.picture)
          }
        } catch (error) {
          console.error('プロフィール取得エラー:', error)
          // エラーが発生した場合はuser_metadataから取得
          if (user.user_metadata?.avatar_url) {
            setProfileAvatarUrl(user.user_metadata.avatar_url)
          } else if (user.user_metadata?.picture) {
            setProfileAvatarUrl(user.user_metadata.picture)
          }
        }
      }
    }
    reloadProfile()
  }, [pathname])

  const handleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Sign in error:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const isActive = (path: string) => pathname === path

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedCode = searchCode.trim()
    // シナリオコードは16桁の文字列（英数字）を想定
    if (trimmedCode.length > 0) {
      router.push(`/scenarios/${trimmedCode}`)
      setSearchCode('')
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-700 bg-gray-900 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* ロゴ */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <LogoIcon size={32} className="flex-shrink-0" />
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:space-x-2">
              <span className="text-xl sm:text-2xl font-bold text-orange-500">Salmon Run</span>
              <span className="text-sm sm:text-lg text-gray-300">Scenario Hub</span>
            </div>
          </Link>

          {/* デスクトップメニュー */}
          <nav className="hidden md:flex items-center space-x-4 flex-1 max-w-2xl mx-4">
            {/* シナリオコード検索 */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xs">
              <div className="relative">
                <input
                  type="text"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  placeholder="シナリオコードを入力"
                  className="w-full px-4 py-2 pl-10 pr-4 bg-gray-800 border border-gray-700 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  maxLength={16}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </form>

            <Link
              href="/scenarios"
              className={cn(
                'px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                isActive('/scenarios')
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              一覧
            </Link>
            <Link
              href="/analyze"
              className={cn(
                'px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                isActive('/analyze')
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              投稿する
            </Link>
            <Link
              href="/guide"
              className={cn(
                'px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                isActive('/guide')
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              ガイド
            </Link>

            {/* ユーザーメニュー */}
            {loading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-700" />
            ) : user ? (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    className="flex items-center space-x-2 rounded-full bg-gray-800 p-2 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    aria-label="ユーザーメニュー"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                      {profileAvatarUrl && !avatarError ? (
                        <img
                          src={profileAvatarUrl}
                          alt={user.user_metadata?.full_name || 'ユーザー'}
                          className="w-full h-full object-cover"
                          onError={() => setAvatarError(true)}
                        />
                      ) : user.user_metadata?.avatar_url && !avatarError ? (
                        <img
                          src={user.user_metadata.avatar_url}
                          alt={user.user_metadata?.full_name || 'ユーザー'}
                          className="w-full h-full object-cover"
                          onError={() => setAvatarError(true)}
                        />
                      ) : user.user_metadata?.picture && !avatarError ? (
                        <img
                          src={user.user_metadata.picture}
                          alt={user.user_metadata?.full_name || 'ユーザー'}
                          className="w-full h-full object-cover"
                          onError={() => setAvatarError(true)}
                        />
                      ) : (
                        <UserIcon className="h-4 w-4 text-gray-300" />
                      )}
                    </div>
                    <span className="hidden lg:block text-sm text-gray-300">
                      {user.user_metadata?.full_name || user.email?.split('@')[0] || 'ユーザー'}
                    </span>
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="min-w-[200px] rounded-md border border-gray-700 bg-gray-800 p-1 shadow-lg"
                    align="end"
                    sideOffset={5}
                  >
                    <DropdownMenu.Item
                      className="flex cursor-pointer items-center space-x-2 rounded-md px-3 py-2 text-sm text-gray-300 outline-none hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white"
                      disabled
                    >
                      <UserIcon className="h-4 w-4" />
                      <span className="truncate">
                        {user.user_metadata?.full_name || 'ユーザー'}
                      </span>
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="my-1 h-px bg-gray-700" />
                    <Link href="/profile" className="w-full">
                      <DropdownMenu.Item
                        className="flex cursor-pointer items-center space-x-2 rounded-md px-3 py-2 text-sm text-gray-300 outline-none hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white"
                      >
                        <UserIcon className="h-4 w-4" />
                        <span>マイページ</span>
                      </DropdownMenu.Item>
                    </Link>
                    <DropdownMenu.Separator className="my-1 h-px bg-gray-700" />
                    <DropdownMenu.Item
                      className="flex cursor-pointer items-center space-x-2 rounded-md px-3 py-2 text-sm text-gray-300 outline-none hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white"
                      onSelect={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" />
                      <span>ログアウト</span>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            ) : (
              <button
                onClick={handleSignIn}
                className="flex items-center space-x-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                <span>ログイン</span>
              </button>
            )}
          </nav>

          {/* モバイルメニューボタン */}
          <button
            className="md:hidden rounded-md p-2 text-gray-300 hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="メニューを開く"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* モバイルメニュー */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-700 py-4">
            <nav className="flex flex-col space-y-2">
              {/* モバイル検索 */}
              <form onSubmit={handleSearch} className="px-3">
                <div className="relative">
                  <input
                    type="text"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    placeholder="シナリオコードを入力"
                    className="w-full px-4 py-2 pl-10 pr-4 bg-gray-800 border border-gray-700 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    maxLength={16}
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </form>

              <Link
                href="/scenarios"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'px-3 py-2 rounded-md text-base font-medium transition-colors',
                  isActive('/scenarios')
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                一覧
              </Link>
              <Link
                href="/analyze"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'px-3 py-2 rounded-md text-base font-medium transition-colors',
                  isActive('/analyze')
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                投稿する
              </Link>
              <Link
                href="/guide"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'px-3 py-2 rounded-md text-base font-medium transition-colors',
                  isActive('/guide')
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                ガイド
              </Link>
              {loading ? (
                <div className="px-3 py-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-700" />
                </div>
              ) : user ? (
                <>
                  <div className="px-3 py-2 text-sm text-gray-400">
                    {user.user_metadata?.full_name || 'ユーザー'}
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 text-left text-base font-medium text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors"
                  >
                    <UserIcon className="h-5 w-5" />
                    <span>マイページ</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut()
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center space-x-2 px-3 py-2 text-left text-base font-medium text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>ログアウト</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    handleSignIn()
                    setMobileMenuOpen(false)
                  }}
                  className="flex items-center space-x-2 px-3 py-2 text-left text-base font-medium bg-orange-500 text-white hover:bg-orange-600 rounded-md transition-colors"
                >
                  <LogIn className="h-5 w-5" />
                  <span>ログイン</span>
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}


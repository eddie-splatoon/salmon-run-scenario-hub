'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { signInWithGoogle, signOut } from '@/lib/auth/google-auth'
import type { User } from '@supabase/supabase-js'
import { Menu, X, User as UserIcon, LogOut, LogIn } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils/cn'

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // 初期ユーザー状態を取得
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-700 bg-gray-900 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* ロゴ */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-orange-500">Salmon Run</span>
            <span className="text-lg text-gray-300">Scenario Hub</span>
          </Link>

          {/* デスクトップメニュー */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className={cn(
                'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive('/')
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              探す
            </Link>
            <Link
              href="/analyze"
              className={cn(
                'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive('/analyze')
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              解析
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
                    <UserIcon className="h-5 w-5 text-gray-300" />
                    <span className="hidden lg:block text-sm text-gray-300">
                      {user.email?.split('@')[0] || 'ユーザー'}
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
                      <span className="truncate">{user.email}</span>
                    </DropdownMenu.Item>
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
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'px-3 py-2 rounded-md text-base font-medium transition-colors',
                  isActive('/')
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                探す
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
                解析
              </Link>
              {loading ? (
                <div className="px-3 py-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-700" />
                </div>
              ) : user ? (
                <>
                  <div className="px-3 py-2 text-sm text-gray-400">{user.email}</div>
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


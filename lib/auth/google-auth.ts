import { createClient } from '@/lib/supabase/client'

/**
 * Google認証を開始する
 * @param redirectTo 認証成功後のリダイレクト先URL（オプション）
 */
export async function signInWithGoogle(redirectTo?: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    throw error
  }

  return data
}

/**
 * サインアウト
 */
export async function signOut() {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}

/**
 * 現在のユーザーを取得
 */
export async function getCurrentUser() {
  const supabase = createClient()
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  return user
}

/**
 * 認証セッションを取得
 */
export async function getSession() {
  const supabase = createClient()
  
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  return session
}


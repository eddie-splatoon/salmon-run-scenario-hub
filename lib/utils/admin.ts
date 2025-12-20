import { createClient } from '@/lib/supabase/server'

/**
 * 現在のユーザーが管理者かどうかを判定する
 * @returns 管理者の場合true、それ以外はfalse
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return false
  }

  const { data, error } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !data) {
    return false
  }

  return true
}

/**
 * 管理者権限をチェックし、管理者でない場合はエラーを投げる
 * @throws 管理者でない場合にエラーを投げる
 */
export async function requireAdmin(): Promise<void> {
  const isAdminUser = await isAdmin()
  if (!isAdminUser) {
    throw new Error('管理者権限が必要です')
  }
}


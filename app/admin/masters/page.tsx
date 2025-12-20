import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/utils/admin'
import MastersAdminClient from './MastersAdminClient'

export default async function MastersAdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // 非ログイン時はログインページにリダイレクト
  if (authError || !user) {
    redirect('/auth/login')
  }

  // 管理者権限チェック
  const admin = await isAdmin()
  if (!admin) {
    redirect('/')
  }

  return <MastersAdminClient />
}


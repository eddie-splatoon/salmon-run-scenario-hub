-- ユーザープロフィールテーブルの作成

-- プロフィールテーブル
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- RLSを有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- プロフィールテーブル: 全ユーザーが閲覧可能、自分のプロフィールのみ更新可能
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT
  USING (true);

CREATE POLICY "profiles_insert_authenticated" ON profiles
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND auth.uid() = user_id
  );

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 既存ユーザーのプロフィール情報を初期化するための関数
-- 注意: これはSupabase Dashboardで手動実行する必要があります
-- または、アプリケーション側でユーザーログイン時に自動的にプロフィールを作成する処理を追加する必要があります


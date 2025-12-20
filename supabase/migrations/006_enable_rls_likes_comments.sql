-- likes と comments テーブルのRLS有効化とポリシー設定

-- RLSを有効化
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- likes: 全ユーザーが閲覧可能、認証済みユーザーのみ作成・削除可能
CREATE POLICY "likes_select_all" ON likes
  FOR SELECT
  USING (true);

CREATE POLICY "likes_insert_authenticated" ON likes
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND user_id = auth.uid()
  );

CREATE POLICY "likes_delete_own" ON likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- comments: 全ユーザーが閲覧可能、認証済みユーザーのみ作成・更新・削除可能
CREATE POLICY "comments_select_all" ON comments
  FOR SELECT
  USING (true);

CREATE POLICY "comments_insert_authenticated" ON comments
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND user_id = auth.uid()
  );

CREATE POLICY "comments_update_own" ON comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_delete_own" ON comments
  FOR DELETE
  USING (auth.uid() = user_id);


-- マスタテーブル（m_stages, m_weapons）の管理者権限ポリシー

-- マスタテーブルの更新・削除は管理者のみ可能
CREATE POLICY "m_stages_insert_admin" ON m_stages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "m_stages_update_admin" ON m_stages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "m_stages_delete_admin" ON m_stages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "m_weapons_insert_admin" ON m_weapons
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "m_weapons_update_admin" ON m_weapons
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "m_weapons_delete_admin" ON m_weapons
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid()
    )
  );


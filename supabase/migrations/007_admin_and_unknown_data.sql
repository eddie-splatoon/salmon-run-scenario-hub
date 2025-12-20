-- 管理者権限と未知データ管理のテーブル作成

-- 管理者テーブル
CREATE TABLE IF NOT EXISTS admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 未知のステージを保存するテーブル
CREATE TABLE IF NOT EXISTS unknown_stages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_stage_id INTEGER REFERENCES m_stages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 未知の武器を保存するテーブル
CREATE TABLE IF NOT EXISTS unknown_weapons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_weapon_id INTEGER REFERENCES m_weapons(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ステージ名のエイリアス（名寄せ用）
CREATE TABLE IF NOT EXISTS stage_aliases (
  id SERIAL PRIMARY KEY,
  stage_id INTEGER NOT NULL REFERENCES m_stages(id) ON DELETE CASCADE,
  alias VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(alias)
);

-- 武器名のエイリアス（名寄せ用）
CREATE TABLE IF NOT EXISTS weapon_aliases (
  id SERIAL PRIMARY KEY,
  weapon_id INTEGER NOT NULL REFERENCES m_weapons(id) ON DELETE CASCADE,
  alias VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(alias)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_unknown_stages_name ON unknown_stages(name);
CREATE INDEX IF NOT EXISTS idx_unknown_stages_resolved_at ON unknown_stages(resolved_at);
CREATE INDEX IF NOT EXISTS idx_unknown_weapons_name ON unknown_weapons(name);
CREATE INDEX IF NOT EXISTS idx_unknown_weapons_resolved_at ON unknown_weapons(resolved_at);
CREATE INDEX IF NOT EXISTS idx_stage_aliases_stage_id ON stage_aliases(stage_id);
CREATE INDEX IF NOT EXISTS idx_stage_aliases_alias ON stage_aliases(alias);
CREATE INDEX IF NOT EXISTS idx_weapon_aliases_weapon_id ON weapon_aliases(weapon_id);
CREATE INDEX IF NOT EXISTS idx_weapon_aliases_alias ON weapon_aliases(alias);

-- RLSを有効化
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE unknown_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE unknown_weapons ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE weapon_aliases ENABLE ROW LEVEL SECURITY;

-- 管理者テーブル: 管理者のみ閲覧可能
CREATE POLICY "admins_select_admin" ON admins
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid()
    )
  );

-- 未知データテーブル: 全ユーザーが閲覧可能、管理者のみ更新可能
CREATE POLICY "unknown_stages_select_all" ON unknown_stages
  FOR SELECT
  USING (true);

CREATE POLICY "unknown_stages_insert_authenticated" ON unknown_stages
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "unknown_stages_update_admin" ON unknown_stages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "unknown_weapons_select_all" ON unknown_weapons
  FOR SELECT
  USING (true);

CREATE POLICY "unknown_weapons_insert_authenticated" ON unknown_weapons
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "unknown_weapons_update_admin" ON unknown_weapons
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid()
    )
  );

-- エイリアステーブル: 全ユーザーが閲覧可能、管理者のみ更新可能
CREATE POLICY "stage_aliases_select_all" ON stage_aliases
  FOR SELECT
  USING (true);

CREATE POLICY "stage_aliases_insert_admin" ON stage_aliases
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "stage_aliases_update_admin" ON stage_aliases
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "stage_aliases_delete_admin" ON stage_aliases
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "weapon_aliases_select_all" ON weapon_aliases
  FOR SELECT
  USING (true);

CREATE POLICY "weapon_aliases_insert_admin" ON weapon_aliases
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "weapon_aliases_update_admin" ON weapon_aliases
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "weapon_aliases_delete_admin" ON weapon_aliases
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE user_id = auth.uid()
    )
  );


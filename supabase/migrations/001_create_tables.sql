-- サーモンラン関連テーブルの作成

-- マスタ: ステージ
CREATE TABLE IF NOT EXISTS m_stages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- マスタ: 武器
CREATE TABLE IF NOT EXISTS m_weapons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  icon_url TEXT,
  is_grizzco_weapon BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- シナリオ
CREATE TABLE IF NOT EXISTS scenarios (
  code VARCHAR(50) PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  stage_id INTEGER NOT NULL REFERENCES m_stages(id) ON DELETE RESTRICT,
  danger_rate INTEGER NOT NULL CHECK (danger_rate >= 0 AND danger_rate <= 333),
  total_golden_eggs INTEGER NOT NULL DEFAULT 0 CHECK (total_golden_eggs >= 0),
  total_power_eggs INTEGER NOT NULL DEFAULT 0 CHECK (total_power_eggs >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- シナリオのWAVE情報
CREATE TABLE IF NOT EXISTS scenario_waves (
  scenario_code VARCHAR(50) NOT NULL REFERENCES scenarios(code) ON DELETE CASCADE,
  wave_number INTEGER NOT NULL CHECK (wave_number >= 1 AND wave_number <= 3),
  tide VARCHAR(20) NOT NULL CHECK (tide IN ('low', 'normal', 'high')),
  event VARCHAR(50),
  delivered_count INTEGER NOT NULL DEFAULT 0 CHECK (delivered_count >= 0),
  quota INTEGER NOT NULL CHECK (quota > 0),
  cleared BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (scenario_code, wave_number)
);

-- シナリオの武器情報
CREATE TABLE IF NOT EXISTS scenario_weapons (
  scenario_code VARCHAR(50) NOT NULL REFERENCES scenarios(code) ON DELETE CASCADE,
  weapon_id INTEGER NOT NULL REFERENCES m_weapons(id) ON DELETE RESTRICT,
  display_order INTEGER NOT NULL CHECK (display_order >= 1 AND display_order <= 4),
  PRIMARY KEY (scenario_code, weapon_id)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_scenarios_author_id ON scenarios(author_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_stage_id ON scenarios(stage_id);
CREATE INDEX IF NOT EXISTS idx_scenario_waves_scenario_code ON scenario_waves(scenario_code);
CREATE INDEX IF NOT EXISTS idx_scenario_weapons_scenario_code ON scenario_weapons(scenario_code);
CREATE INDEX IF NOT EXISTS idx_scenario_weapons_weapon_id ON scenario_weapons(weapon_id);

-- updated_atを自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルにupdated_atトリガーを設定
CREATE TRIGGER update_m_stages_updated_at
  BEFORE UPDATE ON m_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_m_weapons_updated_at
  BEFORE UPDATE ON m_weapons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scenarios_updated_at
  BEFORE UPDATE ON scenarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


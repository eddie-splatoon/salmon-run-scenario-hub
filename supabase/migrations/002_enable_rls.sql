-- Row Level Security (RLS) の有効化とポリシー設定

-- RLSを有効化
ALTER TABLE m_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE m_weapons ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_waves ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_weapons ENABLE ROW LEVEL SECURITY;

-- マスタテーブル（m_stages, m_weapons）: 全ユーザーが閲覧可能
CREATE POLICY "m_stages_select_all" ON m_stages
  FOR SELECT
  USING (true);

CREATE POLICY "m_weapons_select_all" ON m_weapons
  FOR SELECT
  USING (true);

-- scenarios: 全ユーザーが閲覧可能、認証済みユーザーのみ作成可能
CREATE POLICY "scenarios_select_all" ON scenarios
  FOR SELECT
  USING (true);

CREATE POLICY "scenarios_insert_authenticated" ON scenarios
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "scenarios_update_own" ON scenarios
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "scenarios_delete_own" ON scenarios
  FOR DELETE
  USING (auth.uid() = author_id);

-- scenario_waves: 全ユーザーが閲覧可能、認証済みユーザーのみ作成可能
CREATE POLICY "scenario_waves_select_all" ON scenario_waves
  FOR SELECT
  USING (true);

CREATE POLICY "scenario_waves_insert_authenticated" ON scenario_waves
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scenarios
      WHERE scenarios.code = scenario_waves.scenario_code
      AND scenarios.author_id = auth.uid()
    )
  );

CREATE POLICY "scenario_waves_update_authenticated" ON scenario_waves
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM scenarios
      WHERE scenarios.code = scenario_waves.scenario_code
      AND scenarios.author_id = auth.uid()
    )
  );

CREATE POLICY "scenario_waves_delete_authenticated" ON scenario_waves
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM scenarios
      WHERE scenarios.code = scenario_waves.scenario_code
      AND scenarios.author_id = auth.uid()
    )
  );

-- scenario_weapons: 全ユーザーが閲覧可能、認証済みユーザーのみ作成可能
CREATE POLICY "scenario_weapons_select_all" ON scenario_weapons
  FOR SELECT
  USING (true);

CREATE POLICY "scenario_weapons_insert_authenticated" ON scenario_weapons
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scenarios
      WHERE scenarios.code = scenario_weapons.scenario_code
      AND scenarios.author_id = auth.uid()
    )
  );

CREATE POLICY "scenario_weapons_update_authenticated" ON scenario_weapons
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM scenarios
      WHERE scenarios.code = scenario_weapons.scenario_code
      AND scenarios.author_id = auth.uid()
    )
  );

CREATE POLICY "scenario_weapons_delete_authenticated" ON scenario_weapons
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM scenarios
      WHERE scenarios.code = scenario_weapons.scenario_code
      AND scenarios.author_id = auth.uid()
    )
  );


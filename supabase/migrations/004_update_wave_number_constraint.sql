-- scenario_wavesテーブルのwave_number制約を更新
-- WAVE EXを保存するため、制約を1-4に変更

-- 既存のCHECK制約を削除
ALTER TABLE scenario_waves
  DROP CONSTRAINT IF EXISTS scenario_waves_wave_number_check;

-- 新しいCHECK制約を追加（1-4を許可）
ALTER TABLE scenario_waves
  ADD CONSTRAINT scenario_waves_wave_number_check
  CHECK (wave_number >= 1 AND wave_number <= 4);


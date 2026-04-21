-- サーモンラン対応ブキのマスタ整備
-- 参考: https://gamepedia.jp/splatoon3/archives/15178
--
-- 1. 既存の「モップリンD」を正式名称「モップリン」にリネーム
--    （id および外部キー参照を保持するため、DELETE/INSERT ではなく UPDATE で対応）
-- 2. 参考サイトに記載があるが m_weapons に未登録のブキを追加

-- 1. モップリンD → モップリン
UPDATE m_weapons
SET name = 'モップリン'
WHERE name = 'モップリンD';

-- 2. 不足ブキの追加
INSERT INTO m_weapons (name, icon_url, is_grizzco_weapon)
SELECT
  (item->>'name')::VARCHAR AS name,
  NULLIF(item->>'icon_url', 'null')::TEXT AS icon_url,
  COALESCE((item->>'is_grizzco_weapon')::BOOLEAN, false) AS is_grizzco_weapon
FROM jsonb_array_elements('[
  {"name": "スペースシューター", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "14式竹筒銃・甲", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "R-PEN/5H", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "S-BLAST92", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "イグザミナー", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "フィンセント", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "フルイドV", "icon_url": null, "is_grizzco_weapon": false}
]'::jsonb) AS item
ON CONFLICT (name) DO NOTHING;

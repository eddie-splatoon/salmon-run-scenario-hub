-- マスタデータのインポート
-- JSONファイルからデータを読み込んで投入します

-- ステージマスタデータのインポート
INSERT INTO m_stages (name, image_url)
SELECT
  (item->>'name')::VARCHAR AS name,
  NULLIF(item->>'image_url', 'null')::TEXT AS image_url
FROM jsonb_array_elements('[
  {"name": "アラマキ砦", "image_url": null},
  {"name": "ムニ・エール海洋発電所", "image_url": null},
  {"name": "シェケナダム", "image_url": null},
  {"name": "難破船ドン・ブラコ", "image_url": null},
  {"name": "すじこジャンクション跡", "image_url": null},
  {"name": "トキシラズいぶし工房", "image_url": null},
  {"name": "どんぴこ闘技場", "image_url": null}
]'::jsonb) AS item
ON CONFLICT (name) DO NOTHING;

-- 武器マスタデータのインポート
INSERT INTO m_weapons (name, icon_url, is_grizzco_weapon)
SELECT
  (item->>'name')::VARCHAR AS name,
  NULLIF(item->>'icon_url', 'null')::TEXT AS icon_url,
  COALESCE((item->>'is_grizzco_weapon')::BOOLEAN, false) AS is_grizzco_weapon
FROM jsonb_array_elements('[
  {"name": "わかばシューター", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "スプラシューター", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "N-ZAP85", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "プロモデラーMG", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "シャープマーカー", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "ボールドマーカー", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "プライムシューター", "icon_url": null, "is_grizzco_weapon": false},
  {"name": ".52ガロン", "icon_url": null, "is_grizzco_weapon": false},
  {"name": ".52ガロンデコ", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "ジェットスイーパー", "icon_url": null, "is_grizzco_weapon": false},
  {"name": ".96ガロン", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "L3リールガン", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "H3リールガン", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "ボトルガイザー", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "ガエンFF", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "スプラローラー", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "カーボンローラー", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "ダイナモローラー", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "ヴァリアブルローラー", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "ヴァリアブルローラーフォイル", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "ワイドローラー", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "スプラチャージャー", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "スクイックリンα", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "スクイックリンβ", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "リッター4K", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "リッター4Kカスタム", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "4Kスコープ", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "ソイチューバー", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "スプラスロッシャー", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "バケットスロッシャー", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "ヒッセン", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "スクリュースロッシャー", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "エクスプロッシャー", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "エクスプロッシャーカスタム", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "オーバーフロッシャー", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "ホットブラスター", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "ロングブラスター", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "ノヴァブラスター", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "ラピッドブラスター", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "Rブラスターエリート", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "クラッシュブラスター", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "スプラスピナー", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "バレルスピナー", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "ハイドラント", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "クーゲルシュライバー", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "ノーチラス47", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "ノーチラス79", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "スプラマニューバー", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "スパッタリー", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "クアッドホッパーブラック", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "デュアルスイーパー", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "ケルビン525", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "ケルビン525デコ", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "パラシェルター", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "キャンピングシェルター", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "スパイガジェット", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "24式張替傘・甲", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "パブロ", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "ホクサイ", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "トライストリンガー", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "LACT-450", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "モップリンD", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "ドライブワイパー", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "ジムワイパー", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "デンタルワイパーミント", "icon_url": null, "is_grizzco_weapon": false},
  {"name": "クマサン印のブラスター", "icon_url": null, "is_grizzco_weapon": true},
  {"name": "クマサン印のシェルター", "icon_url": null, "is_grizzco_weapon": true},
  {"name": "クマサン印のストリンガー", "icon_url": null, "is_grizzco_weapon": true},
  {"name": "クマサン印のワイパー", "icon_url": null, "is_grizzco_weapon": true},
  {"name": "クマサン印のスロッシャー", "icon_url": null, "is_grizzco_weapon": true},
  {"name": "クマサン印のチャージャー", "icon_url": null, "is_grizzco_weapon": true},
  {"name": "クマサン印のマニューバー", "icon_url": null, "is_grizzco_weapon": true},
  {"name": "クマサン印のローラー", "icon_url": null, "is_grizzco_weapon": true}
]'::jsonb) AS item
ON CONFLICT (name) DO NOTHING;

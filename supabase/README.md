# Supabase データベースマイグレーション

このディレクトリには、サーモンラン関連テーブルの作成とマスタデータのインポート用のSQLファイルが含まれています。

## ファイル構成

```
supabase/
├── migrations/
│   ├── 001_create_tables.sql      # テーブル作成
│   ├── 002_enable_rls.sql         # RLS有効化とポリシー設定
│   └── 003_import_master_data.sql # マスタデータのインポート
└── seed/
    ├── m_stages.json               # ステージマスタデータ
    └── m_weapons.json              # 武器マスタデータ
```

## 実行手順

### 1. Supabase Dashboardでの実行

1. [Supabase Dashboard](https://app.supabase.com/)にログイン
2. プロジェクトを選択
3. **SQL Editor**を開く
4. 以下の順序でSQLファイルを実行：
   - `001_create_tables.sql`
   - `002_enable_rls.sql`
   - `003_import_master_data.sql`

### 2. コマンドラインでの実行

Supabase CLIを使用している場合：

```bash
# Supabase CLIでマイグレーションを適用
supabase db push

# または、個別にSQLファイルを実行
psql -h <your-db-host> -U postgres -d postgres -f migrations/001_create_tables.sql
psql -h <your-db-host> -U postgres -d postgres -f migrations/002_enable_rls.sql
psql -h <your-db-host> -U postgres -d postgres -f migrations/003_import_master_data.sql
```

## 便利なクエリ

### テーブル一覧の取得

MySQLの`SHOW TABLES`に相当するPostgreSQLのクエリ：

```sql
-- 方法1: information_schemaを使用（推奨）
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 方法2: pg_tablesを使用
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

### テーブル構造の確認

```sql
-- テーブルのカラム情報を取得
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'テーブル名'
ORDER BY ordinal_position;
```

## テーブル構成

### m_stages（ステージマスタ）
- `id`: 主キー（SERIAL）
- `name`: ステージ名（UNIQUE）
- `image_url`: 画像URL

### m_weapons（武器マスタ）
- `id`: 主キー（SERIAL）
- `name`: 武器名（UNIQUE）
- `icon_url`: アイコンURL
- `is_grizzco_weapon`: クマサン武器フラグ

### scenarios（シナリオ）
- `code`: 主キー（シナリオコード）
- `author_id`: 投稿者ID（auth.users参照）
- `stage_id`: ステージID（m_stages参照）
- `danger_rate`: キケン度（0-333）
- `total_golden_eggs`: 総金イクラ数
- `total_power_eggs`: 総赤イクラ数

### scenario_waves（WAVE情報）
- `scenario_code`: シナリオコード（scenarios参照）
- `wave_number`: WAVE番号（1-3）
- `tide`: 潮位（low/normal/high）
- `event`: イベント名
- `delivered_count`: 納品数
- `quota`: ノルマ
- `cleared`: クリア成否

### scenario_weapons（シナリオ武器情報）
- `scenario_code`: シナリオコード（scenarios参照）
- `weapon_id`: 武器ID（m_weapons参照）
- `display_order`: 表示順（1-4）

## Row Level Security (RLS)

### 閲覧権限
- すべてのテーブルで、全ユーザーが閲覧可能（`SELECT`）

### 作成権限
- `scenarios`: 認証済みユーザーのみ作成可能
- `scenario_waves`: シナリオの作成者のみ作成可能
- `scenario_weapons`: シナリオの作成者のみ作成可能

### 更新・削除権限
- `scenarios`: 作成者のみ更新・削除可能
- `scenario_waves`: シナリオの作成者のみ更新・削除可能
- `scenario_weapons`: シナリオの作成者のみ更新・削除可能

## 注意事項

- マスタテーブル（`m_stages`、`m_weapons`）は、RLSポリシーにより全ユーザーが閲覧可能ですが、更新・削除は管理者のみが可能です（RLSポリシー未設定のため、デフォルトで拒否されます）
- `scenarios`テーブルの`author_id`は、認証済みユーザーのIDを自動的に設定する必要があります
- 外部キー制約により、存在しないステージIDや武器IDを参照することはできません


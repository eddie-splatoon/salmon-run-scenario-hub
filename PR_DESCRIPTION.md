# プロジェクト初期化とGoogle認証実装準備

## 概要

Next.js 16 (App Router)、Tailwind CSS、TypeScript、Supabaseを使用したプロジェクトの初期化と、Google認証の実装準備を行いました。

## 主な変更内容

### 1. プロジェクト初期化
- Next.js 16.0.10 (App Router) のセットアップ
- TypeScript設定
- Tailwind CSS設定
- Supabaseクライアント設定（サーバー/クライアント）

### 2. 依存関係の更新
- **Next.js**: `^16.0.10` にアップグレード
- **ESLint**: `^9.0.0` にアップグレード（Next.js 16の要件に対応）
- **eslint-config-next**: `^16.0.10` に更新
- **@supabase/ssr**: `^0.8.0` に更新（最新のAPIに対応）

### 3. Next.js 16への対応
- `middleware.ts` → `proxy.ts` への変更（Next.js 16の新しい命名規則）
- `middleware` 関数 → `proxy` 関数への変更
- `cookies()` APIの非同期化対応（`await cookies()`）

### 4. Supabase SSR APIの最新化
- 古いAPI（`get`, `set`, `remove`）から新しいAPI（`getAll`, `setAll`）への移行
- `@supabase/ssr` 0.8.0の非推奨警告を解消

### 5. Google認証の実装準備
- `/auth/login` ページの作成
- `/auth/callback` ルートハンドラーの実装
- Google認証ヘルパー関数の実装（`lib/auth/google-auth.ts`）
- エラーハンドリングの追加

### 6. テスト環境の構築
- VitestとReact Testing Libraryの設定
- サンプルテストファイルの作成（`app/__tests__/page.test.tsx`, `lib/auth/__tests__/google-auth.test.ts`）
- カバレッジレポートの設定

### 7. ESLint設定の更新
- Next.js 16 + ESLint 9対応（`eslint.config.mjs`）
- フラット設定形式への移行

### 8. Docker設定
- マルチステージビルド対応のDockerfile
- docker-compose.ymlの作成
- `.dockerignore`の設定

### 9. CI/CDパイプライン
- GitHub Actions CIワークフロー（Lint + Test）
- GitHub Actions CDワークフロー（Dockerイメージのビルドとプッシュ）

## 技術スタック

- **フレームワーク**: Next.js 16.0.10 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **認証**: Supabase Auth (Google OAuth)
- **バックエンド**: Supabase
- **テスト**: Vitest, React Testing Library
- **CI/CD**: GitHub Actions
- **コンテナ**: Docker

## ファイル構成

```
salmon-run-scenario-hub/
├── app/
│   ├── auth/
│   │   ├── callback/route.ts      # OAuthコールバック処理
│   │   └── login/page.tsx          # ログインページ
│   ├── types/database.types.ts     # Supabaseデータベース型定義
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── auth/google-auth.ts        # Google認証ヘルパー
│   └── supabase/
│       ├── client.ts               # クライアント側Supabase
│       └── server.ts               # サーバー側Supabase
├── proxy.ts                        # 認証ミドルウェア（Next.js 16）
└── 設定ファイル群
```

## 主な修正点

### Next.js 16への移行
- `middleware.ts` → `proxy.ts` へのリネーム
- `cookies()` APIの非同期化対応

### Supabase SSR APIの更新
- `getAll()` / `setAll()` メソッドへの移行
- 非推奨警告の解消

### エラーハンドリング
- コールバック処理でのエラーハンドリング追加
- エラー時の適切なリダイレクト処理

## セットアップ手順

1. 依存関係のインストール
   ```bash
   npm install
   ```

2. 環境変数の設定（`.env.local`）
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. SupabaseでのGoogle認証設定
   - Supabase Dashboard > Authentication > Providers > Google
   - Google OAuth 2.0クライアントIDとシークレットを設定
   - リダイレクトURL: `http://localhost:3000/auth/callback`

## テスト

- [x] 依存関係のインストール確認
- [x] Next.js 16でのビルド確認
- [x] Google認証フローの動作確認
- [x] コールバック処理の動作確認
- [x] テスト環境の動作確認
- [x] ESLint設定の動作確認
- [x] Dockerビルドの確認

## 追加されたファイル

### テスト関連
- `vitest.config.ts` - Vitest設定
- `vitest.setup.ts` - テストセットアップ
- `app/__tests__/page.test.tsx` - ホームページのテスト
- `lib/auth/__tests__/google-auth.test.ts` - Google認証のテスト

### ESLint
- `eslint.config.mjs` - ESLint 9フラット設定

### Docker
- `Dockerfile` - マルチステージビルド対応
- `docker-compose.yml` - Docker Compose設定
- `.dockerignore` - Docker除外設定

### CI/CD
- `.github/workflows/ci.yml` - CIワークフロー
- `.github/workflows/cd.yml` - CDワークフロー

## 関連Issue

Issue #1: Google Authの実装準備

## 備考

- Next.js 16の新しい命名規則（`proxy.ts`）に対応
- `@supabase/ssr` の最新APIを使用
- 非同期`cookies()` APIに対応


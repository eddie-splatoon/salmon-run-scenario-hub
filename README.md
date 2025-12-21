# Salmon Run Scenario Hub

[![codecov](https://codecov.io/github/eddie-splatoon/salmon-run-scenario-hub/graph/badge.svg?token=SF9LO1W2XR)](https://codecov.io/github/eddie-splatoon/salmon-run-scenario-hub)

Next.js 16 (App Router)、Tailwind CSS、TypeScript、Supabaseを使用したプロジェクトです。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL_NAME=gemini-1.5-pro  # オプション: デフォルトは gemini-1.5-pro
```

**注意**: 
- `GEMINI_API_KEY`はGoogle AI Studio（https://aistudio.google.com/app/apikey）で取得できます。
- `GEMINI_MODEL_NAME`は利用可能なモデル名を指定します（例: `gemini-1.5-pro`, `gemini-1.5-flash-002`）。
  利用可能なモデルを確認するには: `curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY"`

### 3. SupabaseでのGoogle認証設定

1. Supabase Dashboardにログイン
2. **Authentication** > **Providers** > **Google** を開く
3. Google認証を有効化
4. Google Cloud ConsoleでOAuth 2.0クライアントIDとシークレットを取得
5. SupabaseにクライアントIDとシークレットを設定
6. リダイレクトURLを設定：
   - `https://your-project-ref.supabase.co/auth/v1/callback`
   - 開発環境の場合: `http://localhost:3000/auth/callback`

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

### 5. テストの実行

```bash
# テストを実行
npm run test

# テストUIを開く
npm run test:ui

# カバレッジレポートを生成
npm run test:coverage
```

### 6. Dockerでの起動

```bash
# Dockerイメージをビルド
docker-compose build

# コンテナを起動
docker-compose up

# バックグラウンドで起動
docker-compose up -d
```

## プロジェクト構成

```
salmon-run-scenario-hub/
├── app/
│   ├── auth/
│   │   ├── callback/
│   │   │   └── route.ts          # OAuthコールバック処理
│   │   └── login/
│   │       └── page.tsx          # ログインページ
│   ├── types/
│   │   └── database.types.ts     # Supabaseデータベース型定義
│   ├── globals.css               # グローバルスタイル
│   ├── layout.tsx                # ルートレイアウト
│   └── page.tsx                  # ホームページ
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts          # 画像解析APIエンドポイント
│   ├── components/
│   │   └── ImageAnalyzer.tsx     # 画像アップロード・解析UIコンポーネント
│   └── types/
│       └── analyze.ts            # 画像解析APIの型定義
├── lib/
│   ├── ai/
│   │   └── prompt.ts             # Gemini API用のシステムプロンプト
│   ├── auth/
│   │   └── google-auth.ts        # Google認証ヘルパー関数
│   ├── supabase/
│   │   ├── client.ts             # クライアント側Supabaseクライアント
│   │   └── server.ts             # サーバー側Supabaseクライアント
│   └── utils/
│       └── master-lookup.ts      # マスタデータの名寄せユーティリティ
├── proxy.ts                      # 認証ミドルウェア（Next.js 16の新しい命名規則）
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```

## Google認証の使用方法

### クライアントコンポーネントでの使用例

```typescript
'use client'

import { signInWithGoogle, signOut, getCurrentUser } from '@/lib/auth/google-auth'

// Googleでログイン
await signInWithGoogle()

// ログアウト
await signOut()

// 現在のユーザーを取得
const user = await getCurrentUser()
```

### サーバーコンポーネントでの使用例

```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

## CI/CD

このリポジトリでは、GitHub Actionsを利用してCI/CDパイプラインを構築しています。

### CI (継続的インテグレーション)
- `main`または`staging`ブランチへのプルリクエスト時、および`main`ブランチへのプッシュ時に自動実行
- Lintとテストが実行されます
- カバレッジレポートがCodecovにアップロードされます

### CD (継続的デリバリー)
- `main`ブランチへのマージをトリガーとして、Dockerイメージがビルドされます
- DockerイメージはGitHub Container Registryに自動的にプッシュされます

### Wiki同期
- `docs-wiki`ディレクトリ（submodule）の変更を検知して、自動的にGitHub Wikiに同期されます
- `main`ブランチへのマージ時、または`docs-wiki/**`パスへの変更時に実行されます
- **セットアップ**: GitHubリポジトリのSettings > Secrets and variables > Actionsに`WIKI_SYNC_TOKEN`（Personal Access Token）を設定してください

## 次のステップ

- [ ] Supabaseプロジェクトの作成と環境変数の設定
- [ ] Google OAuth認証の設定
- [ ] ユーザー情報の表示
- [ ] 認証が必要なページの保護

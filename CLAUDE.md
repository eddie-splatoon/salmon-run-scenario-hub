# Claude AI エージェント向けプロジェクト情報

このファイルは、Claude AIエージェントがこのプロジェクトで作業する際の参考情報を提供します。

## プロジェクト概要

**Salmon Run Scenario Hub** は、Next.js 16 (App Router)、TypeScript、Tailwind CSS、Supabaseを使用したWebアプリケーションです。

## 技術スタック

- **フレームワーク**: Next.js 16.0.10 (App Router)
- **言語**: TypeScript 5.3.0
- **スタイリング**: Tailwind CSS 3.4.0
- **認証**: Supabase Auth (Google OAuth)
- **バックエンド**: Supabase
- **テスト**: Vitest 1.1.0, React Testing Library 14.1.2
- **Lint**: ESLint 9.0.0, eslint-config-next 16.0.10
- **コンテナ**: Docker
- **CI/CD**: GitHub Actions

## プロジェクト構成

```
salmon-run-scenario-hub/
├── app/                          # Next.js App Router
│   ├── __tests__/               # テストファイル
│   ├── auth/                     # 認証関連ページ
│   │   ├── callback/            # OAuthコールバック
│   │   └── login/               # ログインページ
│   ├── types/                    # 型定義
│   │   └── database.types.ts    # Supabaseデータベース型
│   ├── globals.css               # グローバルスタイル
│   ├── layout.tsx                # ルートレイアウト
│   └── page.tsx                  # ホームページ
├── lib/                          # ライブラリ・ユーティリティ
│   ├── auth/                     # 認証ヘルパー
│   │   ├── __tests__/           # 認証のテスト
│   │   └── google-auth.ts       # Google認証関数
│   └── supabase/                 # Supabaseクライアント
│       ├── client.ts             # クライアント側（ブラウザ）
│       └── server.ts             # サーバー側（SSR/API Routes）
├── proxy.ts                      # 認証ミドルウェア（Next.js 16）
├── docs-wiki/                    # Wikiドキュメント（submodule）
├── .github/workflows/            # GitHub Actions
│   ├── ci.yml                    # CIワークフロー
│   ├── cd.yml                    # CDワークフロー
│   └── sync-wiki.yml             # Wiki同期ワークフロー
└── 設定ファイル群
```

## 重要な設計原則

### 1. Next.js 16の新機能

- **proxy.ts**: `middleware.ts`の代わりに`proxy.ts`を使用（Next.js 16の新しい命名規則）
- **非同期cookies()**: `cookies()`はPromiseを返すため、`await cookies()`を使用
- **App Router**: Pages RouterではなくApp Routerを使用

### 2. Supabase SSR API

- **最新API**: `@supabase/ssr` 0.8.0の新しいAPIを使用
  - クライアント: `createBrowserClient()`
  - サーバー: `createServerClient()` with `getAll()` / `setAll()`
- **型安全性**: `Database`型を使用して型安全に

### 3. 認証パターン

```typescript
// クライアントコンポーネント
'use client'
import { signInWithGoogle } from '@/lib/auth/google-auth'

// サーバーコンポーネント
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()  // awaitが必要
```

### 4. テスト

- Vitestを使用（Jestの代替）
- React Testing Libraryでコンポーネントをテスト
- テストファイルは`__tests__`ディレクトリに配置

## コーディング規約

### TypeScript

- 厳格モード（`strict: true`）を使用
- 型定義は明示的に記述
- `any`の使用は避ける

### ファイル命名規則

- コンポーネント: PascalCase（例: `UserProfile.tsx`）
- ユーティリティ: camelCase（例: `google-auth.ts`）
- テスト: `*.test.ts` または `*.test.tsx`

### インポート順序

1. React / Next.js
2. サードパーティライブラリ
3. 内部モジュール（`@/`エイリアス）
4. 型定義

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/app/types/database.types'
```

## 環境変数

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

- `.env.local`に設定（Gitにコミットしない）
- `NEXT_PUBLIC_`プレフィックスが必要（クライアント側で使用する場合）

## よく使用するコマンド

```bash
# 開発サーバー
npm run dev

# ビルド
npm run build

# テスト
npm run test
npm run test:ui
npm run test:coverage

# Lint
npm run lint
npm run lint:fix

# Docker
docker-compose up
```

## 注意事項

### 1. Next.js 16の変更点

- `middleware.ts` → `proxy.ts`に変更
- `cookies()`は非同期API
- ESLint 9が必要

### 2. Supabase SSR

- サーバー側では`await createClient()`を使用
- Cookie処理は`getAll()` / `setAll()`を使用
- 古いAPI（`get`, `set`, `remove`）は非推奨

### 3. テスト

- VitestのグローバルAPIを使用（`describe`, `it`, `expect`）
- `@testing-library/jest-dom`のマッチャーを使用
- モックは`vi.mock()`を使用

## トラブルシューティング

### 認証エラー

- 環境変数が正しく設定されているか確認
- Supabase DashboardでGoogle認証が有効か確認
- リダイレクトURIが正しく設定されているか確認

### ビルドエラー

- `npm ci`で依存関係を再インストール
- TypeScriptの型エラーを確認
- Next.jsのキャッシュをクリア（`.next`ディレクトリを削除）

### テストエラー

- `vitest.setup.ts`が正しく設定されているか確認
- モックの設定を確認
- 非同期処理で`await`を使用しているか確認

## 参考リンク

- [Next.js 16 ドキュメント](https://nextjs.org/docs)
- [Supabase ドキュメント](https://supabase.com/docs)
- [Vitest ドキュメント](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)

## Pull Request作成時の前提条件

**重要**: Pull Requestを作成する前に、以下の作業を必ず実施してください。

### 1. ブランチの作成

- Issueに対応する適切な作業ブランチを作成すること
- ブランチ名は `feature/issue-{番号}-{簡潔な説明}` または `fix/issue-{番号}-{簡潔な説明}` の形式を推奨
- 例: `feature/issue-1-google-auth`, `fix/issue-5-login-error`

### 2. Issueの確認

- Issueの`概要`と`詳細`の内容を必ず読み取り、記述内容の条件を全て対応すること
- Issueに記載されている要件を漏れなく実装すること
- 不明な点がある場合は、Issueにコメントで確認すること

### 3. テストの作成

- コード修正時、対応するテストも必ず作成すること
- 新機能には必ずテストを追加すること
- 既存機能の修正時は、既存のテストを更新し、必要に応じて新しいテストを追加すること
- テストカバレッジ80%以上を維持すること

### 4. ESLintチェック

- ESLintによるチェックを必ず実行すること
- `npm run lint`を実行し、エラーがないことを確認すること
- エラーがある場合は、`npm run lint:fix`で自動修正を試み、残りのエラーは手動で修正すること

### 5. Pull Requestの作成

- `gh`コマンドを利用し、Pull Requestを作成すること
- Pull Request内の言語は**日本語**で記述すること
- Pull Requestには変更内容に応じて処理シーケンスなどを**mermaid形式**で記述すること
- 指定されたIssue番号を必ず記述すること（例: `Closes #1`, `Fixes #5`）

#### Pull Requestのテンプレート例

```markdown
## 概要
[変更内容の簡潔な説明]

## 変更内容
- [変更点1]
- [変更点2]

## 処理フロー

\`\`\`mermaid
sequenceDiagram
    participant User
    participant App
    participant Supabase
    
    User->>App: ログイン要求
    App->>Supabase: 認証リクエスト
    Supabase-->>App: 認証トークン
    App-->>User: ログイン成功
\`\`\`

## テスト
- [ ] 単体テストを追加
- [ ] 統合テストを実行
- [ ] 手動テストを実施

## 関連Issue
Closes #1
```

### 6. AIエージェント向けファイルの更新

- Cursorが変更内容を適切にトレースできるよう、必要に応じて以下のファイルを修正すること：
  - `CLAUDE.md` - 新機能や設計変更を反映
  - `GEMINI.md` - アーキテクチャやパターンの変更を反映
  - `.cursorrules` - コーディング規約の変更を反映

### 7. ドキュメントの更新

- `docs-wiki`ディレクトリ内のドキュメントを常に最新のコードに合わせて修正すること
- 新機能追加時は、関連するWikiページを更新または作成すること
- 設定変更時は、セットアップ手順を更新すること

#### 更新が必要なドキュメント例

- 新機能追加: 該当する機能ページを更新
- API変更: APIドキュメントを更新
- 設定変更: セットアップ手順を更新
- アーキテクチャ変更: アーキテクチャ図を更新

## 開発時の推奨事項

1. **小さなコミット**: 機能ごとにコミットを分ける
2. **テストの追加**: 新機能には必ずテストを追加
3. **型安全性**: TypeScriptの型を活用
4. **エラーハンドリング**: 適切なエラーハンドリングを実装
5. **ドキュメント更新**: 機能追加時はWikiも更新


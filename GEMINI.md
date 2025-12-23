# Gemini AI エージェント向けプロジェクト情報

このファイルは、Gemini AIエージェントがこのプロジェクトで作業する際の参考情報を提供します。

## プロジェクト概要

**Salmon Run Scenario Hub** は、Next.js 16 (App Router)、TypeScript、Tailwind CSS、Supabaseを使用したモダンなWebアプリケーションです。

## 技術スタック

- **フレームワーク**: Next.js 16.0.10 (App Router)
- **言語**: TypeScript 5.3.0
- **スタイリング**: Tailwind CSS 3.4.0
- **認証**: Supabase Auth (Google OAuth)
- **バックエンド**: Supabase
- **テスト**: Vitest 1.1.0, React Testing Library 14.1.2
- **Lint**: ESLint 9.0.0, eslint-config-next 16.0.10
- **通知**: sonner (toast通知)
- **アイコン**: Lucide React
- **コンテナ**: Docker
- **CI/CD**: GitHub Actions

## アーキテクチャ

### ディレクトリ構造

```
salmon-run-scenario-hub/
├── app/                    # Next.js App Router（ページとルート）
│   ├── auth/              # 認証フロー
│   ├── api/               # APIルート
│   │   └── scenarios/     # シナリオ関連API
│   │       └── [id]/      # シナリオ詳細API
│   ├── scenarios/         # シナリオページ
│   │   └── [id]/          # シナリオ詳細ページ
│   ├── types/             # 型定義
│   └── ...
├── lib/                    # 共有ライブラリ
│   ├── auth/              # 認証ロジック
│   └── supabase/          # Supabaseクライアント
├── supabase/              # データベースマイグレーション
│   └── migrations/        # マイグレーションファイル
├── proxy.ts               # リクエストミドルウェア
└── docs-wiki/             # ドキュメント（submodule）
```

### 認証フロー

1. ユーザーが`/auth/login`にアクセス
2. Google認証を開始（`signInWithGoogle()`）
3. Google認証後、`/auth/callback`にリダイレクト
4. セッションを確立し、ホームページにリダイレクト

### シナリオ詳細ページとソーシャル機能

1. ユーザーがシナリオカードをクリック
2. `/scenarios/[id]`に遷移
3. サーバーコンポーネントでシナリオ詳細を取得
4. クライアントコンポーネントでいいね・コメント機能を提供
5. いいねボタンクリックで即座にカウント更新
6. コメント投稿でリアルタイムに一覧に反映

## コーディングパターン

### クライアントコンポーネント

```typescript
'use client'

import { signInWithGoogle } from '@/lib/auth/google-auth'

export default function LoginButton() {
  const handleLogin = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return <button onClick={handleLogin}>ログイン</button>
}
```

### サーバーコンポーネント

```typescript
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()  // awaitが必要
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  return <div>Welcome, {user.email}</div>
}
```

### Route Handler

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  return NextResponse.json({ user })
}
```

### Dynamic Route Handler

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params  // awaitが必要
  const supabase = await createClient()
  
  // データ取得処理
  return NextResponse.json({ data })
}
```

## 重要な実装詳細

### 1. Next.js 16の変更

- **proxy.ts**: `middleware.ts`の代わり（新しい命名規則）
- **非同期cookies()**: `await cookies()`を使用
- **ESLint 9**: フラット設定形式（`eslint.config.mjs`）

### 2. Supabase SSR

```typescript
// サーバー側（lib/supabase/server.ts）
export async function createClient() {
  const cookieStore = await cookies()  // awaitが必要
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()  // 新しいAPI
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### 3. データベーステーブル

#### likes テーブル
- `id`: 主キー（SERIAL）
- `scenario_code`: シナリオコード（scenarios参照）
- `user_id`: ユーザーID（auth.users参照）
- `created_at`: 作成日時
- ユニーク制約: `(scenario_code, user_id)`

#### comments テーブル
- `id`: 主キー（SERIAL）
- `scenario_code`: シナリオコード（scenarios参照）
- `user_id`: ユーザーID（auth.users参照）
- `content`: コメント内容（1-1000文字）
- `created_at`: 作成日時
- `updated_at`: 更新日時

### 3. テストパターン

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

## 環境設定

### 必要な環境変数

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 開発環境

- Node.js 24.11.1
- npm 11.6.2
- Docker（オプション）

## 開発ワークフロー

### 1. 機能開発

```bash
# ブランチ作成
git checkout -b feature/new-feature

# 開発
npm run dev

# テスト
npm run test

# コミット
git commit -m "feat: add new feature"
```

### 2. テスト

- 新機能には必ずテストを追加
- カバレッジ80%以上を目標
- `__tests__`ディレクトリに配置

### 3. コードレビュー

- プルリクエストを作成
- CIが自動実行（Lint + Test）
- レビュー後にマージ

## よくある問題と解決策

### 問題1: 認証が動作しない

**原因**: 環境変数が設定されていない、またはSupabase設定が不完全

**解決策**:
1. `.env.local`を確認
2. Supabase DashboardでGoogle認証を有効化
3. リダイレクトURIを確認

### 問題2: ビルドエラー

**原因**: TypeScriptエラー、依存関係の問題

**解決策**:
```bash
npm ci
npm run build
```

### 問題3: テストが失敗する

**原因**: モックの設定ミス、非同期処理の問題

**解決策**:
1. `vi.mock()`の設定を確認
2. `await`の使用を確認
3. テスト環境の設定を確認

## ベストプラクティス

### 1. 型安全性

- `any`の使用を避ける
- 型定義を明示的に記述
- Supabaseの型を活用（`Database`型）

### 2. エラーハンドリング

```typescript
try {
  await someAsyncOperation()
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message)
  }
  // ユーザーに適切なエラーメッセージを表示
}
```

### 3. コンポーネント設計

- 小さなコンポーネントに分割
- 再利用可能なコンポーネントを作成
- プロップスの型を明示

### 4. パフォーマンス

- サーバーコンポーネントを優先
- クライアントコンポーネントは必要最小限
- 画像最適化（Next.js Image）

### 5. ソーシャル機能

- **いいね機能**: `likes`テーブルで管理、トグル式（追加/削除）
- **コメント機能**: `comments`テーブルで管理、リアルタイム更新
- **Toast通知**: sonnerを使用してユーザーフィードバックを提供
- **認証チェック**: いいね・コメントは認証済みユーザーのみ可能

## CI/CD

このプロジェクトでは、GitHub Actionsを使用してCI/CDパイプラインを構築しています。

### ワークフロー一覧

#### 1. CI Workflow (`.github/workflows/ci.yml`)

**トリガー**:
- `main`または`staging`ブランチへのpush
- `main`または`staging`ブランチへのプルリクエスト

**実行内容**:
1. **セキュリティ監査**: `npm audit --audit-level=high`で高レベルの脆弱性をチェック
2. **Lint実行**: ESLintによるコード品質チェック
3. **テスト実行**: Vitestによる単体テストとカバレッジ計測
4. **カバレッジレポート**: Codecovにテスト結果とカバレッジレポートをアップロード

**必要なSecrets**:
- `CODECOV_TOKEN`: Codecovへのアップロード用トークン

#### 2. Docker Publish Workflow (`.github/workflows/docker-publish.yml`)

**トリガー**:
- `main`ブランチへのpush

**実行内容**:
1. **Docker Buildx設定**: マルチプラットフォームビルドの準備
2. **レジストリログイン**:
   - GitHub Container Registry (`ghcr.io`)
   - Docker Hub
3. **メタデータ抽出**: イメージタグの自動生成
   - ブランチ名タグ
   - SHAプレフィックス付きタグ
   - `latest`タグ（`main`ブランチの場合のみ）
4. **イメージビルド & Push**: 
   - GitHub Container RegistryとDocker Hubの両方に同じイメージをpush
   - GitHub Actionsキャッシュを活用した高速ビルド

**必要なSecrets**:
- `DOCKERHUB_USERNAME`: Docker Hubのユーザー名
- `DOCKERHUB_TOKEN`: Docker Hubのアクセストークン

**イメージタグ形式**:
- `ghcr.io/eddie-splatoon/salmon-run-scenario-hub:main`
- `ghcr.io/eddie-splatoon/salmon-run-scenario-hub:main-<sha>`
- `ghcr.io/eddie-splatoon/salmon-run-scenario-hub:latest` (mainブランチのみ)
- `{DOCKERHUB_USERNAME}/salmon-run-scenario-hub:main`
- `{DOCKERHUB_USERNAME}/salmon-run-scenario-hub:main-<sha>`
- `{DOCKERHUB_USERNAME}/salmon-run-scenario-hub:latest` (mainブランチのみ)

#### 3. Sync Wiki Workflow (`.github/workflows/sync-wiki.yml`)

**トリガー**:
- `main`ブランチへのpush（`docs-wiki/**`パスへの変更時）
- 手動実行（`workflow_dispatch`）

**実行内容**:
1. **サブモジュールチェックアウト**: `docs-wiki`サブモジュールを取得
2. **存在確認**: `docs-wiki`ディレクトリの存在を確認
3. **Git設定**: Wikiリポジトリへのアクセス用にGit設定
4. **変更検知**: `docs-wiki`内の変更を検知
5. **Wiki同期**: 変更がある場合、GitHub Wikiリポジトリに自動的に同期

**必要なSecrets**:
- `WIKI_SYNC_TOKEN`: GitHub Wikiへの書き込み権限を持つPersonal Access Token

### 手動実行

```bash
# ローカルでCIと同じコマンドを実行
npm run lint
npm run test -- --run
```

### ワークフロー実行状況の確認

GitHubリポジトリの**Actions**タブから、各ワークフローの実行状況を確認できます。

## ドキュメント

- **README.md**: プロジェクトの概要とセットアップ
- **docs-wiki/**: 詳細なドキュメント（GitHub Wikiに同期）
- **docs/pr-descriptions/**: プルリクエストの説明ファイル（各Issue対応のPR説明）

## 参考リソース

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vitest Guide](https://vitest.dev/guide/)
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

## 開発時のチェックリスト

- [ ] 環境変数が設定されている
- [ ] テストが通る
- [ ] Lintエラーがない
- [ ] 型エラーがない
- [ ] エラーハンドリングが実装されている
- [ ] ドキュメントが更新されている
- [ ] Issueの要件を全て対応している
- [ ] Pull Requestにmermaid図を追加している
- [ ] AIエージェント向けファイルを更新している


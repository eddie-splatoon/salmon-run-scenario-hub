# シナリオ詳細ページとソーシャル（いいね・コメント）機能

## 概要

特定のシナリオの詳細情報をWAVEごとに表示し、ユーザーがコードのコピー、いいね、コメントを行えるようにする機能を実装しました。

## 変更内容

### データベース
- `likes` テーブルを作成（シナリオへのいいねを管理）
- `comments` テーブルを作成（シナリオへのコメントを管理）
- RLSポリシーを設定（全ユーザーが閲覧可能、認証済みユーザーのみ作成可能）

### API
- `GET /api/scenarios/[id]`: シナリオ詳細情報を取得
- `POST /api/scenarios/[id]/likes`: いいねを追加/削除（トグル式）
- `GET /api/scenarios/[id]/comments`: コメント一覧を取得
- `POST /api/scenarios/[id]/comments`: コメントを投稿

### フロントエンド
- `app/scenarios/[id]/page.tsx`: シナリオ詳細ページ（サーバーコンポーネント）
- `app/scenarios/[id]/ScenarioDetailClient.tsx`: クライアントコンポーネント（いいね・コメント機能）
- WAVE別詳細テーブル（潮位/イベントをバッジで色分け）
- シナリオコードの「ワンクリックコピー」ボタン
- いいねボタン（即座にカウント更新）
- コメント投稿・表示機能
- sonnerを使用したtoast通知

### その他
- `ScenarioCard`コンポーネントにリンクを追加
- `layout.tsx`にToasterを追加
- データベース型定義を更新
- テストファイルを追加

## 処理フロー

### シナリオ詳細ページ表示

```mermaid
sequenceDiagram
    participant User
    participant Page
    participant Supabase
    participant Client

    User->>Page: シナリオ詳細ページにアクセス
    Page->>Supabase: シナリオ基本情報取得
    Page->>Supabase: WAVE情報取得
    Page->>Supabase: 武器情報取得
    Page->>Supabase: いいね数取得
    Page->>Supabase: コメント数取得
    Page->>Supabase: ユーザーのいいね状態確認
    Supabase-->>Page: データ返却
    Page->>Client: 初期データを渡す
    Client-->>User: 詳細ページを表示
```

### いいね機能

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant API
    participant Supabase

    User->>Client: いいねボタンをクリック
    Client->>API: POST /api/scenarios/[id]/likes
    API->>Supabase: 認証チェック
    API->>Supabase: 既存のいいねを確認
    alt いいねが存在しない場合
        API->>Supabase: いいねを追加
    else いいねが存在する場合
        API->>Supabase: いいねを削除
    end
    API->>Supabase: いいね数を取得
    Supabase-->>API: 結果返却
    API-->>Client: 更新されたいいね状態とカウント
    Client->>Client: 状態を更新
    Client-->>User: UIを更新（即座に反映）
```

### コメント機能

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant API
    participant Supabase

    User->>Client: コメントを入力して投稿
    Client->>API: POST /api/scenarios/[id]/comments
    API->>Supabase: 認証チェック
    API->>Supabase: バリデーション（1-1000文字）
    API->>Supabase: コメントを追加
    Supabase-->>API: 追加されたコメント
    API-->>Client: コメントデータ
    Client->>Client: コメント一覧に追加
    Client->>Client: コメント数を更新
    Client-->>User: toast通知表示
    Client-->>User: UIを更新（リアルタイム反映）
```

### コードコピー機能

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant Clipboard

    User->>Client: 「コードをコピー」ボタンをクリック
    Client->>Clipboard: navigator.clipboard.writeText()
    Clipboard-->>Client: コピー成功
    Client->>Client: toast通知を表示
    Client-->>User: 「シナリオコードをコピーしました」を表示
```

## テスト

以下のテストを追加しました：

- `GET /api/scenarios/[id]`: シナリオ詳細取得のテスト
- `POST /api/scenarios/[id]/likes`: いいね追加/削除のテスト
- `GET /api/scenarios/[id]/comments`: コメント一覧取得のテスト
- `POST /api/scenarios/[id]/comments`: コメント投稿のテスト

## UI/UXの改善

- **潮位の色分け**: 干潮（青）、普通（緑）、満潮（赤）で視覚的に分かりやすく表示
- **即座のフィードバック**: いいねボタンを押すと即座にカウントが更新される
- **Toast通知**: コピー成功、コメント投稿成功などの操作結果を通知
- **レスポンシブデザイン**: モバイル・デスクトップ両対応

## 関連Issue

Closes #12



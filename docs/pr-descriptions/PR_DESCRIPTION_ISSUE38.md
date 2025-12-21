## 概要
Issue #38のUI改善を実装しました。シナリオカードとシナリオ詳細に投稿者情報を表示し、ハッシュタグ機能を追加、ヘッダーのユーザー表示を改善しました。

## 変更内容
- シナリオカードに投稿者アイコンを表示
- シナリオ詳細に投稿者情報を表示
- ハッシュタグ機能の追加（シナリオ詳細画面に表示）
- ヘッダーのユーザー表示改善（アイコン表示、Email非表示）
- シナリオ一覧にクマサン印フィルタを追加
- プロフィールテーブルの作成
- 管理者登録用のマイグレーションファイル追加

## 処理フロー

```mermaid
sequenceDiagram
    participant User
    participant Page
    participant API
    participant Supabase
    
    User->>Page: ページ表示
    Page->>API: シナリオ一覧取得（author_id含む）
    API->>Supabase: シナリオ情報取得
    Supabase-->>API: シナリオ情報（author_id含む）
    API-->>Page: シナリオ一覧
    Page->>API: 投稿者情報取得（/api/users/[id]）
    API->>Supabase: プロフィール情報取得
    Supabase-->>API: プロフィール情報
    API-->>Page: 投稿者情報
    Page-->>User: 投稿者アイコン表示
```

## ハッシュタグの計算ロジック

```mermaid
flowchart TD
    A[シナリオ情報] --> B{キケン度 < 160%?}
    B -->|Yes| C[初心者向けタグ]
    B -->|No| D{全WAVE未クリア?}
    D -->|Yes| E[未クリアタグ]
    D -->|No| F{キケン度 = 333% && 途中でfail?}
    F -->|Yes| G[高難易度タグ]
    F -->|No| H{総納品数 > 200?}
    H -->|Yes| I[乱獲向けタグ]
    H -->|No| J{イベント数判定}
    J -->|0| K[昼のみタグ]
    J -->|1| L[夜1タグ]
    J -->|2| M[夜2タグ]
    J -->|3| N[夜のみタグ]
    O{EX WAVEあり?} -->|Yes| P[オカシラありタグ]
```

## テスト
- [x] ESLintチェック完了
- [ ] 単体テストを追加（将来の改善項目）
- [ ] 統合テストを実行（将来の改善項目）
- [ ] 手動テストを実施

## 注意事項
- プロフィールテーブル（`profiles`）を作成するマイグレーションを追加しました。マイグレーションを実行してください。
- 管理者の登録は、Supabase Dashboardで手動で実行する必要があります（`supabase/migrations/010_add_admin_eddie.sql`を参照）。
- TOPページのフィルタ機能改善（クライアントサイドフィルタリング、スクロール位置保持）は、大きな変更になるため、将来の改善項目として残しています。

## 関連Issue
Closes #38


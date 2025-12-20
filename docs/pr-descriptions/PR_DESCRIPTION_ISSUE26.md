# サイト内検索機能の強化と「今週のトレンド」表示

## 概要

ユーザーが特定のシナリオをより早く見つけられるようにし、また活発なコミュニティ感を演出するため、以下の機能を実装しました。

## 変更内容

### フロントエンド

#### ヘッダー
- `app/components/layout/Header.tsx`: シナリオコード直接入力検索窓を追加
  - デスクトップとモバイルの両方に対応
  - 16桁のシナリオコードを入力して即座に詳細ページへ遷移
  - 検索アイコン付きの入力フィールド

#### TOPページ
- `app/page.tsx`: 「今週のトレンド」セクションを追加
  - 今週（月曜日00:00:00から）のいいね数が多いシナリオをランキング表示
  - いいね数バッジ付きで表示
  - クイックフィルタボタンを追加
    - `#クマサン印あり`: クマサン印の武器を含むシナリオをフィルタ
    - `#カンスト向け`: キケン度333%のシナリオをフィルタ

### API

- `app/api/scenarios/route.ts`: クイックフィルタのパラメータ処理を追加
  - `filter=grizzco`: クマサン印の武器を含むシナリオをフィルタ
  - `filter=max_danger`: キケン度333%のシナリオをフィルタ

### テスト

- `app/components/layout/__tests__/Header.test.tsx`: ヘッダー検索機能のテスト
  - 検索入力の表示確認
  - シナリオコード入力時の遷移確認
  - 検索後の入力クリア確認
  - 最大文字数制限の確認

- `app/api/__tests__/scenarios.test.ts`: クイックフィルタのテスト
  - `filter=max_danger`のテスト
  - `filter=grizzco`のテスト

## 処理フロー

### シナリオコード検索

```mermaid
sequenceDiagram
    participant User
    participant Header
    participant Router
    participant DetailPage

    User->>Header: シナリオコードを入力
    User->>Header: Enterキーを押す
    Header->>Header: 入力値を検証
    Header->>Router: /scenarios/{code} に遷移
    Router->>DetailPage: シナリオ詳細ページを表示
    Header->>Header: 入力フィールドをクリア
```

### 今週のトレンド取得

```mermaid
sequenceDiagram
    participant User
    participant Page
    participant Supabase
    participant Likes
    participant Scenarios

    User->>Page: TOPページにアクセス
    Page->>Page: 今週の開始日時を計算（月曜日00:00:00）
    Page->>Supabase: 今週のいいねを取得
    Supabase->>Likes: created_at >= 今週の開始日時
    Likes-->>Page: いいねデータ
    Page->>Page: シナリオコードごとにいいね数を集計
    Page->>Page: いいね数でソート（降順）
    Page->>Supabase: 上位シナリオの詳細を取得
    Supabase->>Scenarios: シナリオ情報を取得
    Scenarios-->>Page: シナリオデータ
    Page->>Supabase: 武器情報を取得
    Supabase-->>Page: 武器データ
    Page->>User: トレンドシナリオを表示
```

### クイックフィルタ

```mermaid
sequenceDiagram
    participant User
    participant Page
    participant API
    participant Supabase
    participant Scenarios
    participant Weapons

    User->>Page: クイックフィルタボタンをクリック
    Page->>API: GET /api/scenarios?filter={type}
    
    alt filter=grizzco
        API->>Supabase: クマサン武器を取得
        Supabase->>Weapons: is_grizzco_weapon = true
        Weapons-->>API: クマサン武器IDリスト
        API->>Supabase: シナリオを取得
        Supabase->>Scenarios: シナリオ情報
        Scenarios-->>API: シナリオデータ
        API->>Supabase: 武器情報を取得
        Supabase->>Weapons: シナリオの武器
        Weapons-->>API: 武器データ
        API->>API: クマサン武器を含むシナリオをフィルタ
    else filter=max_danger
        API->>Supabase: シナリオを取得（danger_rate = 333）
        Supabase->>Scenarios: キケン度333%のシナリオ
        Scenarios-->>API: シナリオデータ
        API->>Supabase: 武器情報を取得
        Supabase-->>API: 武器データ
    end
    
    API-->>Page: フィルタリングされたシナリオ一覧
    Page->>User: フィルタ結果を表示
```

## テスト

- [x] ヘッダー検索機能の単体テスト
- [x] クイックフィルタAPIのテスト
- [x] 今週のトレンド取得の動作確認

## 関連Issue

Closes #26


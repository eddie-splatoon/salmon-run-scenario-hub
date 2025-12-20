## 概要
マイルストーン7「ふりかえり」配下の4つのIssueに対応しました。UX改善、名寄せ処理の堅牢化、UI操作性向上、重複検知機能の強化を実施しました。

## 変更内容

### Issue #31: 画像アップロード中のローディング状態とプレビュー表示の改善
- 解析中のスケルトン表示とカスタムローディングアニメーション（「クマサンが解析中...」）を追加
- 画像ファイルのバリデーション（ファイルタイプチェック、10MBサイズ制限）を実装
- エラーハンドリングを強化し、わかりやすいエラーメッセージを表示

### Issue #32: AI解析結果の「名寄せ」処理の堅牢化
- Levenshtein距離を使った柔軟な表記揺れ吸収ロジックを実装
- 部分一致と類似度マッチング（70%以上の類似度）の組み合わせで精度向上
- 「ムニ・エール」と「ムニエル」のような表記揺れに対応

### Issue #33: 解析結果修正UIの操作性向上とバリデーション
- ノルマ/納品数の整合性チェックを追加（納品数がノルマ未満の場合に警告表示）
- 数値入力フィールドのバリデーションを強化（負の数値の防止）

### Issue #34: 投稿済みシナリオの重複検知とユーザーへの通知
- 重複検知時に既存シナリオの詳細ページへのリンクを表示
- 重複時は保存ボタンを無効化して、無駄な保存試行を防止

## 処理フロー

### 画像解析フロー
\`\`\`mermaid
sequenceDiagram
    participant User
    participant ImageAnalyzer
    participant API
    participant Supabase
    
    User->>ImageAnalyzer: 画像を選択
    ImageAnalyzer->>ImageAnalyzer: ファイルバリデーション
    ImageAnalyzer->>ImageAnalyzer: プレビュー表示
    User->>ImageAnalyzer: 解析ボタンをクリック
    ImageAnalyzer->>ImageAnalyzer: ローディング表示
    ImageAnalyzer->>API: 画像解析リクエスト
    API->>API: Gemini APIで解析
    API->>Supabase: 名寄せ処理（Levenshtein距離）
    Supabase-->>API: マスタID
    API-->>ImageAnalyzer: 解析結果
    ImageAnalyzer->>Supabase: 重複チェック
    Supabase-->>ImageAnalyzer: 重複情報
    ImageAnalyzer->>User: 解析結果と重複警告を表示
\`\`\`

### 名寄せ処理フロー
\`\`\`mermaid
flowchart TD
    A[AI解析結果] --> B{完全一致?}
    B -->|Yes| C[マスタIDを返す]
    B -->|No| D{エイリアス一致?}
    D -->|Yes| C
    D -->|No| E{部分一致?}
    E -->|Yes| F{スコア>0.5?}
    F -->|Yes| C
    F -->|No| G[Levenshtein距離計算]
    E -->|No| G
    G --> H{類似度>=0.7?}
    H -->|Yes| C
    H -->|No| I[nullを返す]
\`\`\`

## テスト
- [x] 名寄せ処理のテストを追加（`lib/utils/__tests__/master-lookup.test.ts`）
- [x] 重複チェックAPIのテストを追加（`app/api/__tests__/scenarios-check.test.ts`）
- [x] ESLintチェックを実行（エラーなし）

## 関連Issue
Closes #31
Closes #32
Closes #33
Closes #34


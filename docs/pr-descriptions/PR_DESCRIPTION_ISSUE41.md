## 概要

CIでの依存関係脆弱性スキャンの自動化を実装しました。GitHub Actionsに`npm audit`を組み込み、プルリクエスト作成時に自動で脆弱性チェックを実行し、重大な脆弱性が発見された場合にビルドを失敗させるようにしました。

## 変更内容

- GitHub ActionsのCIワークフローに脆弱性スキャンステップを追加
  - `npm audit --audit-level=high`を実行
  - 重大な脆弱性（high以上）が発見された場合にビルドを失敗させる設定
- package.jsonにauditスクリプトを追加
  - `npm run audit`: 脆弱性スキャンを実行
  - `npm run audit:fix`: 自動修正可能な脆弱性を修正

## 処理フロー

```mermaid
sequenceDiagram
    participant Developer
    participant GitHub
    participant CI
    participant npm
    
    Developer->>GitHub: プルリクエスト作成
    GitHub->>CI: CIワークフローをトリガー
    CI->>CI: コードをチェックアウト
    CI->>CI: Node.jsをセットアップ
    CI->>CI: 依存関係をインストール (npm ci)
    CI->>npm: 脆弱性スキャンを実行 (npm audit)
    npm-->>CI: スキャン結果を返す
    
    alt 重大な脆弱性が発見された場合
        CI->>CI: ビルドを失敗させる
        CI-->>GitHub: ステータス: 失敗
        GitHub-->>Developer: プルリクエストに失敗を表示
    else 脆弱性がない、または軽微な脆弱性のみ
        CI->>CI: 次のステップ（リンター、テスト）に進む
        CI-->>GitHub: ステータス: 成功
        GitHub-->>Developer: プルリクエストに成功を表示
    end
```

## テスト

- [x] CIワークフローが正常に実行されることを確認
- [x] 脆弱性スキャンが適切に実行されることを確認
- [x] ESLintチェックを実行し、エラーがないことを確認

## 関連Issue

Closes #41


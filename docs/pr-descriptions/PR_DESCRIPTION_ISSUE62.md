## 概要

GitHub Actionsのパイプラインを改善し、ワークフロー間の連携を適切に動作するように修正しました。

## 変更内容

- `cd.yml`を`docker-publish.yml`にリネーム（ワークフロー名も「Docker Publish」に更新）
- `preview-security-scan.yml`と`zap-scan.yml`を統合し、`vercel-security-scan.yml`として作成
- PR時とmainブランチpush時の両方に対応
- OWASP/ZAPスキャンがスキップされる問題を修正（`workflow_run`の条件を明確化）

## 処理フロー

### Pull Request作成時

```mermaid
sequenceDiagram
    participant Developer
    participant GitHub
    participant DeployWorkflow
    participant VercelPreview
    participant SecurityScanWorkflow
    participant OWASPZAP
    participant PR

    Developer->>GitHub: PRを作成
    GitHub->>DeployWorkflow: deploy.ymlをトリガー
    DeployWorkflow->>VercelPreview: Preview環境にデプロイ
    VercelPreview-->>DeployWorkflow: デプロイ完了
    DeployWorkflow->>PR: プレビューURLをコメント
    DeployWorkflow-->>GitHub: workflow_run完了
    GitHub->>SecurityScanWorkflow: vercel-security-scan.ymlをトリガー
    SecurityScanWorkflow->>PR: プレビューURLを取得
    SecurityScanWorkflow->>OWASPZAP: 脆弱性スキャン実行
    OWASPZAP-->>SecurityScanWorkflow: スキャン結果
    SecurityScanWorkflow->>PR: スキャン結果をコメント
    SecurityScanWorkflow->>GitHub: セキュリティレポートをアップロード
```

### mainブランチマージ時

```mermaid
sequenceDiagram
    participant Developer
    participant GitHub
    participant DeployWorkflow
    participant VercelProduction
    participant SecurityScanWorkflow
    participant OWASPZAP

    Developer->>GitHub: mainブランチにマージ
    GitHub->>DeployWorkflow: deploy.ymlをトリガー
    DeployWorkflow->>VercelProduction: 本番環境にデプロイ
    VercelProduction-->>DeployWorkflow: デプロイ完了
    DeployWorkflow-->>GitHub: workflow_run完了
    GitHub->>SecurityScanWorkflow: vercel-security-scan.ymlをトリガー
    SecurityScanWorkflow->>VercelProduction: 本番環境URLを取得
    SecurityScanWorkflow->>OWASPZAP: 脆弱性スキャン実行
    OWASPZAP-->>SecurityScanWorkflow: スキャン結果
    SecurityScanWorkflow->>GitHub: セキュリティレポートをアップロード
    SecurityScanWorkflow->>GitHub: ワークフローサマリーに結果を表示
```

## 主な改善点

1. **ワークフロー名の明確化**
   - `cd.yml` → `docker-publish.yml`（より明確な名称に変更）

2. **ワークフローの統合**
   - `preview-security-scan.yml`と`zap-scan.yml`を統合し、重複を排除
   - PR時とmainブランチpush時の両方に対応する単一のワークフローに統合

3. **スキップ問題の修正**
   - `workflow_run`の条件を明確化し、PR時とmainブランチpush時の両方で確実に実行されるように修正
   - 条件式を簡潔にし、可読性を向上

4. **環境判定の改善**
   - PR時は自動的にプレビュー環境として判定
   - mainブランチpush時は本番環境として判定
   - `workflow_dispatch`時は手動で環境を指定可能

## テスト

- [ ] ESLintチェックを実行（問題なし）
- [ ] 脆弱性チェックを実行（high以上の脆弱性なし）
- [ ] ワークフローの構文を確認

## 関連Issue
Fixes #62


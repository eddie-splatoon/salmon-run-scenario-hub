## 概要

現状の分割されたワークフロー（`deploy-preview.yml`、`deploy-production.yml`、`vercel-security-scan.yml`）を統合・再編し、セキュリティスキャン（OWASP ZAP）の結果をデプロイの成否判定（ゲート）として機能させる、堅牢なCI/CDパイプラインを構築しました。

## 変更内容

- **ワークフローの統合**: 3つのワークフローファイルを1つの`deploy-and-scan.yml`に統合
- **ジョブ間の依存関係**: `needs`を使用してジョブ間の依存関係を明確化
- **outputs連携**: Artifact経由ではなく、ジョブ間の`outputs`でURLとスキャン結果を連携
- **セキュリティゲート**: `scan-preview`の成功を`deploy-production`の実行条件として設定
- **Vercel環境変数同期**: 全デプロイジョブで`vercel pull --yes`を実行して環境変数を同期
- **動的URLのキャプチャ**: `vercel deploy`の標準出力からURLを抽出して後続ジョブに渡す

## 処理フロー

### Pull Request作成/更新時

```mermaid
sequenceDiagram
    participant PR
    participant GitHub
    participant DeployPreview
    participant ScanPreview
    participant Vercel
    
    PR->>GitHub: Pull Request作成/更新
    GitHub->>DeployPreview: deploy-previewジョブ実行
    DeployPreview->>Vercel: vercel pull --yes (環境変数同期)
    DeployPreview->>Vercel: vercel build
    DeployPreview->>Vercel: vercel deploy --prebuilt
    Vercel-->>DeployPreview: デプロイURL返却
    DeployPreview->>PR: デプロイURLをコメント
    DeployPreview-->>ScanPreview: URLをoutputsで渡す
    GitHub->>ScanPreview: scan-previewジョブ実行
    ScanPreview->>ScanPreview: デプロイ完了を待機
    ScanPreview->>ScanPreview: OWASP ZAPスキャン実行
    ScanPreview->>PR: スキャン結果をコメント
```

### mainブランチへのマージ（Push）時

```mermaid
sequenceDiagram
    participant Main
    participant GitHub
    participant DeployPreview
    participant ScanPreview
    participant DeployProduction
    participant ScanProduction
    participant Vercel
    
    Main->>GitHub: mainブランチへpush
    GitHub->>DeployPreview: deploy-previewジョブ実行
    DeployPreview->>Vercel: vercel pull --yes (環境変数同期)
    DeployPreview->>Vercel: vercel build
    DeployPreview->>Vercel: vercel deploy --prebuilt
    Vercel-->>DeployPreview: デプロイURL返却
    DeployPreview-->>ScanPreview: URLをoutputsで渡す
    GitHub->>ScanPreview: scan-previewジョブ実行
    ScanPreview->>ScanPreview: OWASP ZAPスキャン実行
    ScanPreview-->>ScanPreview: スキャン結果を解析
    
    alt スキャン成功（重大な問題なし）
        ScanPreview-->>DeployProduction: scan_passed=true
        GitHub->>DeployProduction: deploy-productionジョブ実行
        DeployProduction->>Vercel: vercel pull --yes (環境変数同期)
        DeployProduction->>Vercel: vercel build --prod
        DeployProduction->>Vercel: vercel deploy --prebuilt --prod
        Vercel-->>DeployProduction: 本番デプロイURL返却
        DeployProduction-->>ScanProduction: URLをoutputsで渡す
        GitHub->>ScanProduction: scan-productionジョブ実行
        ScanProduction->>ScanProduction: OWASP ZAPスキャン実行
        ScanProduction->>GitHub: スキャン結果をレポート
    else スキャン失敗（重大な問題あり）
        ScanPreview-->>DeployProduction: scan_passed=false
        GitHub->>DeployProduction: ジョブをスキップ（if条件で制御）
    end
```

## 主な改善点

### 1. ワークフローの依存関係と制御

- 全てのジョブを`needs`で繋ぎ、順次実行を保証
- `deploy-production`には以下の条件を付与：
  - `github.event_name == 'push' && github.ref == 'refs/heads/main'`
  - `needs.deploy-preview.result == 'success'`
  - `needs.scan-preview.result == 'success'`
  - `needs.scan-preview.outputs.scan_passed == 'true'`

### 2. Vercel環境変数の同期

- 各デプロイ・ビルドジョブの開始前に`vercel pull --yes`を実行
- `VERCEL_ORG_ID`および`VERCEL_PROJECT_ID`をGitHub Secretsから取得して使用

### 3. 動的URLのキャプチャとZAP実行

- `vercel deploy`の標準出力をキャプチャし、`https://*.vercel.app`形式のURLを抽出
- 抽出したURLを`outputs`として後続ジョブに渡す
- Artifact経由ではなく、ジョブ間の`outputs`連携に切り替え

### 4. セキュリティゲートの実装

- `scan-preview`ジョブで`outputs.scan_passed`を設定
- 重大な問題（High Risk Issues）が検出された場合、`scan_passed=false`を設定
- `deploy-production`は`scan_passed == 'true'`の場合のみ実行

## テスト

- [x] ワークフローの構文チェック
- [x] ジョブ間の依存関係の確認
- [x] outputs連携の確認
- [x] 条件分岐の確認

## 関連Issue

Closes #64

